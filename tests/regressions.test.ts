import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compilePlan,
  dateKey,
  daySlots,
  nextReminder,
} from "../src/native/plan.ts";
import type { ReminderConfig } from "../src/types/reminder.ts";
import { SOUNDS } from "../src/utils/sounds.ts";

const config: ReminderConfig = {
  mode: "everyday",
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

test("every offered tone can be saved as either real notification sound version", () => {
  for (const { id } of SOUNDS) {
    for (const loudness of ["soft", "clear"] as const) {
      const plan = compilePlan({ ...config, sound: id, loudness });
      assert.equal(plan.sound, `${id}_${loudness}.wav`);
      assert.ok(plan.requests.length > 0);
    }
  }
});

// Each test restores the process timezone; the tests in this file run sequentially.
function inTimezone<T>(zone: string, run: () => T): T {
  const previous = process.env.TZ;
  process.env.TZ = zone;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

test("an overnight shift excludes a break that begins before the shift and ends inside it", () => {
  const slots = daySlots({
    ...config,
    startTime: "22:00",
    endTime: "03:00",
    lunchStart: "21:00",
    lunchEnd: "23:00",
  });

  assert.deepEqual(slots, [23 * 60, 24 * 60, 25 * 60, 26 * 60]);
});

test("malformed persisted lunch flags cannot silently enable a lunch break", () => {
  const persisted = JSON.parse(
    JSON.stringify({ ...config, hasLunchBreak: "false" }),
  ) as ReminderConfig;

  assert.throws(() => compilePlan(persisted, new Date(2026, 9, 19, 8)));
});

test("a spring-forward gap cannot move a fixed-date reminder to the excluded end of its window", () => {
  inTimezone("America/New_York", () => {
    const plan = compilePlan(
      {
        ...config,
        mode: "specific_dates",
        specificDates: ["2027-03-14"],
        startTime: "01:00",
        endTime: "03:00",
        hasLunchBreak: false,
      },
      new Date(2027, 2, 13, 12),
    );

    assert.deepEqual(
      plan.requests.map((rule) => [
        rule.year,
        rule.month,
        rule.day,
        rule.hour,
        rule.minute,
      ]),
      [[2027, 3, 14, 1, 0]],
    );
  });
});

test("a daily next reminder skips a missing spring-forward time instead of leaving its window", () => {
  inTimezone("America/New_York", () => {
    const next = nextReminder(
      {
        ...config,
        startTime: "01:00",
        endTime: "03:00",
        hasLunchBreak: false,
      },
      new Date(2027, 2, 14, 1, 30),
    );

    assert.ok(next);
    assert.deepEqual(
      [dateKey(next), next.getHours(), next.getMinutes()],
      ["2027-03-15", 1, 0],
    );
  });
});

test("the notification limit accepts exactly 62 distinct weekly requests", () => {
  const plan = compilePlan(
    {
      ...config,
      mode: "workday",
      workdays: [1, 4],
      startTime: "00:00",
      endTime: "15:30",
      intervalMinutes: 30,
      hasLunchBreak: false,
    },
    new Date(2026, 9, 19, 8),
  );

  assert.equal(plan.requests.length, 62);
});

test("the notification limit rejects 63 distinct weekly requests", () => {
  assert.throws(
    () =>
      compilePlan(
        {
          ...config,
          mode: "workday",
          workdays: [1, 4, 7],
          startTime: "00:00",
          endTime: "10:30",
          intervalMinutes: 30,
          hasLunchBreak: false,
        },
        new Date(2026, 9, 19, 8),
      ),
    /过密/,
  );
});

test("a fixed date in a positive UTC offset keeps the chosen local date across midnight", () => {
  inTimezone("Pacific/Kiritimati", () => {
    const plan = compilePlan(
      {
        ...config,
        mode: "specific_dates",
        specificDates: ["2026-12-31"],
        startTime: "23:00",
        endTime: "01:00",
        hasLunchBreak: false,
      },
      new Date(2026, 11, 30, 12),
    );

    assert.deepEqual(
      plan.requests.map((rule) => [rule.year, rule.month, rule.day, rule.hour]),
      [
        [2026, 12, 31, 23],
        [2027, 1, 1, 0],
      ],
    );
  });
});
