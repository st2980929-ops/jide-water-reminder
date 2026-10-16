import React, { useState, useEffect } from "react";
import type { ReminderConfig, SoundType } from "../../types/reminder";
import { playReminderSound, stopCurrentSound } from "../../utils/audio";
import { Volume2, Bell, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { getThemeTokens } from "../../utils/theme";

interface Props {
  config: ReminderConfig;
  onChange: (updated: Partial<ReminderConfig>) => void;
  onBack: () => void;
  onComplete: () => void;
  onTriggerTestNotification: () => void;
  onOpenSettings: () => void;
  isDarkMode?: boolean;
  busy?: boolean;
}
const SOUNDS: { id: SoundType; name: string; desc: string }[] = [
  { id: "celesta", name: "清泉水琴", desc: "清澈的水晶琴鸣，柔和而清润" },
  { id: "bamboo", name: "空灵竹韵", desc: "温润的竹管共鸣，带一点空气感" },
  { id: "chime", name: "短风铃", desc: "微风掠过的清透双音" },
  { id: "raindrop", name: "晨雨露滴", desc: "轻轻落下的一滴晨雨" },
  { id: "singingbowl", name: "静谧铜磬", desc: "低沉悠远的金属泛音" },
  { id: "morning", name: "晨光微弦", desc: "温暖的琴弦双音和弦" },
];
export function Step2Sound({
  config,
  onChange,
  onBack,
  onComplete,
  onTriggerTestNotification,
  onOpenSettings,
  isDarkMode = false,
  busy = false,
}: Props) {
  const t = getThemeTokens(isDarkMode),
    [playing, setPlaying] = useState<SoundType | null>(null);
  useEffect(() => () => stopCurrentSound(), []);
  const preview = (id: SoundType) => {
    setPlaying(id);
    playReminderSound(id, config.loudness);
    window.setTimeout(
      () => setPlaying((value) => (value === id ? null : value)),
      2000,
    );
  };
  return (
    <div
      className="flex-1 flex flex-col justify-between px-6 pt-5 pb-6"
      style={{ backgroundColor: t.background, color: t.textPrimary }}
    >
      <div className="space-y-5">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-11 text-xs"
          style={{ color: t.textSecondary }}
        >
          <ArrowLeft size={16} />
          返回安排提醒
        </button>
        <div>
          <p className="text-xs mb-1" style={{ color: t.textSecondary }}>
            第 2 步 · 声音与通知
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">选择提示音</h1>
          <p className="text-sm mt-2" style={{ color: t.textSecondary }}>
            轻轻提醒一下，留一点照顾自己的时间。
          </p>
        </div>
        <div className="space-y-2" role="radiogroup" aria-label="提示音">
          {SOUNDS.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border flex items-center px-3"
              style={{
                backgroundColor:
                  config.sound === s.id ? t.selectedSoft : t.surface,
                borderColor: config.sound === s.id ? t.accent : t.separator,
              }}
            >
              <button
                role="radio"
                aria-checked={config.sound === s.id}
                onClick={() => onChange({ sound: s.id })}
                className="text-left flex-1 py-3 min-h-16"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {s.name}
                  {config.sound === s.id && (
                    <Check size={14} style={{ color: t.accent }} />
                  )}
                </span>
                <span
                  className="block text-xs mt-1"
                  style={{ color: t.textSecondary }}
                >
                  {s.desc}
                </span>
              </button>
              <button
                aria-label={`试听${s.name}`}
                onClick={() => preview(s.id)}
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: playing === s.id ? t.accent : t.input,
                  color: playing === s.id ? t.onAccent : t.accent,
                }}
              >
                <Volume2 size={17} />
              </button>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-medium mb-2">声音版本</p>
          <div className="flex gap-2">
            {(["soft", "clear"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={config.loudness === value}
                onClick={() => onChange({ loudness: value })}
                className="flex-1 min-h-11 rounded-xl border text-sm"
                style={{
                  backgroundColor:
                    config.loudness === value ? t.selectedSoft : t.surface,
                  borderColor:
                    config.loudness === value ? t.accent : t.separator,
                }}
              >
                {value === "soft" ? "柔和" : "清晰"}
              </button>
            ))}
          </div>
        </div>
        <p
          className="text-xs leading-relaxed"
          style={{ color: t.textSecondary }}
        >
          两个版本的音频响度不同。实际通知音量仍由
          iPhone「铃声和提醒」控制，并遵守静音与专注模式；App
          不能单独设置系统通知音量。
        </p>
        {config.notificationPermission === "denied" && (
          <div
            className="p-4 rounded-2xl border text-xs space-y-2"
            style={{ borderColor: t.error, backgroundColor: t.surface }}
          >
            <p className="flex gap-2 items-center">
              <AlertTriangle size={16} />
              通知权限未开启
            </p>
            <button
              onClick={onOpenSettings}
              className="underline min-h-11"
              style={{ color: t.accent }}
            >
              前往 iPhone 设置开启通知
            </button>
          </div>
        )}
      </div>
      <div
        className="mt-6 pt-4 border-t space-y-3"
        style={{ borderColor: t.separator }}
      >
        {config.notificationPermission === "granted" && (
          <button
            onClick={onTriggerTestNotification}
            className="w-full min-h-11 text-sm"
            style={{ color: t.accent }}
          >
            发送测试提醒（10 秒后）
          </button>
        )}
        <button
          disabled={busy}
          onClick={onComplete}
          className="w-full h-12 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
          style={{ backgroundColor: t.accent, color: t.onAccent }}
        >
          <Bell size={17} />
          {busy
            ? "正在保存安排…"
            : config.hasCompletedSetup
              ? "保存并启用提醒"
              : "启用提醒"}
        </button>
        <p className="text-xs text-center" style={{ color: t.textSecondary }}>
          只需允许通知，无需日历、定位或通讯录权限。
        </p>
      </div>
    </div>
  );
}
