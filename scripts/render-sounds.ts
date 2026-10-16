import { OfflineAudioContext } from "node-web-audio-api";
import { writeFile, mkdir } from "node:fs/promises";
import { playReminderSound } from "../src/utils/audio";
import type { SoundType, LoudnessLevel } from "../src/types/reminder";

const rate = 44100,
  duration = 1.2;
await mkdir("native/sounds", { recursive: true });
for (const sound of [
  "celesta",
  "bamboo",
  "chime",
  "raindrop",
  "singingbowl",
  "morning",
] as SoundType[]) {
  for (const loudness of ["soft", "clear"] as LoudnessLevel[]) {
    const context = new OfflineAudioContext(
      1,
      Math.ceil(rate * duration),
      rate,
    );
    playReminderSound(sound, loudness, context as unknown as BaseAudioContext);
    const audio = await context.startRendering();
    const samples = audio.getChannelData(0);
    const bytes = Buffer.alloc(44 + samples.length * 2);
    bytes.write("RIFF", 0);
    bytes.writeUInt32LE(bytes.length - 8, 4);
    bytes.write("WAVEfmt ", 8);
    bytes.writeUInt32LE(16, 16);
    bytes.writeUInt16LE(1, 20);
    bytes.writeUInt16LE(1, 22);
    bytes.writeUInt32LE(rate, 24);
    bytes.writeUInt32LE(rate * 2, 28);
    bytes.writeUInt16LE(2, 32);
    bytes.writeUInt16LE(16, 34);
    bytes.write("data", 36);
    bytes.writeUInt32LE(samples.length * 2, 40);
    let peak = 0,
      energy = 0;
    for (let i = 0; i < samples.length; i++) {
      const value = samples[i];
      peak = Math.max(peak, Math.abs(value));
      energy += value * value;
      if (!Number.isFinite(value) || Math.abs(value) > 1)
        throw new Error(`${sound}: invalid/clipped audio`);
      bytes.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
    }
    if (peak < 0.001) throw new Error(`${sound}: silent export`);
    await writeFile(`native/sounds/${sound}_${loudness}.wav`, bytes);
    console.log(
      `${sound}_${loudness}.wav: ${duration}s PCM16, peak=${peak.toFixed(3)}, RMS=${Math.sqrt(energy / samples.length).toFixed(4)}`,
    );
  }
}
