import Foundation

@main
struct NativeCoreTests {
    static func main() throws {
        let rule = ReminderRule(id: "water.rule.a", hour: 9, minute: 0, repeats: true)
        let plan = ReminderPlan(version: 1, configuration: "{}", sound: "celesta_soft.wav", requests: [rule])
        try plan.validate()
        let data = try JSONEncoder().encode(plan)
        try JSONDecoder().decode(ReminderPlan.self, from: data).validate()
        let retired = ReminderPlan(version: 1, configuration: "{\"sound\":\"shore\",\"startTime\":\"09:00\",\"isPausedToday\":true}", sound: "shore_soft.wav", requests: [rule])
        let migrated = try retired.replacingRetiredSound()!
        assert(migrated.sound == "celesta_soft.wav" && migrated.requests.first?.id == rule.id)
        let migratedConfig = try JSONSerialization.jsonObject(with: Data(migrated.configuration.utf8)) as! [String:Any]
        assert(migratedConfig["sound"] as? String == "celesta")
        assert(migratedConfig["startTime"] as? String == "09:00" && migratedConfig["isPausedToday"] as? Bool == true)
        let unchanged = try plan.replacingRetiredSound()
        assert(unchanged == nil)
        for name in ["brook", "ceramic", "shore", "breeze", "birds", "woodland"] {
            for level in ["soft", "clear"] {
                try ReminderPlan(version: 1, configuration: "{}", sound: "\(name)_\(level).wav", requests: [rule]).validate()
            }
        }
        func rejects(_ invalid: ReminderPlan) {
            do { try invalid.validate(); fatalError("Invalid plan was accepted") }
            catch { }
        }
        rejects(ReminderPlan(version: 2, configuration: "{}", sound: "celesta_soft.wav", requests: [rule]))
        rejects(ReminderPlan(version: 1, configuration: "{}", sound: "celesta_clear.wav", requests: [rule], volume: -1))
        rejects(ReminderPlan(version: 1, configuration: "{}", sound: "celesta_clear.wav", requests: [rule], volume: 101))
        let oldPlan = try JSONDecoder().decode(ReminderPlan.self, from: data)
        assert(oldPlan.volume == nil && oldPlan.displayVolume == 65)
        rejects(ReminderPlan(version: 1, configuration: "{}", sound: "../../file.wav", requests: [rule]))
        rejects(ReminderPlan(version: 1, configuration: "oops", sound: "celesta_soft.wav", requests: [rule]))
        rejects(ReminderPlan(version: 1, configuration: "{}", sound: "celesta_soft.wav", requests: [rule,rule]))
        rejects(ReminderPlan(version: 1, configuration: "{}", sound: "celesta_soft.wav", requests: [ReminderRule(id:"water.rule.x",hour:25,minute:0,repeats:true)]))
        rejects(ReminderPlan(version: 1, configuration: "{}", sound: "celesta_soft.wav", requests: [ReminderRule(id:"water.rule.x",hour:9,minute:0,repeats:false,year:2026,month:2,day:30)]))
        let many=(0..<63).map { ReminderRule(id:"water.rule.\($0)",hour:9,minute:0,repeats:true) }
        rejects(ReminderPlan(version:1,configuration:"{}",sound:"celesta_soft.wav",requests:many))
        let now=Date(timeIntervalSince1970:1_800_000_000)
        assert(snoozeTarget(now:now,nextRegular:now.addingTimeInterval(120)) == now.addingTimeInterval(120))
        assert(snoozeTarget(now:now,nextRegular:now.addingTimeInterval(1200)) == now.addingTimeInterval(600))
        assert(snoozeTarget(now:now,nextRegular:nil) == now.addingTimeInterval(600))
        print("Native model checks passed: validation, JSON persistence, capacity and snooze deduplication")
    }
}
