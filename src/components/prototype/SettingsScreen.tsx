import React from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { ReminderConfig } from "../../types/reminder";
import { getThemeTokens } from "../../utils/theme";
import { generateNaturalSummary } from "../../utils/scheduleCalculator";
import { soundName } from "../../utils/sounds";
export type Appearance = "system" | "light" | "dark";
interface Props {
  config: ReminderConfig;
  onBack: () => void;
  onEditSchedule: () => void;
  onEditSound: () => void;
  onToggleEnabled: () => void;
  appearance: Appearance;
  onAppearanceChange: (value: Appearance) => void;
  isDarkMode: boolean;
}
export function SettingsScreen({
  config,
  onBack,
  onEditSchedule,
  onEditSound,
  onToggleEnabled,
  appearance,
  onAppearanceChange,
  isDarkMode,
}: Props) {
  const t = getThemeTokens(isDarkMode);
  const enabled = !config.isPausedToday;
  return (
    <main className="px-6 pt-3 pb-8">
      <button
        onClick={onBack}
        className="min-h-11 inline-flex items-center gap-1 text-sm"
        style={{ color: t.accent }}
      >
        <ArrowLeft size={17} />
        返回
      </button>
      <h1 className="text-2xl font-semibold mt-5 mb-7">设置</h1>
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: t.surface, borderColor: t.separator }}
      >
        <div className="p-4 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-base font-medium">提醒开关</p>
            <p className="text-xs mt-1.5" style={{ color: t.textSecondary }}>
              {!enabled
                ? "已暂停，手动开启后恢复"
                : config.notificationPermission !== "granted"
                  ? "通知权限未开启"
                  : "按保存的日程提醒"}
            </p>
          </div>
          <button
            role="switch"
            aria-label="提醒开关"
            aria-checked={enabled}
            onClick={onToggleEnabled}
            className="w-14 h-11 flex items-center justify-center shrink-0"
          >
            <span
              className="w-12 h-7 rounded-full p-0.5 flex items-center"
              style={{ backgroundColor: enabled ? t.accent : t.separator }}
            >
              <span
                className={`block w-6 h-6 rounded-full transition-transform ${enabled ? "translate-x-5" : ""}`}
                style={{ backgroundColor: enabled ? t.onAccent : t.surface }}
              />
            </span>
          </button>
        </div>
        {[
          {
            title: "提醒安排",
            value: generateNaturalSummary(config),
            action: onEditSchedule,
          },
          {
            title: "声音与通知",
            value: `${soundName(config.sound)} · ${config.loudness === "soft" ? "柔和" : "清晰"}`,
            action: onEditSound,
          },
        ].map((row) => (
          <button
            key={row.title}
            onClick={row.action}
            className="w-full text-left p-4 border-t flex items-center gap-4"
            style={{ borderColor: t.separator }}
          >
            <span className="flex-1">
              <span className="block text-base font-medium">{row.title}</span>
              <span
                className="block text-xs mt-1.5 leading-relaxed"
                style={{ color: t.textSecondary }}
              >
                {row.value}
              </span>
            </span>
            <ChevronRight size={17} style={{ color: t.textSecondary }} />
          </button>
        ))}
      </div>
      <div className="mt-7 flex items-center justify-between gap-4">
        <label htmlFor="appearance" className="text-sm">
          外观
        </label>
        <select
          id="appearance"
          value={appearance}
          onChange={(e) => onAppearanceChange(e.target.value as Appearance)}
          className="min-h-11 rounded-xl px-3 text-sm border"
          style={{ backgroundColor: t.surface, borderColor: t.separator }}
        >
          <option value="system">跟随系统</option>
          <option value="light">浅色</option>
          <option value="dark">深色</option>
        </select>
      </div>
      <p
        className="text-xs leading-relaxed mt-9"
        style={{ color: t.textSecondary }}
      >
        设置保存在本机。安排好以后，不必每天打开。
      </p>
    </main>
  );
}
