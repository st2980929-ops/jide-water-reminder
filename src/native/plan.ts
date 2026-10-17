import type { ReminderConfig } from "../types/reminder";
import { canonicalSound } from "../utils/sounds";

// Leave two of iOS's 64 pending requests available for a test and a snooze.
export const MAX_PLAN_REQUESTS = 62;
const INTERVALS = [30, 45, 60, 90, 120];
const SOUNDS = [
  "celesta",
  "bamboo",
  "chime",
  "raindrop",
  "singingbowl",
  "morning",
  "brook",
  "ceramic",
  "drop",
  "wood",
];

export interface ReminderRequest {
  id: string;
  hour: number;
  minute: number;
  repeats: boolean;
  weekday?: number; // Apple's calendar: Sunday = 1.
  year?: number;
  month?: number;
  day?: number;
}
export interface NativePlan {
  version: 1;
  configuration: string;
  sound: string;
  requests: ReminderRequest[];
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function timeMinutes(value: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
    throw new Error("请输入有效的时间。");
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function localDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("请选择有效日期。");
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  if (dateKey(date) !== value || y < 2026 || y > 2100)
    throw new Error("请选择有效日期。");
  return date;
}

export function daySlots(config: ReminderConfig): number[] {
  const start = timeMinutes(config.startTime);
  let end = timeMinutes(config.endTime);
  if (start === end) throw new Error("开始时间和结束时间不能相同。");
  if (end < start) end += 1440;
  if (!INTERVALS.includes(config.intervalMinutes))
    throw new Error("请选择有效的提醒间隔。");
  let segments: [number, number][] = [[start, end]];
  if (typeof config.hasLunchBreak !== "boolean")
    throw new Error("休息设置无效，请重新选择。");
  if (config.hasLunchBreak) {
    const a = timeMinutes(config.lunchStart),
      b = timeMinutes(config.lunchEnd);
    if (a === b) throw new Error("休息开始和结束时间不能相同。");
    const duration = (b - a + 1440) % 1440;
    for (const offset of [-1440, 0, 1440]) {
      const from = a + offset,
        to = from + duration;
      segments = segments.flatMap(([left, right]): [number, number][] => {
        if (to <= left || from >= right) return [[left, right]];
        const rest: [number, number][] = [];
        if (from > left) rest.push([left, from]);
        if (to < right) rest.push([to, right]);
        return rest;
      });
    }
  }
  const slots: number[] = [];
  for (const [a, b] of segments)
    for (let at = a; at < b; at += config.intervalMinutes) slots.push(at);
  if (!slots.length) throw new Error("休息覆盖了整个提醒时段，请调整安排。");
  return [...new Set(slots)].sort((a, b) => a - b);
}

export function compilePlan(
  config: ReminderConfig,
  now = new Date(),
): NativePlan {
  const slots = daySlots(config);
  if (!SOUNDS.includes(config.sound)) throw new Error("请选择有效的提示音。");
  if (!["soft", "clear"].includes(config.loudness))
    throw new Error("请选择有效的声音版本。");
  const soundType = canonicalSound(config.sound);
  const requests: ReminderRequest[] = [];
  const add = (fields: Omit<ReminderRequest, "id">) => {
    const key = [
      fields.year ?? "",
      fields.month ?? "",
      fields.day ?? "",
      fields.weekday ?? "",
      fields.hour,
      fields.minute,
    ].join("-");
    requests.push({ id: "water.rule." + key, ...fields });
  };
  let weekdays: number[] = [];
  if (config.mode === "workday") {
    if (
      !Array.isArray(config.workdays) ||
      !config.workdays.length ||
      config.workdays.some((d) => !Number.isInteger(d) || d < 1 || d > 7)
    )
      throw new Error("请至少选择一个有效工作日。");
    weekdays = [...new Set(config.workdays)].sort((a, b) => a - b);
  } else if (!["everyday", "specific_dates"].includes(config.mode))
    throw new Error("请选择提醒日期模式。");

  if (config.mode === "specific_dates") {
    if (!Array.isArray(config.specificDates) || !config.specificDates.length)
      throw new Error("请至少选择一个日期。");
    for (const key of [...new Set(config.specificDates)].sort()) {
      const anchor = localDate(key);
      for (const slot of slots) {
        const hour = Math.floor(slot / 60) % 24,
          minute = slot % 60;
        const at = new Date(
          anchor.getFullYear(),
          anchor.getMonth(),
          anchor.getDate() + Math.floor(slot / 1440),
          hour,
          minute,
        );
        if (at.getHours() !== hour || at.getMinutes() !== minute) continue;
        if (at.getTime() <= now.getTime()) continue;
        add({
          year: at.getFullYear(),
          month: at.getMonth() + 1,
          day: at.getDate(),
          hour: at.getHours(),
          minute: at.getMinutes(),
          repeats: false,
        });
      }
    }
    if (!requests.length)
      throw new Error("所选日期的提醒已经全部结束，请选择未来日期。");
  } else {
    for (const slot of slots) {
      const base = {
        hour: Math.floor(slot / 60) % 24,
        minute: slot % 60,
        repeats: true,
      };
      if (config.mode === "everyday" || weekdays.length === 7) add(base);
      else
        for (const day of weekdays)
          add({
            ...base,
            weekday: (((day % 7) + Math.floor(slot / 1440)) % 7) + 1,
          });
    }
  }
  const unique = [...new Map(requests.map((r) => [r.id, r])).values()];
  if (unique.length > MAX_PLAN_REQUESTS)
    throw new Error(
      "当前安排过密，iPhone 无法一次保存全部提醒。请增加提醒间隔、缩短时段或减少指定日期后再试。",
    );
  return {
    version: 1,
    configuration: JSON.stringify(config),
    sound: `${soundType}_${config.loudness}.wav`,
    requests: unique,
  };
}

export function nextOccurrence(rule: ReminderRequest, now: Date): Date | null {
  if (!rule.repeats) {
    const at = new Date(
      rule.year!,
      rule.month! - 1,
      rule.day!,
      rule.hour,
      rule.minute,
    );
    return at > now &&
      at.getHours() === rule.hour &&
      at.getMinutes() === rule.minute
      ? at
      : null;
  }
  for (let offset = 0; offset < 8; offset++) {
    const at = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      rule.hour,
      rule.minute,
    );
    if (at.getHours() !== rule.hour || at.getMinutes() !== rule.minute)
      continue;
    if (at > now && (!rule.weekday || at.getDay() + 1 === rule.weekday))
      return at;
  }
  return null;
}

export function nextReminder(
  config: ReminderConfig,
  now = new Date(),
): Date | null {
  const dates = compilePlan(config, now)
    .requests.map((r) => nextOccurrence(r, now))
    .filter((d): d is Date => d !== null);
  return dates.sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
}
