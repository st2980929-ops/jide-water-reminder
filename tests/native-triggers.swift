import Foundation
import UserNotifications

@main
struct NativeTriggerTests {
    static func main() {
        let target = Date(timeIntervalSince1970: floor(Date().addingTimeInterval(120).timeIntervalSince1970))
        let trigger = UNCalendarNotificationTrigger(dateMatching: oneOffComponents(at: target), repeats: false)
        assert(trigger.nextTriggerDate() == target, "One-off must preserve its original absolute deadline")
        assert(trigger.nextTriggerDate() == trigger.nextTriggerDate(), "Reading status must not move the deadline")
        assert(!trigger.repeats)
        let components = oneOffComponents(at: target)
        assert(components.calendar?.identifier == .gregorian)
        assert(components.timeZone?.secondsFromGMT() == 0, "The short test deadline must survive a time-zone change")
        print("Native trigger checks passed: stable absolute test/snooze deadline and UTC components")
    }
}
