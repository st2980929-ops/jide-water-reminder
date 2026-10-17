import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeScreen } from "../src/components/prototype/HomeScreen";
import { Step2Sound } from "../src/components/prototype/Step2Sound";
import type { ReminderConfig } from "../src/types/reminder";

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

test("legacy wood selection displays the bamboo sound that previews and notifications actually use", () => {
  const html = renderToStaticMarkup(React.createElement(Step2Sound, {
    config: { ...config, sound: "wood" }, onChange: noop, onBack: noop,
    onComplete: noop, onTriggerTestNotification: noop, onTestSystemSound: noop, onOpenSettings: noop,
  }));
  assert.match(html, /<option value="bamboo" selected="">/);
  assert.doesNotMatch(html, /<option value="celesta" selected="">/);
});
