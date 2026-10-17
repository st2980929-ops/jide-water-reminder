import { SoundType, LoudnessLevel } from '../types/reminder';
import { canonicalSound, soundDuration } from './sounds';
import { naturalSoundSource } from './natural-sounds';

let audioCtx: AudioContext | null = null;
let currentSourceNodes: { stop?: () => void }[] = [];

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function stopCurrentSound() {
  currentSourceNodes.forEach((node) => {
    try {
      if (node.stop) node.stop();
    } catch {
      // ignore if already stopped
    }
  });
  currentSourceNodes = [];
}

// The original exponential tails reached near-silence within a few tenths of a second.
// Hold enough of the tone to be recognizable without a hard attack or an abrupt cutoff.
function reminderEnvelope(param: AudioParam, start: number, peak: number, attackEnd: number, end: number) {
  const attack = Math.max(attackEnd, start + 0.025);
  param.setValueAtTime(0, start);
  param.linearRampToValueAtTime(peak, attack);
  param.exponentialRampToValueAtTime(peak * 0.75, attack + 0.12);
  param.exponentialRampToValueAtTime(peak * 0.14, end - 0.10);
  param.linearRampToValueAtTime(0, end);
}

/**
 * 提醒提示音播放：
 * 1. celesta (清泉水琴): 纯净空灵的水晶琴鸣，柔和清润，取代生硬单滴
 * 2. bamboo  (空灵竹韵): 带有自然管腔空气感的温润竹音，悠远沉静，取代干燥敲击
 * 3. chime   (短风铃): 清澈双音微风铃
 */
export function playReminderSound(type: SoundType, loudness: LoudnessLevel = 'clear', context?: BaseAudioContext) {
  try {
    const ctx = context ?? getAudioContext();
    if (!context) stopCurrentSound();

    const effectiveType = canonicalSound(type);
    const natural = naturalSoundSource(effectiveType, loudness, ctx, soundDuration(effectiveType));
    if (natural) {
      natural.start(ctx.currentTime);
      currentSourceNodes = [natural];
      return;
    }
    // Compensate the bamboo filter and avoid brighter celesta partials dominating the set.
    const balance = effectiveType === 'bamboo' ? 1.6
      : effectiveType === 'celesta' ? 0.83
      : effectiveType === 'singingbowl' ? 0.90
      : effectiveType === 'morning' ? 1.05 : 1;
    const gainFactor = (loudness === 'soft' ? 0.56 : 0.86) * balance;
    const now = ctx.currentTime;

    if (effectiveType === 'celesta') {
      // 清泉水琴 (Spring Celesta)：双层水琴谐音，如甘泉滴入调音水琴，清澈空灵
      // 主音 C6 (1046.5Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, now);
      osc1.frequency.exponentialRampToValueAtTime(1040, now + 0.35);

      reminderEnvelope(gain1.gain, now, gainFactor * 0.65, now + 0.012, now + 0.94);

      // 泛音 G6 (1568Hz) + 微琶音滞后 35ms
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1568, now + 0.035);
      osc2.frequency.exponentialRampToValueAtTime(1560, now + 0.4);

      reminderEnvelope(gain2.gain, now + 0.035, gainFactor * 0.45, now + 0.048, now + 1.02);

      // 空灵高频泛音 E7 (2637Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(2637, now + 0.07);

      reminderEnvelope(gain3.gain, now + 0.07, gainFactor * 0.18, now + 0.08, now + 0.8);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.965);
      osc2.start(now + 0.035);
      osc2.stop(now + 1.045);
      osc3.start(now + 0.07);
      osc3.stop(now + 0.825);

      currentSourceNodes = [osc1, osc2, osc3];
    } else if (effectiveType === 'bamboo') {
      // 空灵竹韵 (Bamboo Resonance)：日本水琴窟/鹿惊竹管落水共鸣，中低频温润管腔空气感
      // 基频 G4 (392Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(392, now);
      osc.frequency.exponentialRampToValueAtTime(370, now + 0.35);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(520, now);
      filter.Q.setValueAtTime(4.5, now);

      reminderEnvelope(gain.gain, now, gainFactor * 0.8, now + 0.008, now + 0.95);

      // 管内空气次级泛音 (784Hz)
      const oscSub = ctx.createOscillator();
      const gainSub = ctx.createGain();
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(784, now + 0.015);
      oscSub.frequency.exponentialRampToValueAtTime(740, now + 0.28);

      reminderEnvelope(gainSub.gain, now + 0.015, gainFactor * 0.35, now + 0.022, now + 0.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      oscSub.connect(gainSub);
      gainSub.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.975);
      oscSub.start(now + 0.015);
      oscSub.stop(now + 0.875);

      currentSourceNodes = [osc, oscSub];
    } else if (effectiveType === 'chime') {
      // 短风铃 (Gentle Chime): 清澈柔和的双音微风铃
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.5, now); // E6

      reminderEnvelope(gain1.gain, now, gainFactor * 0.45, now + 0.02, now + 0.98);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1975.5, now + 0.06); // B6

      reminderEnvelope(gain2.gain, now + 0.06, gainFactor * 0.38, now + 0.08, now + 1.08);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 1.005);
      osc2.start(now + 0.06);
      osc2.stop(now + 1.105);

      currentSourceNodes = [osc1, osc2];
    } else if (effectiveType === 'raindrop') {
      // 晨雨露滴 (Raindrop Ripple): 清晨雨滴滴落荷叶的温润微波，极度柔和放松
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(460, now + 0.12);

      reminderEnvelope(gain.gain, now, gainFactor * 0.7, now + 0.015, now + 0.82);

      // 伴生微波泛音
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(960, now);
      osc2.frequency.exponentialRampToValueAtTime(690, now + 0.08);

      reminderEnvelope(gain2.gain, now, gainFactor * 0.25, now + 0.012, now + 0.72);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.845);
      osc2.start(now);
      osc2.stop(now + 0.745);

      currentSourceNodes = [osc, osc2];
    } else if (effectiveType === 'singingbowl') {
      // 静谧铜磬 (Singing Bowl): 432Hz 颂钵沉浸共鸣，深沉悠远
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, now); // A4 (432Hz)
      osc.frequency.linearRampToValueAtTime(430, now + 0.9);

      reminderEnvelope(gain.gain, now, gainFactor * 0.65, now + 0.03, now + 1.05);

      // 次高谐音 864Hz
      const oscH = ctx.createOscillator();
      const gainH = ctx.createGain();
      oscH.type = 'sine';
      oscH.frequency.setValueAtTime(864, now);

      reminderEnvelope(gainH.gain, now, gainFactor * 0.25, now + 0.04, now + 0.95);

      osc.connect(gain);
      gain.connect(ctx.destination);
      oscH.connect(gainH);
      gainH.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.075);
      oscH.start(now);
      oscH.stop(now + 0.975);

      currentSourceNodes = [osc, oscH];
    } else if (effectiveType === 'morning') {
      // 晨光微弦 (Morning Chord): 清晨尼龙琴弦双音和弦 (E4 329.6Hz + G#4 415.3Hz)，温暖惬意
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(329.6, now); // E4

      reminderEnvelope(gain1.gain, now, gainFactor * 0.55, now + 0.015, now + 1.0);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(415.3, now + 0.04); // G#4

      reminderEnvelope(gain2.gain, now + 0.04, gainFactor * 0.45, now + 0.055, now + 1.08);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      osc1.connect(gain1);
      gain1.connect(filter);
      osc2.connect(gain2);
      gain2.connect(filter);
      filter.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 1.025);
      osc2.start(now + 0.04);
      osc2.stop(now + 1.105);

      currentSourceNodes = [osc1, osc2];
    }
  } catch (e) {
    if (context) throw e;
    console.warn('Audio playback error', e);
  }
}

