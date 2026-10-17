import React, { useState, useEffect, useRef } from "react";
import type {
  ReminderConfig,
  SoundType,
  LoudnessLevel,
} from "../../types/reminder";
import type { NativeStatus } from "../../native/notifications";
import { playReminderSound, stopCurrentSound } from "../../utils/audio";
import { SOUNDS, soundName, canonicalSound } from "../../utils/sounds";
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
  const [now, setNow] = useState(Date.now);
  const timer = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      stopCurrentSound();
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
  const preview = () => {
    setPlaying(true);
    playReminderSound(config.sound, config.loudness);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPlaying(false), 1500);
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
                stopCurrentSound();
                setPlaying(false);
                onChange({ sound: e.target.value as SoundType });
              }}
              className="min-w-0 flex-1 min-h-12 px-3 rounded-xl border text-base"
              style={fieldStyle}
            >
              {SOUNDS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={preview}
              disabled={playing}
              className="min-h-12 px-4 rounded-xl border flex items-center gap-1.5 text-sm"
              style={{ ...fieldStyle, color: t.accent }}
            >
              <Volume2 size={17} />
              {playing ? "播放中" : "试听"}
            </button>
          </div>
          <p
            className="text-xs mt-2 leading-relaxed"
            style={{ color: t.textSecondary }}
          >
            {selected.desc}
          </p>
        </div>
        <div>
          <label
            htmlFor="sound-loudness"
            className="text-xs font-medium block mb-2"
            style={{ color: t.textSecondary }}
          >
            声音版本
          </label>
          <select
            id="sound-loudness"
            value={config.loudness}
            onChange={(e) =>
              onChange({ loudness: e.target.value as LoudnessLevel })
            }
            className="w-full min-h-12 px-3 rounded-xl border text-base"
            style={fieldStyle}
          >
            <option value="soft">柔和 · 温和自然</option>
            <option value="clear">清晰 · 更容易听见</option>
          </select>
          <p
            className="text-xs mt-2 leading-relaxed"
            style={{ color: t.textSecondary }}
          >
            安静时选柔和；看视频或周围较吵时，可以试试清晰。
          </p>
        </div>
        <p
          className="text-xs leading-relaxed"
          style={{ color: t.textSecondary }}
        >
          通知跟随 iPhone
          的「铃声和提醒」音量；这里的试听使用媒体音量。修改后点保存，才会用于日常提醒。
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
            onClick={onTriggerTestNotification}
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
                      ? `${soundName(status.savedSound)} · ${status.savedSound.includes("_clear") ? "清晰" : "柔和"}`
                      : "未保存"}
                  </dd>
                </div>
                {status.hasPlan && (
                  <div>
                    <dt className="inline">已保存的音频文件：</dt>
                    <dd className="inline">
                      {status.soundResourceAvailable
                        ? "完整"
                        : "缺失，请重新安装"}
                    </dd>
                  </div>
                )}
              </dl>
            )}
            <button
              disabled={busy || remaining > 0}
              onClick={onTestSystemSound}
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
