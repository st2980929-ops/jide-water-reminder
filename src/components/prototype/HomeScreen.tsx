import React from "react";
import type { ReminderConfig } from "../../types/reminder";
import {
  calculateSchedule,
  nextReminderLabel,
} from "../../utils/scheduleCalculator";
import { CupWaterlineSVG } from "../logo/LogoSketches";
import { getThemeTokens } from "../../utils/theme";
import { Settings, Clock, Check } from "lucide-react";

interface Props {
  config: ReminderConfig;
  onOpenSettings: () => void;
  onDrinkGlass: () => void;
  onFixUnauthorized: () => void;
  isDarkMode?: boolean;
  nextReminderAt?: number | null;
  pendingCount?: number;
  planHealthy?: boolean;
}
export function HomeScreen({
  config,
  onOpenSettings,
  onDrinkGlass,
  onFixUnauthorized,
  isDarkMode = false,
  nextReminderAt,
  pendingCount,
  planHealthy,
}: Props) {
  const t = getThemeTokens(isDarkMode);
  const calculation = calculateSchedule(config);
  const needsRepair =
    config.notificationPermission === "granted" &&
    !config.isPausedToday &&
    (pendingCount === 0 || planHealthy === false) &&
    calculation.state !== "all_dates_passed";
  const next =
    config.notificationPermission === "granted" &&
    !config.isPausedToday &&
    nextReminderAt
      ? nextReminderLabel(new Date(nextReminderAt))
      : calculation.nextReminderText;
  const remaining = config.remainingGlasses;
  const waterLevel = Math.round((remaining / config.totalDailyGlasses) * 100);
  const unauthorized = calculation.state === "unauthorized";
  const actionNeeded =
    unauthorized || needsRepair || calculation.state === "all_dates_passed";
  return (
    <main
      className="flex-1 flex flex-col px-6 pt-3 pb-8"
      style={{ color: t.textPrimary }}
    >
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">喝水提醒</h1>
        <button
          aria-label="设置"
          onClick={onOpenSettings}
          className="w-11 h-11 flex items-center justify-center"
          style={{ color: t.textSecondary }}
        >
          <Settings size={21} strokeWidth={1.6} />
        </button>
      </header>
      <section className="flex-1 flex flex-col justify-center items-center py-10 text-center">
        <p className="text-sm mb-6" style={{ color: t.textSecondary }}>
          留一点时间，喝口水。
        </p>
        <div
          role="img"
          aria-label={`水杯里还剩 ${remaining} 杯的水位`}
          className="mb-6"
        >
          <CupWaterlineSVG
            size={176}
            color={t.textPrimary}
            waterColor={t.accent}
            waterLevel={waterLevel}
            isDarkMode={isDarkMode}
          />
        </div>
        <div aria-live="polite" aria-atomic="true">
          <h2 className="text-2xl font-medium tracking-tight">
            {remaining > 0 ? (
              <>
                今天还剩 <span className="tabular-nums">{remaining}</span> 杯
              </>
            ) : (
              "今天的八杯，记好了"
            )}
          </h2>
          <p
            className="text-xs mt-3 leading-relaxed"
            style={{ color: t.textSecondary }}
          >
            {remaining > 0
              ? "喝一杯，水位降一点。"
              : "饮水记录完成，提醒仍按你的安排进行。"}
          </p>
        </div>
        <button
          onClick={onDrinkGlass}
          disabled={remaining === 0}
          className="w-full min-h-12 rounded-2xl text-base font-medium mt-8 flex items-center justify-center gap-2"
          style={{ backgroundColor: t.accent, color: t.onAccent }}
        >
          {remaining === 0 && <Check size={18} />}
          {remaining > 0 ? "喝了一杯" : "今日已记满八杯"}
        </button>
        <p className="text-xs mt-3 min-h-5" style={{ color: t.textSecondary }}>
          {config.lastDrinkTime
            ? `上次记录 ${config.lastDrinkTime}`
            : "记录随心，不影响提醒。"}
        </p>
      </section>
      <section
        className="border-t pt-5 text-center"
        style={{ borderColor: t.separator }}
      >
        <p
          className="flex justify-center items-center gap-2 text-sm"
          style={{ color: actionNeeded ? t.warning : t.accent }}
        >
          <Clock size={15} />
          {needsRepair
            ? "系统提醒需要重新保存"
            : config.isPausedToday
              ? "提醒已暂停"
              : next}
        </p>
        {actionNeeded ? (
          <button
            onClick={unauthorized ? onFixUnauthorized : onOpenSettings}
            className="min-h-11 text-sm underline"
            style={{ color: t.accent }}
          >
            {unauthorized ? "开启通知" : "调整提醒安排"}
          </button>
        ) : (
          <p
            className="text-xs mt-2 leading-relaxed"
            style={{ color: t.textSecondary }}
          >
            {config.isPausedToday
              ? "需要时，在设置里恢复。"
              : "安排已保存，关掉 App 也会提醒。"}
          </p>
        )}
      </section>
    </main>
  );
}
