import assert from "node:assert/strict";
import { test } from "node:test";
import { OfflineAudioContext } from "node-web-audio-api";
import { compilePlan } from "../src/native/plan";
import { playReminderSound } from "../src/utils/audio";
import type { ReminderConfig, LoudnessLevel } from "../src/types/reminder";

const config: ReminderConfig = {
  mode: "everyday", startTime: "09:00", endTime: "18:00", intervalMinutes: 60,
  hasLunchBreak: false, lunchStart: "12:00", lunchEnd: "13:30", workdays: [1,2,3,4,5],
  specificDates: [], sound: "ceramic", loudness: "soft", notificationPermission: "granted",
  isPausedToday: false, hasCompletedSetup: true, remainingGlasses: 8, totalDailyGlasses: 8,
  snoozeUntilTime: null, lastDrinkTime: null,
};

test("a saved base volume reaches the native plan and the loudest source file", () => {
  const plan = compilePlan({ ...config, soundVolume: 37 } as ReminderConfig) as ReturnType<typeof compilePlan> & { volume?: number };
  assert.equal(plan.volume, 37);
  assert.equal(plan.sound, "ceramic_clear.wav");
  assert.equal(JSON.parse(plan.configuration).soundVolume, 37);
});
test("old soft and clear choices retain approximately their existing base level", () => {
  const soft = compilePlan(config) as ReturnType<typeof compilePlan> & { volume?: number };
  const clear = compilePlan({ ...config, loudness: "clear" }) as typeof soft;
  assert.equal(soft.volume, 65);
  assert.equal(clear.volume, 100);
});
test("invalid saved volume cannot silently become a different notification level", () => {
  for (const soundVolume of [-1, 101, 20.5, "50", null, NaN])
    assert.throws(() => compilePlan({ ...config, soundVolume } as unknown as ReminderConfig));
});

async function renderedRMS(volume: number) {
  const context = new OfflineAudioContext(1, 44100 * 1.8, 44100);
  playReminderSound("ceramic", volume as unknown as LoudnessLevel, context as unknown as BaseAudioContext);
  const samples = (await context.startRendering()).getChannelData(0);
  return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
}
test("preview base volume scales the signal, including true silence at zero", async () => {
  const full = await renderedRMS(100), half = await renderedRMS(50), zero = await renderedRMS(0);
  assert.ok(full > 0.1);
  assert.ok(Math.abs(half / full - 0.5) < 0.001);
  assert.equal(zero, 0);
});
