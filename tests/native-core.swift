import Foundation

@main
struct NativeCoreTests {
    static func main() throws {
        let rule = ReminderRule(id: "water.rule.a", hour: 9, minute: 0, repeats: true)
        let plan = ReminderPlan(version: 1, configuration: "{}", sound: "celesta_soft.wav", requests: [rule])
        try plan.validate()
        let data = try JSONEncoder().encode(plan)
        try JSONDecoder().decode(ReminderPlan.self, from: data).validate()
        for name in ["brook", "ceramic"] {
            for level in ["soft", "clear"] {
                try ReminderPlan(version: 1, configuration: "{}", sound: "\(name)_\(level).wav", requests: [rule]).validate()
            }
        }
        func rejects(_ invalid: ReminderPlan) {
            do { try invalid.validate(); fatalError("Invalid plan was accepted") }
            catch { }
        }
        rejects(ReminderPlan(version: 2, configuration: "{}", sound: "celesta_soft.wav", requests: [rule]))
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
