import type { LoudnessLevel } from '../types/reminder';

// Deterministic synthesis, so the preview and exported notification share the same source.
const NATURAL_SOUNDS = new Set(['brook', 'ceramic', 'shore', 'breeze', 'birds', 'woodland']);
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
function birdPhrase(time: number, start: number, duration: number, offset: number) {
  const t = time - start;
  if (t <= 0 || t >= duration) return 0;
  const x = t / duration;
  // A curved, lightly fluttering phrase, avoiding an electronic constant-pitch beep.
  const phase = TAU * ((1180 + offset) * t + 170 * duration / Math.PI * (1 - Math.cos(Math.PI * x))
    + 2.5 * Math.sin(TAU * 14 * t));
  return (Math.sin(phase) + 0.07 * Math.sin(2 * phase))
    * ease(t / 0.055) * ease((duration - t) / 0.13);
}

export function naturalSoundSource(
  type: string, loudness: LoudnessLevel, context: BaseAudioContext, duration: number, volumeScale = 1,
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
  const highCut = type === 'shore' ? 1200 : type === 'breeze' ? 2100 : 1700;
  const lowCut = type === 'shore' ? 130 : type === 'breeze' ? 450 : 220;
  const fastCoefficient = 1 - Math.exp(-TAU * highCut / rate);
  const slowCoefficient = 1 - Math.exp(-TAU * lowCut / rate);
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
    } else if (type === 'shore') {
      const swell = 0.3 + 0.7 * Math.sin(Math.PI * t / duration) ** 2;
      value = air * swell * ease(t / 0.30) * ease((duration - t) / 0.48);
    } else if (type === 'breeze') {
      const leaves = 0.72 + 0.17 * Math.sin(TAU * 2.3 * t) + 0.08 * Math.sin(TAU * 5.7 * t);
      value = air * leaves * ease(t / 0.24) * ease((duration - t) / 0.42);
    } else if (type === 'birds') {
      value = 0.45 * birdPhrase(t, 0.08, 0.42, -80)
        + 0.37 * birdPhrase(t, 0.65, 0.60, 35)
        + 0.025 * air * Math.sin(Math.PI * t / duration) ** 2;
    } else if (type === 'woodland') {
      value = ease(t / 0.035) * (
        Math.sin(TAU * 286 * t) * Math.exp(-2.4 * t)
        + 0.44 * Math.sin(TAU * 463 * t) * Math.exp(-3.8 * t)
        + 0.16 * Math.sin(TAU * 731 * t) * Math.exp(-5.0 * t)
        + 0.18 * air * Math.exp(-8.0 * t)
      );
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
  const scale = Math.min(0.16 / rms, 0.86 / peak) * (loudness === 'soft' ? 0.65 : 1) * volumeScale;
  for (let i = 0; i < samples.length; i++) samples[i] *= scale;
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  return source;
}
