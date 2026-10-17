import assert from "node:assert/strict";
import { test } from "node:test";
import { dailyHealthTip, millisecondsToNextDay } from "../src/utils/healthTips";

test("the daily tip stays fixed within a local day and changes at midnight", () => {
  const morning = new Date(2026, 9, 18, 0, 0, 0);
  const evening = new Date(2026, 9, 18, 23, 59, 59);
  assert.equal(dailyHealthTip(morning), dailyHealthTip(evening));
  assert.notEqual(dailyHealthTip(evening), dailyHealthTip(new Date(2026, 9, 19)));
});

test("rotation continues over month/year boundaries and leap day", () => {
  for (const [year, month, day] of [[2026, 9, 31], [2026, 11, 31], [2028, 1, 28], [2028, 1, 29]]) {
    assert.notEqual(dailyHealthTip(new Date(year, month, day)), dailyHealthTip(new Date(year, month, day + 1)));
  }
  const twoWeeks = Array.from({ length: 14 }, (_, day) => dailyHealthTip(new Date(2026, 9, 18 + day)));
  assert.equal(new Set(twoWeeks).size, 14);
  assert.equal(dailyHealthTip(new Date(2026, 9, 18)), dailyHealthTip(new Date(2026, 10, 1)));
});

test("local dates, rather than UTC dates or elapsed 24-hour periods, choose the tip", () => {
  const previousTZ = process.env.TZ;
  try {
    process.env.TZ = "Asia/Shanghai";
    const start = new Date("2026-10-18T00:01:00+08:00");
    const end = new Date("2026-10-18T23:59:00+08:00");
    assert.equal(dailyHealthTip(start), dailyHealthTip(end));
    process.env.TZ = "America/New_York";
    for (const [year, month, day, hours] of [[2026, 2, 8, 23], [2026, 10, 1, 25]]) {
      const midnight = new Date(year, month, day);
      assert.equal(millisecondsToNextDay(midnight), hours * 60 * 60 * 1000);
      assert.equal(dailyHealthTip(midnight), dailyHealthTip(new Date(year, month, day, 23, 59)));
      assert.notEqual(dailyHealthTip(midnight), dailyHealthTip(new Date(year, month, day + 1)));
    }
  } finally {
    if (previousTZ === undefined) delete process.env.TZ;
    else process.env.TZ = previousTZ;
  }
});
