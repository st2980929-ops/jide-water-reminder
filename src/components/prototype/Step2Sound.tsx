import React, { useState, useEffect, useRef } from "react";
import type {
  ReminderConfig,
  SoundType,
} from "../../types/reminder";
import { notifications, isIPhoneApp, type NativeStatus } from "../../native/notifications";
import { playReminderSound, stopCurrentSound } from "../../utils/audio";
import { SOUNDS, soundName, canonicalSound, soundDuration, getSoundVolume } from "../../utils/sounds";
import { Volume2, ArrowLeft } from "lucide-react";
import { getThemeTokens } from "../../utils/theme";
interface Props {
  config: ReminderConfig;
  onChange: (updated: Partial<ReminderConfig>) => void;
  onBack: () => void;
  onComplete: () => void;
  onTriggerTestNotification: () => void;
  onTestSystemSound: () => void;
  onOpenSettings: () => void;
  status?: NativeStatus | null;
  isDarkMode?: boolean;
  busy?: boolean;
}
export function Step2Sound({
  config,
  onChange,
  onBack,
  onComplete,
  onTriggerTestNotification,
  onTestSystemSound,
  onOpenSettings,
  status,
  isDarkMode = false,
  busy = false,
}: Props) {
  const t = getThemeTokens(isDarkMode);
  const [playing, setPlaying] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const previewGeneration = useRef(0);
  const [now, setNow] = useState(Date.now);
  const timer = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      previewGeneration.current += 1;
      stopCurrentSound();
      if (isIPhoneApp) void notifications.stopPreviewSound().catch(() => {});
      window.clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!status?.testReminderAt) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [status?.testReminderAt]);
  const remaining = Math.max(
    0,
    Math.ceil(((status?.testReminderAt ?? 0) - now) / 1000),
  );
  const selected = SOUNDS.find((s) => s.id === canonicalSound(config.sound)) ?? SOUNDS[0];
  const volume = getSoundVolume(config);
  const stopPreview = () => {
    previewGeneration.current += 1;
    stopCurrentSound();
    if (isIPhoneApp) void notifications.stopPreviewSound().catch(() => {});
    window.clearTimeout(timer.current);
    setPlaying(false);
  };
  const preview = async () => {
    const request = ++previewGeneration.current;
    setPlaying(true);
    setPreviewError("");
    try {
      if (isIPhoneApp) {
        await notifications.previewSound(`${selected.id}_clear.wav`, volume);
        if (request === previewGeneration.current) setPlaying(false);
        return;
      }
      const started = await playReminderSound(config.sound, volume);
      if (request !== previewGeneration.current) return;
      if (!started) { setPlaying(false); return; }
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setPlaying(false), soundDuration(config.sound) * 1000 + 150);
    } catch (error) {
      if (request !== previewGeneration.current) return;
      setPlaying(false);
      setPreviewError(error instanceof Error ? error.message : "试听没有成功，请再试一次。");
    }
  };
  const fieldStyle = {
    backgroundColor: t.surface,
    borderColor: t.separator,
    color: t.textPrimary,
  };
  return (
    <main className="flex-1 px-6 pt-3 pb-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 min-h-11 text-sm"
        style={{ color: t.accent }}
      >
        <ArrowLeft size={17} />
        {config.hasCompletedSetup ? "返回设置" : "返回安排提醒"}
      </button>
      <div className="mt-5 mb-7">
        {!config.hasCompletedSetup && (
          <p className="text-xs mb-2" style={{ color: t.textSecondary }}>
            第 2 步 · 声音与通知
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">声音与通知</h1>
        <p
          className="text-sm mt-2 leading-relaxed"
          style={{ color: t.textSecondary }}
        >
          轻轻提醒，留一点照顾自己的时间。
        </p>
      </div>
      <div className="space-y-6">
        <div>
          <label
            htmlFor="reminder-sound"
            className="text-xs font-medium block mb-2"
            style={{ color: t.textSecondary }}
          >
            提示音
          </label>
          <div className="flex gap-3">
            <select
              id="reminder-sound"
              value={selected.id}
              onChange={(e) => {
                stopPreview();
                setPreviewError("");
                onChange({ sound: e.target.value as SoundType });
              }}
              className="min-w-0 flex-1 min-h-12 px-3 rounded-xl border text-base"
              style={fieldStyle}
            >
              {SOUNDS.map((sound) => (
                <option key={sound.id} value={sound.id}>{sound.name}</option>
              ))}
            </select>
            <button
              onClick={preview}
              disabled={playing || volume === 0}
              className="min-h-12 px-4 rounded-xl border flex items-center gap-1.5 text-sm"
              style={{ ...fieldStyle, color: t.accent }}
            >
              <Volume2 size={17} />
              {volume === 0 ? "已静音" : playing ? "播放中" : "试听"}
            </button>
          </div>
          {previewError && <p role="alert" className="text-xs mt-2" style={{ color: t.error }}>{previewError}</p>}
          <p
            className="text-xs mt-2 leading-relaxed"
            style={{ color: t.textSecondary }}
          >
            {selected.desc}
          </p>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="sound-volume" className="text-xs font-medium" style={{ color: t.textSecondary }}>提示音基础音量</label>
            <output htmlFor="sound-volume" className="text-sm font-medium tabular-nums" style={{ color: t.accent }}>{volume}%</output>
          </div>
          <input
            id="sound-volume"
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            aria-valuetext={`${volume}%${volume === 0 ? "，提示音已关闭" : ""}`}
            aria-describedby="sound-volume-help"
            className="sound-volume-slider"
            style={{
              "--volume-accent": t.accent,
              "--volume-surface": t.surface,
              "--volume-empty": t.separator,
              "--volume-percent": `${volume}%`,
            } as React.CSSProperties}
            onChange={(event) => {
              stopPreview();
              setPreviewError("");
              onChange({ soundVolume: Number(event.target.value) });
            }}
          />
          <div className="flex justify-between text-xs" style={{ color: t.textSecondary }}><span>静音</span><span>最大</span></div>
          <p
            id="sound-volume-help"
            className="text-xs mt-2 leading-relaxed"
            style={{ color: t.textSecondary }}
          >
            {volume === 0 ? "保存后关闭提示音，通知仍会显示。" : "调节提示音本身的大小，不改变手机系统音量。"}
          </p>
        </div>
        <p
          className="text-xs leading-relaxed"
          style={{ color: t.textSecondary }}
        >
          试听和通知使用相同的基础大小。试听还受媒体音量影响，通知受 iPhone「铃声和提醒」音量影响。修改后点保存，用于日常提醒。
        </p>
        <button
          disabled={busy}
          onClick={onComplete}
          className="w-full min-h-12 rounded-2xl text-base font-medium"
          style={{ backgroundColor: t.accent, color: t.onAccent }}
        >
          {busy
            ? "正在保存…"
            : config.hasCompletedSetup
              ? "保存声音"
              : "启用提醒"}
        </button>
      </div>
      {config.notificationPermission === "granted" && (
        <section
          className="mt-8 pt-5 border-t"
          style={{ borderColor: t.separator }}
        >
          <h2 className="text-sm font-medium">听听实际通知</h2>
          <p
            className="text-xs mt-2 leading-relaxed"
            style={{ color: t.textSecondary }}
          >
            测试当前选择，不改变已保存的安排。点击后退出本 App，等待 10 秒，也可以回到视频中比较。
          </p>
          <button
            disabled={busy || remaining > 0}
            onClick={() => { stopPreview(); onTriggerTestNotification(); }}
            className="w-full min-h-11 mt-3 rounded-xl border text-sm"
            style={{ ...fieldStyle, color: t.accent }}
          >
            {remaining > 0
              ? `请等这条测试送达 · ${remaining} 秒`
              : "测试所选提示音（10 秒后）"}
          </button>
          <details className="mt-4 text-xs" style={{ color: t.textSecondary }}>
            <summary className="min-h-11 flex items-center cursor-pointer underline">
              通知没有声音？
            </summary>
            <p className="leading-relaxed mt-1">
              先测试所选提示音，再测试系统默认音。两次请用相同场景比较，例如锁屏或播放同一段视频。
            </p>
            {status && (
              <dl className="mt-3 space-y-2 leading-relaxed">
                <div>
                  <dt className="inline">系统通知声音：</dt>
                  <dd className="inline">
                    {status.soundEnabled ? "已开启" : "已关闭"}
                  </dd>
                </div>
                <div>
                  <dt className="inline">已保存的提示音：</dt>
                  <dd className="inline">
                    {status.savedSound
                      ? `${soundName(status.savedSound)} · ${status.savedVolume ?? (status.savedSound.includes("_soft") ? 65 : 100)}%`
                      : "未保存"}
                  </dd>
                </div>
                {status.hasPlan && (
                  <div>
                    <dt className="inline">已保存的音频文件：</dt>
                    <dd className="inline">
                      {status.soundResourceAvailable
                        ? "完整"
                        : "需要重新保存声音"}
                    </dd>
                  </div>
                )}
              </dl>
            )}
            <button
              disabled={busy || remaining > 0}
              onClick={() => { stopPreview(); onTestSystemSound(); }}
              className="w-full min-h-11 mt-4 rounded-xl border text-sm"
              style={{ ...fieldStyle, color: t.accent }}
            >
              测试系统默认音（10 秒后）
            </button>
          </details>
        </section>
      )}
      {(config.notificationPermission === "denied" ||
        status?.soundEnabled === false) && (
        <div
          className="mt-6 text-sm leading-relaxed"
          style={{ color: t.error }}
        >
          <p>
            {config.notificationPermission === "denied"
              ? "通知权限未开启"
              : "系统未允许通知发声"}
          </p>
          <button
            onClick={onOpenSettings}
            className="min-h-11 underline"
            style={{ color: t.accent }}
          >
            前往 iPhone 设置
          </button>
        </div>
      )}
      {!config.hasCompletedSetup && (
        <p
          className="text-xs text-center mt-5"
          style={{ color: t.textSecondary }}
        >
          只需允许通知，无需日历、定位或通讯录权限。
        </p>
      )}
    </main>
  );
}
