import type {
  ReminderConfig,
  ScheduleCalculation,
  HomeDisplayState,
} from "../types/reminder";
import { nextReminder, dateKey, timeMinutes } from "../native/plan";
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
export const formatTimeMinutes = timeMinutes;
export function formatMinutesToTime(mins: number): string {
  const value = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
export function generateNaturalSummary(config: ReminderConfig): string {
  const days =
    config.mode === "everyday"
      ? "每天"
      : config.mode === "specific_dates"
        ? `已选 ${config.specificDates.length} 个日期`
        : config.workdays.length === 5 &&
            [1, 2, 3, 4, 5].every((d) => config.workdays.includes(d))
          ? "周一至周五"
          : [...config.workdays]
              .sort()
              .map((d) => WEEKDAYS[d % 7])
              .join("、") || "未选工作日";
  const overnight = config.endTime < config.startTime ? "（跨午夜）" : "";
  return `${days}，${config.startTime}–${config.endTime}${overnight}，每 ${config.intervalMinutes} 分钟提醒${config.hasLunchBreak ? `；${config.lunchStart}–${config.lunchEnd} 休息` : ""}。`;
}
export function nextReminderLabel(date: Date, now = new Date()): string {
  const today = dateKey(now),
    tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const prefix =
    dateKey(date) === today
      ? ""
      : dateKey(date) === dateKey(tomorrow)
        ? "明天 "
        : `${date.getMonth() + 1}月${date.getDate()}日 `;
  return `下一次 ${prefix}${formatMinutesToTime(date.getHours() * 60 + date.getMinutes())}`;
}
export function calculateSchedule(
  config: ReminderConfig,
  _simulation?: unknown,
  _forced?: HomeDisplayState | null,
): ScheduleCalculation {
  const summaryText = generateNaturalSummary(config);
  const result = (
    state: HomeDisplayState,
    statusHeadline: string,
    nextReminderText: string,
    stateBadgeLabel: string,
    canPause = false,
  ) => ({
    state,
    statusHeadline,
    nextReminderText,
    summaryText,
    stateBadgeLabel,
    canPause,
  });
  if (config.notificationPermission !== "granted")
    return result(
      "unauthorized",
      "通知权限未开启",
      "请在系统设置中允许通知",
      "权限未开启",
    );
  if (config.isPausedToday)
    return result("paused", "提醒已暂停", "需要时手动恢复提醒", "已暂停");
  try {
    const now = new Date(),
      next = nextReminder(config, now);
    if (!next)
      return result(
        "all_dates_passed",
        "所选提醒日期已结束",
        "修改安排，添加未来日期",
        "日程已完成",
      );
    const text = nextReminderLabel(next, now);
    const minute = now.getHours() * 60 + now.getMinutes(),
      start = timeMinutes(config.startTime),
      end = timeMinutes(config.endTime);
    const within = (a: number, b: number) =>
      a < b ? minute >= a && minute < b : minute >= a || minute < b;
    // In an overnight shift, the early-hours segment belongs to yesterday's selected day.
    const anchor = new Date(now);
    if (end < start && minute < end) anchor.setDate(anchor.getDate() - 1);
    const selected =
      config.mode === "everyday" ||
      (config.mode === "workday"
        ? config.workdays.includes(anchor.getDay() || 7)
        : config.specificDates.includes(dateKey(anchor)));
    if (!selected)
      return result(
        "not_today",
        "当前不在提醒日程内",
        text,
        "等待安排日",
        true,
      );
    if (
      within(start, end) &&
      config.hasLunchBreak &&
      within(timeMinutes(config.lunchStart), timeMinutes(config.lunchEnd))
    )
      return result(
        "lunch_break",
        "休息一下，稍后再提醒",
        text,
        "休息时段",
        true,
      );
    return result("active", "提醒已开启", text, "已安排", true);
  } catch (error) {
    const message = error instanceof Error ? error.message : "请重新保存安排。";
    if (message.includes("已经全部结束"))
      return result(
        "all_dates_passed",
        "所选提醒日期已结束",
        "修改安排，添加未来日期",
        "日程已完成",
      );
    return result("invalid_schedule", "请检查提醒安排", message, "需要调整");
  }
}
