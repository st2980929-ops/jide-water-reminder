import assert from "node:assert/strict";
import { test } from "node:test";
import { OfflineAudioContext } from "node-web-audio-api";
import { playReminderSound } from "../src/utils/audio";
import type { LoudnessLevel, SoundType } from "../src/types/reminder";
import { soundDuration, SOUNDS as CATALOG } from "../src/utils/sounds";

const SAMPLE_RATE = 44100;
const AUDIBLE_THRESHOLD = 10 ** (-40 / 20);
const MIN_AUDIBLE_SPAN_SECONDS = 0.6;
const MAX_PEAK = 0.92;
const MIN_RMS: Record<LoudnessLevel, number> = {
  soft: 0.075,
  clear: 0.115,
};
const SOUNDS: SoundType[] = CATALOG.map((sound) => sound.id);

// Digital signal design targets, not speaker SPL or hearing-safety guarantees.
// OfflineAudioContext renders into memory; these tests never open audio output.
async function measureSound(sound: SoundType, loudness: LoudnessLevel) {
  const context = new OfflineAudioContext(
    1,
    Math.ceil(SAMPLE_RATE * soundDuration(sound)),
    SAMPLE_RATE,
  );
  playReminderSound(sound, loudness, context as unknown as BaseAudioContext);
  const rendered = await context.startRendering();
  const samples = rendered.getChannelData(0);
  let peak = 0;
  let energy = 0;
  let firstAudibleSample = -1;
  let lastAudibleSample = -1;
  for (let index = 0; index < samples.length; index++) {
    const sample = samples[index];
    assert.ok(Number.isFinite(sample), `${sound}_${loudness}: finite samples`);
    peak = Math.max(peak, Math.abs(sample));
    energy += sample * sample;
    if (Math.abs(sample) >= AUDIBLE_THRESHOLD) {
      if (firstAudibleSample === -1) firstAudibleSample = index;
      lastAudibleSample = index;
    }
  }
  return {
    peak,
    rms: Math.sqrt(energy / samples.length),
    audibleSpanSeconds:
      firstAudibleSample === -1
        ? 0
        : (lastAudibleSample - firstAudibleSample + 1) / SAMPLE_RATE,
    onsetRms: Math.sqrt(samples.slice(0, 441).reduce((sum, v) => sum + v * v, 0) / 441),
    tailRms: Math.sqrt(samples.slice(-882).reduce((sum, v) => sum + v * v, 0) / 882),
  };
}

for (const sound of SOUNDS) {
  test(`${sound}: gentle reminder remains audible across its envelope`, async (t) => {
    const soft = await measureSound(sound, "soft");
    const clear = await measureSound(sound, "clear");
    for (const [loudness, metrics] of [
      ["soft", soft],
      ["clear", clear],
    ] as const) {
      await t.test(`${loudness}: no clipping and sufficient peak headroom`, () => {
        assert.ok(
          metrics.peak <= MAX_PEAK,
          `peak ${metrics.peak.toFixed(4)} must be <= ${MAX_PEAK}`,
        );
      });
      await t.test(`${loudness}: full-duration RMS meets the audibility target`, () => {
        assert.ok(
          metrics.rms >= MIN_RMS[loudness],
          `RMS ${metrics.rms.toFixed(4)} must be >= ${MIN_RMS[loudness]}`,
        );
      });
      await t.test(`${loudness}: audible span lasts at least 0.60 seconds`, () => {
        assert.ok(
          metrics.audibleSpanSeconds >= MIN_AUDIBLE_SPAN_SECONDS,
          `span ${metrics.audibleSpanSeconds.toFixed(4)}s above -40 dBFS must be >= ${MIN_AUDIBLE_SPAN_SECONDS}s`,
        );
      });
      if (["brook", "ceramic", "shore", "breeze", "birds", "woodland"].includes(sound)) {
        await t.test(`${loudness}: gentle onset and fade leave no abrupt edges`, () => {
          assert.ok(metrics.onsetRms < metrics.rms * 0.1, "first 10ms must fade in");
          assert.ok(metrics.tailRms < metrics.rms * 0.02, "last 20ms must fade out");
        });
      }
    }
    await t.test("clear is louder than soft by at least 2 dB", () => {
      assert.ok(soft.rms < clear.rms, "soft RMS must remain below clear RMS");
      const differenceDB = 20 * Math.log10(clear.rms / soft.rms);
      assert.ok(differenceDB >= 2, `RMS difference ${differenceDB.toFixed(2)} dB`);
    });
  });
}
