import type { LoudnessLevel } from '../types/reminder';

// Deterministic synthesis, so the preview and exported notification share the same source.
const NATURAL_SOUNDS = new Set(['brook', 'ceramic']);
const TAU = Math.PI * 2;
const ease = (x: number) => {
  const v = Math.max(0, Math.min(1, x));
  return v * v * (3 - 2 * v);
};
function waterNote(time: number, start: number, frequency: number) {
  const t = time - start;
  if (t < 0) return 0;
  const phase = TAU * frequency * (0.73 * t + 0.027 * (1 - Math.exp(-t / 0.1)));
  return Math.sin(phase) * ease(t / 0.035) * Math.exp(-4.8 * t);
}

export function naturalSoundSource(
  type: string, loudness: LoudnessLevel, context: BaseAudioContext, duration: number,
): AudioBufferSourceNode | null {
  if (!NATURAL_SOUNDS.has(type)) return null;
  const rate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.ceil(rate * duration), rate);
  const samples = buffer.getChannelData(0);
  let randomState = 0x72ab914;
  const noise = () => {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    return (randomState >>> 0) / 0x100000000 * 2 - 1;
  };
  const fastCoefficient = 1 - Math.exp(-TAU * 1700 / rate);
  const slowCoefficient = 1 - Math.exp(-TAU * 220 / rate);
  let fast = 0, slow = 0, peak = 0, energy = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate;
    const white = noise();
    fast += fastCoefficient * (white - fast);
    slow += slowCoefficient * (white - slow);
    const air = fast - slow;
    let value = 0;
    if (type === 'brook') {
      value = air * 0.35 * (0.8 + 0.2 * Math.sin(TAU * 1.7 * t));
      value += 0.24 * waterNote(t, 0.02, 710) + 0.19 * waterNote(t, 0.29, 590);
      value += 0.17 * waterNote(t, 0.61, 820) + 0.14 * waterNote(t, 0.98, 660);
    } else if (type === 'ceramic') {
      const strike = ease(t / 0.04);
      value = strike * (
        Math.sin(TAU * 480 * t) * Math.exp(-1.9 * t)
        + 0.24 * Math.sin(TAU * 757.3 * t) * Math.exp(-3.0 * t)
        + 0.11 * Math.sin(TAU * 1173 * t) * Math.exp(-4.0 * t)
        + 0.025 * Math.sin(TAU * 1790 * t) * Math.exp(-5.0 * t)
      );
    }
    value *= ease(t / 0.07) * ease((duration - t) / 0.38);
    samples[i] = value;
    peak = Math.max(peak, Math.abs(value));
    energy += value * value;
  }
  const rms = Math.sqrt(energy / samples.length);
  // Match the existing set's digital level while retaining peak headroom and dynamics.
  const scale = Math.min(0.16 / rms, 0.86 / peak) * (loudness === 'soft' ? 0.65 : 1);
  for (let i = 0; i < samples.length; i++) samples[i] *= scale;
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  return source;
}
