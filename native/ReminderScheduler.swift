import Foundation
import UserNotifications

private extension UNNotificationRequest {
    var nextFireDate: Date? {
        if let calendar = trigger as? UNCalendarNotificationTrigger { return calendar.nextTriggerDate() }
        if let interval = trigger as? UNTimeIntervalNotificationTrigger { return interval.nextTriggerDate() }
        return nil
    }
}

actor ReminderScheduler {
    static let shared = ReminderScheduler()
    private let center = UNUserNotificationCenter.current()
    private let defaults = UserDefaults.standard
    private let planKey = "water.native.plan.v1"
    private let pausedKey = "water.native.paused.v1"
    private let testSoundKey = "water.native.test-sound.v1"
    private let soundStore = ReminderSoundStore.live
    private var busy = false

    // Actor methods may reenter while awaiting UNUserNotificationCenter.
    // Keep replacement and rollback transactions serialized, including notification actions.
    private func acquire() async {
        while busy { try? await Task.sleep(nanoseconds: 25_000_000) }
        busy = true
    }
    private func pending() async -> [UNNotificationRequest] {
        await withCheckedContinuation { continuation in
            center.getPendingNotificationRequests { continuation.resume(returning: $0) }
        }
    }
    private func settings() async -> UNNotificationSettings {
        await withCheckedContinuation { continuation in
            center.getNotificationSettings { continuation.resume(returning: $0) }
        }
    }
    private func add(_ request: UNNotificationRequest) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            center.add(request) { error in
                if let error = error { continuation.resume(throwing: error) }
                else { continuation.resume(returning: ()) }
            }
        }
    }
    private func storedPlan() throws -> ReminderPlan {
        guard let data = defaults.data(forKey: planKey) else {
            throw ReminderError.invalid("请先在 App 中保存提醒安排。")
        }
        let plan = try JSONDecoder().decode(ReminderPlan.self, from: data)
        try plan.validate()
        return plan
    }
    private func requirePermission() async throws {
        let value = await settings()
        guard [.authorized, .provisional, .ephemeral].contains(value.authorizationStatus) else {
            throw ReminderError.invalid("请先在 iPhone 设置中允许「记得」发送通知。")
        }
    }
    private func verifySound(_ sound: String) throws {
        guard ReminderPlan.sounds.contains(sound),
              Bundle.main.url(forResource: String(sound.dropLast(4)), withExtension: "wav") != nil else {
            throw ReminderError.invalid("提示音资源缺失，请重新安装完整 App。")
        }
    }
    private func content(soundName: String?) -> UNMutableNotificationContent {
        let value = UNMutableNotificationContent()
        value.title = "喝口水吧"
        value.body = "忙到这里，也照顾一下自己。"
        if let name = soundName { value.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: name)) }
        value.categoryIdentifier = "WATER_REMINDER"
        value.threadIdentifier = "water-reminders"
        return value
    }
    private func requests(for plan: ReminderPlan) throws -> [UNNotificationRequest] {
        let prepared = try soundStore.prepare(sound: plan.sound, volume: plan.volume ?? 100)
        return plan.requests.compactMap { rule in
            let trigger = UNCalendarNotificationTrigger(dateMatching: rule.components, repeats: rule.repeats)
            guard trigger.nextTriggerDate() != nil else { return nil }
            return UNNotificationRequest(identifier: rule.id, content: content(soundName: prepared.name), trigger: trigger)
        }
    }
    private func cleanupPreparedSounds() {
        var names = Set<String>()
        if let plan = try? storedPlan(), let volume = plan.volume, volume > 0 && volume < 100,
           let name = try? soundStore.cacheName(sound: plan.sound, volume: volume) {
            names.insert(name)
        }
        if let testName = defaults.string(forKey: testSoundKey) { names.insert(testName) }
        soundStore.prune(keeping: names)
    }
    private func replace(with requests: [UNNotificationRequest]) async throws {
        let previous = await pending().filter { $0.identifier.hasPrefix("water.") && $0.identifier != "water.test" }
        center.removePendingNotificationRequests(withIdentifiers: previous.map(\.identifier))
        do {
            for request in requests { try await add(request) }
            let savedIDs = Set(await pending().map(\.identifier))
            // A one-off may have fired during the save; it need not remain pending.
            let expected = requests.filter { $0.nextFireDate != nil }
            guard expected.allSatisfy({ savedIDs.contains($0.identifier) }) else {
                throw ReminderError.invalid("iPhone 未完整保存提醒，请调整安排后重试。")
            }
        } catch {
            center.removePendingNotificationRequests(withIdentifiers: requests.map(\.identifier))
            var restored = true
            for request in previous where request.nextFireDate != nil {
                do { try await add(request) } catch { restored = false }
            }
            if !restored {
                throw ReminderError.invalid("保存失败，旧提醒也未能完整恢复。请打开 App 重新保存安排。")
            }
            throw error
        }
    }
    private func snapshot() async -> [String: Any] {
        let value = await settings()
        let permission: String
        switch value.authorizationStatus {
        case .authorized, .provisional, .ephemeral: permission = "granted"
        case .notDetermined: permission = "prompt"
        default: permission = "denied"
        }
        let plan = try? storedPlan()
        let pendingRequests = await pending()
        let testAt = pendingRequests.first { $0.identifier == "water.test" }?.nextFireDate
        let all = pendingRequests.filter { $0.identifier.hasPrefix("water.rule.") || $0.identifier == "water.snooze" }
        let next = all.compactMap { $0.nextFireDate }.min()
        let savedIDs = Set(all.map(\.identifier))
        let healthy = defaults.bool(forKey: pausedKey) || plan.map { value in
            value.requests.filter { UNCalendarNotificationTrigger(dateMatching: $0.components, repeats: $0.repeats).nextTriggerDate() != nil }
                .allSatisfy { savedIDs.contains($0.id) } && soundStore.isAvailable(sound: value.sound, volume: value.volume ?? 100)
        } ?? false
        return ["planHealthy": healthy, "permission": permission, "hasPlan": plan != nil,
                "configuration": plan?.configuration ?? "", "paused": defaults.bool(forKey: pausedKey),
                "pendingCount": all.count, "nextReminderAt": next.map { $0.timeIntervalSince1970 * 1000 } as Any? ?? NSNull(),
                "soundEnabled": value.soundSetting == .enabled,
                "savedSound": plan?.sound ?? "",
                "savedVolume": plan?.displayVolume as Any? ?? NSNull(),
                "soundResourceAvailable": plan.map { soundStore.isAvailable(sound: $0.sound, volume: $0.volume ?? 100) } ?? false,
                "testReminderAt": testAt.map { $0.timeIntervalSince1970 * 1000 } as Any? ?? NSNull()]
    }
    func status() async -> [String: Any] {
        await acquire(); defer { busy = false }
        var notice: String?
        if let previous = try? storedPlan() {
            do {
                if let updated = try previous.replacingRetiredSound() {
                    if !defaults.bool(forKey: pausedKey) {
                        try await requirePermission()
                        try await replace(with: try requests(for: updated))
                    }
                    defaults.set(try JSONEncoder().encode(updated), forKey: planKey)
                    notice = "原提示音已移除，已改用清泉水琴。提醒时间保持原样。"
                }
            } catch { notice = "原提示音已移除，请在声音设置中重新保存。" }
        }
        var value = await snapshot()
        if let notice = notice { value["soundMigrationNotice"] = notice }
        return value
    }
    func requestPermission() async throws -> [String: Any] {
        _ = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Bool, Error>) in
            center.requestAuthorization(options: [.alert, .sound]) { allowed, error in
                if let error = error { continuation.resume(throwing: error) }
                else { continuation.resume(returning: allowed) }
            }
        }
        return await status()
    }
    func configure(json: String, paused: Bool = false) async throws -> [String: Any] {
        await acquire(); defer { busy = false }
        guard let data = json.data(using: .utf8) else { throw ReminderError.invalid("设置无法读取。") }
        let plan = try JSONDecoder().decode(ReminderPlan.self, from: data)
        try plan.validate(); try verifySound(plan.sound); try await requirePermission()
        let all = try requests(for: plan)
        guard !all.isEmpty else { throw ReminderError.invalid("指定日期已全部结束，请选择未来日期。") }
        try await replace(with: paused ? [] : all)
        defaults.set(try JSONEncoder().encode(plan), forKey: planKey)
        defaults.set(paused, forKey: pausedKey)
        cleanupPreparedSounds()
        center.removeDeliveredNotifications(withIdentifiers: ["water.paused", "water.action-error"])
        return await snapshot()
    }
    func setPaused(_ paused: Bool) async throws -> [String: Any] {
        await acquire(); defer { busy = false }
        let plan = try storedPlan()
        if paused {
            try await replace(with: [])
            defaults.set(true, forKey: pausedKey)
            let value = UNMutableNotificationContent()
            value.title = "喝水提醒已暂停"
            value.body = "需要时长按这条通知，选择「恢复提醒」，或打开 App 恢复。"
            value.categoryIdentifier = "WATER_PAUSED"
            // Pause confirmation is intentionally silent.
            try? await add(UNNotificationRequest(identifier: "water.paused", content: value,
                        trigger: UNCalendarNotificationTrigger(dateMatching: oneOffComponents(at: Date().addingTimeInterval(1)), repeats: false)))
        } else {
            try verifySound(plan.sound); try await requirePermission()
            let all = try requests(for: plan)
            guard !all.isEmpty else { throw ReminderError.invalid("所选日期已结束，请打开 App 添加新日期。") }
            try await replace(with: all)
            defaults.set(false, forKey: pausedKey)
            center.removeDeliveredNotifications(withIdentifiers: ["water.paused", "water.action-error"])
        }
        return await snapshot()
    }
    func snooze() async throws -> [String: Any] {
        await acquire(); defer { busy = false }
        let plan = try storedPlan()
        guard !defaults.bool(forKey: pausedKey) else { throw ReminderError.invalid("提醒已暂停，请先恢复。") }
        try await requirePermission()
        let now = Date()
        let next = await pending().filter { $0.identifier.hasPrefix("water.rule.") }
            .compactMap { $0.nextFireDate }.min()
        let target = snoozeTarget(now: now, nextRegular: next)
        center.removePendingNotificationRequests(withIdentifiers: ["water.snooze"])
        if next != target {
            let prepared = try soundStore.prepare(sound: plan.sound, volume: plan.volume ?? 100)
            try await add(UNNotificationRequest(identifier: "water.snooze", content: content(soundName: prepared.name),
                trigger: UNCalendarNotificationTrigger(dateMatching: oneOffComponents(at: target), repeats: false)))
        }
        return await snapshot()
    }
    func test(sound: String, useSystemSound: Bool = false, volume: Int = 100) async throws -> [String: Any] {
        await acquire(); defer { busy = false }
        if !useSystemSound { try verifySound(sound); try ReminderSoundStore.validateVolume(volume) }
        try await requirePermission()
        let systemSoundEnabled = await settings().soundSetting == .enabled
        guard (!useSystemSound && volume == 0) || systemSoundEnabled else {
            throw ReminderError.invalid("系统未允许通知发声，请在 iPhone 设置中开启「记得」的声音。")
        }
        if let scheduled = await pending().first(where: { $0.identifier == "water.test" })?.nextFireDate,
           scheduled > Date() {
            throw ReminderError.invalid("已有一条测试等待送达，请听完后再测试，避免覆盖上一条。")
        }
        let prepared: PreparedReminderSound?
        if useSystemSound { prepared = nil }
        else { prepared = try soundStore.prepare(sound: sound, volume: volume) }
        let value = content(soundName: prepared?.name)
        if useSystemSound { value.sound = .default }
        value.title = useSystemSound ? "系统默认音测试" : "所选提示音测试"
        value.body = useSystemSound ? "这条使用 iPhone 默认通知声音。" : "这条使用刚才选择的提示音。"
        value.categoryIdentifier = "" // A sound test never changes the saved plan.
        try await add(UNNotificationRequest(identifier: "water.test", content: value,
                trigger: UNCalendarNotificationTrigger(dateMatching: oneOffComponents(at: Date().addingTimeInterval(10)), repeats: false)))
        defaults.set(prepared?.name, forKey: testSoundKey)
        cleanupPreparedSounds()
        return await snapshot()
    }
    func actionFailed(_ error: Error) async {
        center.removePendingNotificationRequests(withIdentifiers: ["water.test"])
        let value = UNMutableNotificationContent()
        value.title = "提醒设置需要处理"
        value.body = error.localizedDescription
        try? await add(UNNotificationRequest(identifier: "water.action-error", content: value,
                    trigger: UNCalendarNotificationTrigger(dateMatching: oneOffComponents(at: Date().addingTimeInterval(1)), repeats: false)))
    }
}

