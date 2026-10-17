import Foundation

struct ReminderRule: Codable {
    let id: String
    let hour: Int
    let minute: Int
    let repeats: Bool
    var weekday: Int? = nil
    var year: Int? = nil
    var month: Int? = nil
    var day: Int? = nil

    var components: DateComponents {
        var value=DateComponents()
        value.hour=hour; value.minute=minute; value.second=0
        value.weekday=weekday; value.year=year; value.month=month; value.day=day
        return value
    }

    func validate() throws {
        guard id.hasPrefix("water.rule."), (0...23).contains(hour), (0...59).contains(minute) else {
            throw ReminderError.invalid("提醒时间无效，请重新保存安排。")
        }
        if repeats {
            guard year == nil, month == nil, day == nil, weekday == nil || (1...7).contains(weekday!) else {
                throw ReminderError.invalid("重复提醒日期无效。")
            }
        } else {
            guard let y=year, let m=month, let d=day, (2026...2100).contains(y), weekday == nil else {
                throw ReminderError.invalid("指定日期无效。")
            }
            let calendar=Calendar(identifier:.gregorian)
            guard let date=calendar.date(from:DateComponents(year:y,month:m,day:d,hour:12)),
                  calendar.component(.year,from:date)==y,
                  calendar.component(.month,from:date)==m,
                  calendar.component(.day,from:date)==d else {
                throw ReminderError.invalid("指定日期无效。")
            }
        }
    }
}

enum ReminderError: LocalizedError {
    case invalid(String)
    var errorDescription: String? { if case .invalid(let message)=self {return message};return nil }
}

struct ReminderPlan: Codable {
    let version: Int
    var configuration: String
    let sound: String
    let requests: [ReminderRule]

    static let sounds: Set<String> = Set(["celesta","bamboo","chime","raindrop","singingbowl","morning","brook","ceramic","shore","breeze","birds","woodland"].flatMap { name in
        ["\(name)_soft.wav","\(name)_clear.wav"]
    })

    func validate() throws {
        guard version==1, !requests.isEmpty, requests.count<=62 else {
            throw ReminderError.invalid("当前安排过密或为空，请调整日期、时段或提醒间隔。")
        }
        guard Set(requests.map(\.id)).count==requests.count, Self.sounds.contains(sound),
              let data=configuration.data(using:.utf8),
              (try? JSONSerialization.jsonObject(with:data)) is [String:Any] else {
            throw ReminderError.invalid("提醒设置无效，请重新保存。")
        }
        for rule in requests {try rule.validate()}
    }
}

func snoozeTarget(now: Date, nextRegular: Date?) -> Date {
    let target=now.addingTimeInterval(600)
    if let next=nextRegular, next>now, next<=target {return next}
    return target
}

// Absolute one-off deadlines must not be recomputed from a relative interval when reading status.
func oneOffComponents(at date: Date) -> DateComponents {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone(secondsFromGMT: 0)!
    var value = calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
    value.calendar = calendar
    value.timeZone = calendar.timeZone
    return value
}