/**
 * 喝水确认音效：短促自然的喉部“咕噜”吞咽声 (Real Throat Gulp/Swallow)
 * 通过 Web Audio API 合成喉管入水下潜与吞咽肌群闭合的双段微水腔共鸣
 * 总时长约 160–180ms，短促清脆，真实模拟吞咽感且彻底独立于系统音效
 */
export function playDrinkWaterSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    stopCurrentSound();
    const now = ctx.currentTime;

    // === 第 1 阶段：“咕” (Glug: 喉头吸液共鸣，快速下潜滑音，约 65ms) ===
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const filter1 = ctx.createBiquadFilter();

    osc1.type = 'sine';
    // 快速下潜滑音：从 380Hz 迅速滑向 190Hz
    osc1.frequency.setValueAtTime(380, now);
    osc1.frequency.exponentialRampToValueAtTime(190, now + 0.065);

    // 喉管口腔带通共振峰 (Throat Cavity Formant)
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(460, now);
    filter1.frequency.linearRampToValueAtTime(280, now + 0.065);
    filter1.Q.setValueAtTime(4.2, now);

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.44, now + 0.012);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    // 喉部深层微共振 (80Hz~125Hz，赋予吞咽扎实的肉感)
    const oscSub = ctx.createOscillator();
    const gainSub = ctx.createGain();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(125, now);
    oscSub.frequency.exponentialRampToValueAtTime(75, now + 0.06);

    gainSub.gain.setValueAtTime(0.0001, now);
    gainSub.gain.linearRampToValueAtTime(0.30, now + 0.01);
    gainSub.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);

    oscSub.connect(gainSub);
    gainSub.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.08);
    oscSub.start(now);
    oscSub.stop(now + 0.07);

    // === 第 2 阶段：“噜” (Swallow Reflex: 吞咽肌闭合微回弹，滞后 52ms，约 85ms) ===
    const t2 = now + 0.052;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const filter2 = ctx.createBiquadFilter();

    osc2.type = 'sine';
    // 吞咽回弹与微水滴收尾：从 325Hz 滑向 215Hz
    osc2.frequency.setValueAtTime(325, t2);
    osc2.frequency.exponentialRampToValueAtTime(215, t2 + 0.07);

    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(530, t2);
    filter2.frequency.linearRampToValueAtTime(350, t2 + 0.07);
    filter2.Q.setValueAtTime(4.5, t2);

    gain2.gain.setValueAtTime(0.0001, t2);
    gain2.gain.linearRampToValueAtTime(0.40, t2 + 0.014);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.095);

    // 清润液滴微爆音 (Moist Liquid Release)
    const oscPop = ctx.createOscillator();
    const gainPop = ctx.createGain();
    oscPop.type = 'sine';
    oscPop.frequency.setValueAtTime(490, t2 + 0.025);
    oscPop.frequency.exponentialRampToValueAtTime(370, t2 + 0.075);

    gainPop.gain.setValueAtTime(0.0001, t2 + 0.025);
    gainPop.gain.linearRampToValueAtTime(0.18, t2 + 0.038);
    gainPop.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.088);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);

    oscPop.connect(gainPop);
    gainPop.connect(ctx.destination);

    osc2.start(t2);
    osc2.stop(t2 + 0.1);
    oscPop.start(t2 + 0.025);
    oscPop.stop(t2 + 0.09);

    currentSourceNodes = [osc1, oscSub, osc2, oscPop];
  } catch (e) {
    console.warn('Drink audio error', e);
  }
}