final class WaterNotificationsDelegate: NSObject, UNUserNotificationCenterDelegate {
    static let shared = WaterNotificationsDelegate()
    static func install() {
        let center = UNUserNotificationCenter.current()
        center.delegate = shared
        center.setNotificationCategories([
            UNNotificationCategory(identifier: "WATER_REMINDER", actions: [
                UNNotificationAction(identifier: "WATER_SNOOZE", title: "稍后提醒", options: []),
                UNNotificationAction(identifier: "WATER_PAUSE", title: "暂停提醒", options: [])
            ], intentIdentifiers: [], options: []),
            UNNotificationCategory(identifier: "WATER_PAUSED", actions: [
                UNNotificationAction(identifier: "WATER_RESUME", title: "恢复提醒", options: [])
            ], intentIdentifiers: [], options: [])
        ])
    }
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .list, .sound])
    }
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        Task {
            do {
                switch response.actionIdentifier {
                case "WATER_SNOOZE": _ = try await ReminderScheduler.shared.snooze()
                case "WATER_PAUSE": _ = try await ReminderScheduler.shared.setPaused(true)
                case "WATER_RESUME": _ = try await ReminderScheduler.shared.setPaused(false)
                default: break
                }
            } catch { await ReminderScheduler.shared.actionFailed(error) }
            completionHandler()
        }
    }
}
