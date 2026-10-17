import Capacitor
import UIKit
import AVFAudio

@objc(WaterNotificationsPlugin)
public class WaterNotificationsPlugin: CAPPlugin, CAPBridgedPlugin, AVAudioPlayerDelegate {
    private var previewPlayer: AVAudioPlayer?
    private var previewCall: CAPPluginCall?
    private var previewToken = 0
    private var previewAudioActive = false
    private var interruptionObserver: NSObjectProtocol?
    private var backgroundObserver: NSObjectProtocol?
    public let identifier = "WaterNotificationsPlugin"
    public let jsName = "WaterNotifications"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setPaused", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "snooze", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "test", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "previewSound", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopPreviewSound", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setAppearance", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise)
    ]
    public override func load() {
        WaterNotificationsDelegate.install()
        interruptionObserver = NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] event in
            if (event.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt) == AVAudioSession.InterruptionType.began.rawValue {
                self?.finishPreview("试听被系统声音打断，请再点一次。")
            }
        }
        backgroundObserver = NotificationCenter.default.addObserver(forName: UIApplication.didEnterBackgroundNotification, object: nil, queue: .main) { [weak self] _ in
            self?.finishPreview()
        }
    }
    deinit {
        if let observer = interruptionObserver { NotificationCenter.default.removeObserver(observer) }
        if let observer = backgroundObserver { NotificationCenter.default.removeObserver(observer) }
    }
    private func finishPreview(_ message: String? = nil) {
        previewToken += 1
        let call = previewCall; previewCall = nil
        previewPlayer?.stop(); previewPlayer = nil
        if previewAudioActive {
            previewAudioActive = false
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }
        if let message = message { call?.reject(message) } else { call?.resolve() }
    }
    @objc func previewSound(_ call: CAPPluginCall) {
        guard let sound = call.getString("sound") else { call.reject("请选择提示音。"); return }
        let volume = call.getInt("volume") ?? 100
        DispatchQueue.main.async { [self] in
            self.finishPreview()
            self.previewCall = call
            do {
                let prepared = try ReminderSoundStore.live.prepare(sound: sound, volume: volume)
                guard let url = prepared.url else { self.finishPreview(); return }
                let session = AVAudioSession.sharedInstance()
                try session.setCategory(.playback, mode: .default, options: .mixWithOthers)
                try session.setActive(true); self.previewAudioActive = true
                let player = try AVAudioPlayer(contentsOf: url)
                self.previewPlayer = player; player.delegate = self
                guard player.prepareToPlay(), player.play() else { throw ReminderError.invalid("试听没有成功，请再试一次。") }
                let token = self.previewToken
                DispatchQueue.main.asyncAfter(deadline: .now() + player.duration + 4) { [weak self] in
                    guard let self = self, self.previewToken == token, self.previewCall != nil else { return }
                    self.finishPreview("试听未正常结束，请再试一次。")
                }
            } catch { self.finishPreview(error.localizedDescription) }
        }
    }
    @objc func stopPreviewSound(_ call: CAPPluginCall) {
        DispatchQueue.main.async { self.finishPreview(); call.resolve() }
    }
    public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        guard player === previewPlayer else { return }
        finishPreview(flag ? nil : "试听没有成功，请再试一次。")
    }
    public func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        guard player === previewPlayer else { return }
        finishPreview(error?.localizedDescription ?? "提示音无法读取，请重新保存声音。")
    }
    @objc func status(_ call: CAPPluginCall) {
        Task { call.resolve(await ReminderScheduler.shared.status()) }
    }
    @objc func requestPermission(_ call: CAPPluginCall) {
        Task {
            do { call.resolve(try await ReminderScheduler.shared.requestPermission()) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func configure(_ call: CAPPluginCall) {
        guard let json = call.getString("plan") else { call.reject("缺少提醒安排。"); return }
        Task {
            do { call.resolve(try await ReminderScheduler.shared.configure(json: json, paused: call.getBool("paused") ?? false)) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func setPaused(_ call: CAPPluginCall) {
        Task {
            do { call.resolve(try await ReminderScheduler.shared.setPaused(call.getBool("paused") ?? false)) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func snooze(_ call: CAPPluginCall) {
        Task {
            do { call.resolve(try await ReminderScheduler.shared.snooze()) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func test(_ call: CAPPluginCall) {
        guard let sound = call.getString("sound") else { call.reject("请选择提示音。"); return }
        Task {
            do { call.resolve(try await ReminderScheduler.shared.test(sound: sound, useSystemSound: call.getBool("useSystemSound") ?? false, volume: call.getInt("volume") ?? 100)) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func setAppearance(_ call: CAPPluginCall) {
        let appearance = call.getString("appearance") ?? "system"
        DispatchQueue.main.async {
            self.bridge?.viewController?.overrideUserInterfaceStyle = appearance == "dark" ? .dark : appearance == "light" ? .light : .unspecified
            self.bridge?.viewController?.setNeedsStatusBarAppearanceUpdate()
            call.resolve()
        }
    }
    @objc func openSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString) else { call.reject("无法打开设置。"); return }
            UIApplication.shared.open(url, options: [:]) { success in
                if success { call.resolve() } else { call.reject("无法打开设置，请手动进入 iPhone 设置。") }
            }
        }
    }
}
