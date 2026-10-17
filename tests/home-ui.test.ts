import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeScreen } from "../src/components/prototype/HomeScreen";
import { Step2Sound } from "../src/components/prototype/Step2Sound";
import type { ReminderConfig } from "../src/types/reminder";
import { dailyHealthTip } from "../src/utils/healthTips";

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
  notificationPermission: "granted",
  isPausedToday: false,
  hasCompletedSetup: true,
  remainingGlasses: 8,
  totalDailyGlasses: 8,
  snoozeUntilTime: null,
  lastDrinkTime: null,
};
const noop = () => {};
test("a healthy home has only the drink action and settings entry", () => {
  const html = renderToStaticMarkup(
    React.createElement(HomeScreen, {
      config,
      onOpenSettings: noop,
      onDrinkGlass: noop,
      onFixUnauthorized: noop,
      nextReminderAt: Date.now() + 3600000,
      pendingCount: 8,
      planHealthy: true,
    }),
  );
  assert.equal((html.match(/<button\b|role="button"/g) || []).length, 2);
  assert.match(html, /aria-label="设置"/);
  assert.match(html, /喝了一杯/);
  assert.ok(html.includes(dailyHealthTip()));
  assert.match(html, /aria-label="每日健康小知识"/);
  assert.doesNotMatch(html, /留一点时间，喝口水/);
});
test("editing a sound returns to settings and does not claim to enable paused reminders", () => {
  const html = renderToStaticMarkup(
    React.createElement(Step2Sound, {
      config: { ...config, isPausedToday: true },
      onChange: noop,
      onBack: noop,
      onComplete: noop,
      onTriggerTestNotification: noop,
      onTestSystemSound: noop,
      onOpenSettings: noop,
    }),
  );
  assert.match(html, /返回设置/);
  assert.doesNotMatch(html, /保存并启用提醒/);
});

test("a removed legacy wood selection falls back to the retained water tone", () => {
  const html = renderToStaticMarkup(React.createElement(Step2Sound, {
    config: { ...config, sound: "wood" }, onChange: noop, onBack: noop,
    onComplete: noop, onTriggerTestNotification: noop, onTestSystemSound: noop, onOpenSettings: noop,
  }));
  assert.match(html, /<option value="celesta" selected="">/);
  for (const removed of ["bamboo", "chime", "brook", "shore", "breeze", "birds"])
    assert.doesNotMatch(html, new RegExp(`<option value="${removed}"`));
});

test("sound controls show a base-volume slider without the old preset picker", () => {
  const html = renderToStaticMarkup(React.createElement(Step2Sound, {
    config: { ...config, soundVolume: 45 }, onChange: noop, onBack: noop,
    onComplete: noop, onTriggerTestNotification: noop, onTestSystemSound: noop, onOpenSettings: noop,
  }));
  assert.match(html, /type="range"/);
  assert.match(html, /aria-valuetext="45%"/);
  assert.equal((html.match(/<select\b/g) || []).length, 1);
  assert.doesNotMatch(html, /声音版本/);
});
