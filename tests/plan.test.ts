import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compilePlan,
  nextOccurrence,
  nextReminder,
  dateKey,
} from "../src/native/plan.ts";
import type { ReminderConfig } from "../src/types/reminder";

export const config: ReminderConfig = {
  mode: "workday",
  startTime: "09:00",
  endTime: "18:00",
  intervalMinutes: 60,
  hasLunchBreak: true,
  lunchStart: "12:00",
  lunchEnd: "13:30",
  workdays: [1, 2, 3, 4, 5],
  specificDates: [],
  sound: "celesta",
  loudness: "soft",
  notificationPermission: "prompt",
  isPausedToday: false,
  hasCompletedSetup: false,
  remainingGlasses: 8,
  totalDailyGlasses: 8,
  snoozeUntilTime: null,
  lastDrinkTime: null,
};
const monday = new Date(2026, 9, 19, 8, 0);

test("daily reminders repeat indefinitely and restart the interval after lunch", () => {
  const p = compilePlan({ ...config, mode: "everyday" }, monday);
  assert.deepEqual(
    p.requests.map((r) => `${r.hour}:${r.minute}`),
    ["9:0", "10:0", "11:0", "13:30", "14:30", "15:30", "16:30", "17:30"],
  );
  assert.ok(p.requests.every((r) => r.repeats && r.weekday === undefined));
});
test("custom workdays find Thursday rather than assuming Monday", () => {
  const c = { ...config, workdays: [2, 4] };
  assert.equal(
    dateKey(nextReminder(c, new Date(2026, 9, 21, 10))!),
    "2026-10-22",
  );
  assert.equal(nextReminder(c, new Date(2026, 9, 21, 10))!.getHours(), 9);
});
test("an overnight Monday shift schedules the after-midnight part on Tuesday", () => {
  const c = {
    ...config,
    workdays: [1],
    startTime: "22:00",
    endTime: "02:00",
    hasLunchBreak: false,
  };
  const p = compilePlan(c, monday);
  assert.deepEqual(
    p.requests.map((r) => [r.weekday, r.hour]),
    [
      [2, 22],
      [2, 23],
      [3, 0],
      [3, 1],
    ],
  );
  const n = nextReminder(c, new Date(2026, 9, 20, 0, 20))!;
  assert.equal(dateKey(n), "2026-10-20");
  assert.equal(n.getHours(), 1);
});
test("overnight breaks exclude both sides of midnight", () => {
  const p = compilePlan(
    {
      ...config,
      mode: "everyday",
      startTime: "22:00",
      endTime: "03:00",
      lunchStart: "23:00",
      lunchEnd: "00:30",
    },
    monday,
  );
  assert.deepEqual(
    p.requests.map((r) => [r.hour, r.minute]),
    [
      [22, 0],
      [0, 30],
      [1, 30],
      [2, 30],
    ],
  );
});
test("specific dates remain local dates and discard already elapsed slots", () => {
  const p = compilePlan(
    { ...config, mode: "specific_dates", specificDates: ["2026-10-19"] },
    new Date(2026, 9, 19, 10, 5),
  );
  assert.ok(
    p.requests.every(
      (r) => !r.repeats && r.year === 2026 && r.month === 10 && r.day === 19,
    ),
  );
  assert.equal(p.requests[0].hour, 11);
});
test("specific-date overnight shifts roll into the next month", () => {
  const p = compilePlan(
    {
      ...config,
      mode: "specific_dates",
      specificDates: ["2026-10-31"],
      startTime: "23:00",
      endTime: "02:00",
      hasLunchBreak: false,
    },
    monday,
  );
  assert.deepEqual(
    p.requests.map((r) => [r.month, r.day, r.hour]),
    [
      [10, 31, 23],
      [11, 1, 0],
      [11, 1, 1],
    ],
  );
});
test("a reminder at the end of the time window is excluded", () => {
  const p = compilePlan(
    {
      ...config,
      mode: "everyday",
      startTime: "09:00",
      endTime: "10:00",
      hasLunchBreak: false,
    },
    monday,
  );
  assert.deepEqual(
    p.requests.map((r) => r.hour),
    [9],
  );
});
test("selecting all seven weekdays is compressed into daily recurring rules", () => {
  const p = compilePlan(
    { ...config, workdays: [1, 2, 3, 4, 5, 6, 7], intervalMinutes: 30 },
    monday,
  );
  assert.ok(p.requests.length < 62);
  assert.ok(p.requests.every((r) => r.weekday === undefined));
});
test("oversized schedules fail visibly instead of silently truncating", () => {
  assert.throws(
    () =>
      compilePlan(
        {
          ...config,
          startTime: "00:00",
          endTime: "23:59",
          intervalMinutes: 30,
          hasLunchBreak: false,
        },
        monday,
      ),
    /过密/,
  );
});
test("equal start and end times are rejected", () => {
  assert.throws(
    () =>
      compilePlan({ ...config, startTime: "09:00", endTime: "09:00" }, monday),
    /相同/,
  );
});
test("empty and invalid weekdays are rejected", () => {
  for (const workdays of [[], [0], [8]])
    assert.throws(() => compilePlan({ ...config, workdays }, monday), /工作日/);
});
test("empty, malformed, impossible and expired dates are rejected", () => {
  for (const specificDates of [[], ["2026-02-30"], ["bad"], ["2026-10-18"]]) {
    assert.throws(() =>
      compilePlan({ ...config, mode: "specific_dates", specificDates }, monday),
    );
  }
});
test("invalid minutes and intervals are rejected before scheduling", () => {
  assert.throws(() => compilePlan({ ...config, startTime: "25:10" }, monday));
  assert.throws(() => compilePlan({ ...config, intervalMinutes: 0 }, monday));
});
test("daily next occurrence advances to tomorrow once today has passed", () => {
  const next = nextOccurrence(
    { id: "x", hour: 9, minute: 0, repeats: true },
    new Date(2026, 9, 19, 10),
  )!;
  assert.equal(dateKey(next), "2026-10-20");
  assert.equal(next.getHours(), 9);
});
test("duplicate weekdays do not produce duplicate notifications", () => {
  const a = compilePlan({ ...config, workdays: [1, 2] }, monday);
  const b = compilePlan({ ...config, workdays: [1, 1, 2, 2] }, monday);
  assert.deepEqual(a.requests, b.requests);
});
