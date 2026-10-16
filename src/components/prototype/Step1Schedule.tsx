import React, { useState } from 'react';
import { ReminderConfig } from '../../types/reminder';
import { generateNaturalSummary, formatTimeMinutes } from '../../utils/scheduleCalculator';
import { Calendar as CalendarIcon, Clock, Coffee, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { getThemeTokens } from '../../utils/theme';

interface Step1ScheduleProps {
  config: ReminderConfig;
  onChange: (updated: Partial<ReminderConfig>) => void;
  onNext: () => void;
  isDarkMode?: boolean;
}

const INTERVAL_OPTIONS = [
  { label: '30 分钟', value: 30 },
  { label: '45 分钟', value: 45 },
  { label: '60 分钟', value: 60 },
  { label: '90 分钟', value: 90 },
  { label: '120 分钟', value: 120 },
];

const WEEKDAYS = [
  { day: 1, label: '一' },
  { day: 2, label: '二' },
  { day: 3, label: '三' },
  { day: 4, label: '四' },
  { day: 5, label: '五' },
  { day: 6, label: '六' },
  { day: 7, label: '日' },
];

export const Step1Schedule: React.FC<Step1ScheduleProps> = ({
  config,
  onChange,
  onNext,
  isDarkMode = false,
}) => {
  const t = getThemeTokens(isDarkMode);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  // Time validation
  const startMins = formatTimeMinutes(config.startTime);
  const endMins = formatTimeMinutes(config.endTime);
  const isOvernight = endMins <= startMins;

  const lunchStartMins = formatTimeMinutes(config.lunchStart);
  const lunchEndMins = formatTimeMinutes(config.lunchEnd);
  const isLunchInvalid = config.hasLunchBreak && lunchStartMins >= lunchEndMins;

  const isWorkdayEmpty = config.mode === 'workday' && config.workdays.length === 0;
  const isDatesEmpty = config.mode === 'specific_dates' && config.specificDates.length === 0;

  const hasValidationError = isLunchInvalid || isWorkdayEmpty || isDatesEmpty;

  const toggleWeekday = (day: number) => {
    let newDays = [...config.workdays];
    if (newDays.includes(day)) {
      newDays = newDays.filter((d) => d !== day);
    } else {
      newDays = [...newDays, day].sort();
    }
    onChange({ workdays: newDays });
  };

  // Generate multi-date picker dates for current month + offset
  const today = new Date(2026, 9, 16); // Local anchor date 2026-10-16
  const targetMonth = new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset, 1);
  const year = targetMonth.getFullYear();
  const month = targetMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const toggleDate = (dateStr: string) => {
    let newDates = [...config.specificDates];
    if (newDates.includes(dateStr)) {
      newDates = newDates.filter((d) => d !== dateStr);
    } else {
      newDates = [...newDates, dateStr].sort();
    }
    onChange({ specificDates: newDates });
  };

  const currentSummary = generateNaturalSummary(config);

  return (
    <div
      className="flex-1 flex flex-col justify-between px-6 pt-5 pb-6 transition-colors"
      style={{ backgroundColor: t.background, color: t.textPrimary }}
    >
      <div className="space-y-6">
        {/* 顶部标题区 */}
        <div>
          <div
            className="text-[12px] font-medium tracking-wide mb-1"
            style={{ color: t.textSecondary }}
          >
            第 1 步 · 安排提醒
          </div>
          <h1
            className="text-[26px] font-semibold tracking-tight leading-tight"
            style={{ color: t.textPrimary }}
          >
            你希望什么时候提醒？
          </h1>
          <p
            className="text-[14px] mt-1 leading-normal"
            style={{ color: t.textSecondary }}
          >
            建立规律的饮水提醒节奏，无需频繁打开应用。
          </p>
        </div>

        {/* 模式三选一 */}
        <div className="space-y-2.5">
          <label
            className="text-[13px] font-semibold block"
            style={{ color: t.textPrimary }}
          >
            提醒模式
          </label>

          <div className="space-y-2">
            {/* 模式 1：每天 */}
            <div
              onClick={() => onChange({ mode: 'everyday' })}
              className="p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-h-[52px]"
              style={{
                backgroundColor: config.mode === 'everyday' ? t.selectedSoft : t.surface,
                borderColor: config.mode === 'everyday' ? t.accent : t.separator,
              }}
            >
              <div>
                <div
                  className="text-[15px] font-semibold"
                  style={{ color: t.textPrimary }}
                >
                  每天
                </div>
                <div
                  className="text-[12px] mt-0.5"
                  style={{ color: t.textSecondary }}
                >
                  每日在设定的起止时段内温和提醒
                </div>
              </div>
              <div
                className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors"
                style={{
                  backgroundColor: config.mode === 'everyday' ? t.accent : 'transparent',
                  borderColor: config.mode === 'everyday' ? t.accent : t.separator,
                  color: t.onAccent,
                }}
              >
                {config.mode === 'everyday' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </div>
            </div>

            {/* 模式 2：工作安排 */}
            <div
              onClick={() => onChange({ mode: 'workday' })}
              className="p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-h-[52px]"
              style={{
                backgroundColor: config.mode === 'workday' ? t.selectedSoft : t.surface,
                borderColor: config.mode === 'workday' ? t.accent : t.separator,
              }}
            >
              <div>
                <div
                  className="text-[15px] font-semibold"
                  style={{ color: t.textPrimary }}
                >
                  工作安排
                </div>
                <div
                  className="text-[12px] mt-0.5"
                  style={{ color: t.textSecondary }}
                >
                  自选每周工作日与上下班时段，周末不打扰
                </div>
              </div>
              <div
                className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors"
                style={{
                  backgroundColor: config.mode === 'workday' ? t.accent : 'transparent',
                  borderColor: config.mode === 'workday' ? t.accent : t.separator,
                  color: t.onAccent,
                }}
              >
                {config.mode === 'workday' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </div>
            </div>

            {/* 模式 3：指定真实日期 */}
            <div
              onClick={() => onChange({ mode: 'specific_dates' })}
              className="p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-h-[52px]"
              style={{
                backgroundColor: config.mode === 'specific_dates' ? t.selectedSoft : t.surface,
                borderColor: config.mode === 'specific_dates' ? t.accent : t.separator,
              }}
            >
              <div>
                <div
                  className="text-[15px] font-semibold"
                  style={{ color: t.textPrimary }}
                >
                  指定日期
                </div>
                <div
                  className="text-[12px] mt-0.5"
                  style={{ color: t.textSecondary }}
                >
                  在月历中多选指定日期，仅在此期间提醒
                </div>
              </div>
              <div
                className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors"
                style={{
                  backgroundColor: config.mode === 'specific_dates' ? t.accent : 'transparent',
                  borderColor: config.mode === 'specific_dates' ? t.accent : t.separator,
                  color: t.onAccent,
                }}
              >
                {config.mode === 'specific_dates' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </div>
            </div>
          </div>
        </div>

        {/* 展开特定模式的日期选择 */}
        {config.mode === 'workday' && (
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: t.surface,
              borderColor: t.separator,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[13px] font-semibold"
                style={{ color: t.textPrimary }}
              >
                选择工作日
              </span>
              <span
                className="text-[11px] font-medium"
                style={{ color: t.textSecondary }}
              >
                已选 {config.workdays.length} 天
              </span>
            </div>

            {/* 7个星期按钮，满足 44px 点击区域 */}
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((w) => {
                const isSelected = config.workdays.includes(w.day);
                return (
                  <button
                    key={w.day}
                    type="button"
                    onClick={() => toggleWeekday(w.day)}
                    className="h-11 rounded-xl text-xs font-semibold transition-all flex items-center justify-center cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? t.accent : t.input,
                      color: isSelected ? t.onAccent : t.textSecondary,
                    }}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>

            {isWorkdayEmpty && (
              <p
                className="text-[11px] flex items-center gap-1 font-medium"
                style={{ color: t.warning }}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                请至少选择一个工作日
              </p>
            )}
          </div>
        )}

        {config.mode === 'specific_dates' && (
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: t.surface,
              borderColor: t.separator,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" style={{ color: t.accent }} />
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: t.textPrimary }}
                >
                  {year} 年 {month + 1} 月
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCalendarMonthOffset((prev) => prev - 1)}
                  className="px-2 py-1 text-xs rounded transition-colors cursor-pointer"
                  style={{ color: t.textSecondary }}
                >
                  上月
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonthOffset((prev) => prev + 1)}
                  className="px-2 py-1 text-xs rounded transition-colors cursor-pointer"
                  style={{ color: t.textSecondary }}
                >
                  下月
                </button>
              </div>
            </div>

            {/* 日历网格 */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['一', '二', '三', '四', '五', '六', '日'].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-medium py-1"
                  style={{ color: t.textSecondary }}
                >
                  {h}
                </span>
              ))}

              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = config.specificDates.includes(dateStr);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => toggleDate(dateStr)}
                    className="h-9 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-center cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? t.accent : 'transparent',
                      color: isSelected ? t.onAccent : t.textPrimary,
                    }}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            <div
              className="flex items-center justify-between pt-2 border-t text-[11px]"
              style={{ borderColor: t.separator, color: t.textSecondary }}
            >
              <span>已选中 {config.specificDates.length} 个日期</span>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    specificDates: [
                      `${year}-${String(month + 1).padStart(2, '0')}-16`,
                      `${year}-${String(month + 1).padStart(2, '0')}-17`,
                      `${year}-${String(month + 1).padStart(2, '0')}-18`,
                    ],
                  })
                }
                className="hover:underline font-medium cursor-pointer"
                style={{ color: t.accent }}
              >
                选近 3 天
              </button>
            </div>

            {isDatesEmpty && (
              <p
                className="text-[11px] flex items-center gap-1 font-medium"
                style={{ color: t.warning }}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                请在日历中至少点选一个有效日期
              </p>
            )}
          </div>
        )}

        {/* 时间时段与间隔分组 (映射规则 1: 容器 surface，内部输入框 input) */}
        <div className="space-y-3">
          <label className="text-[13px] font-semibold flex items-center justify-between">
            <span style={{ color: t.textPrimary }}>提醒时段与间隔</span>
            {/* 映射规则 8: 跨午夜属于说明信息，使用 text-secondary */}
            {isOvernight && (
              <span
                className="text-[11px] font-normal"
                style={{ color: t.textSecondary }}
              >
                次日结束 (跨午夜)
              </span>
            )}
          </label>

          <div
            className="p-4 rounded-2xl border space-y-4"
            style={{
              backgroundColor: t.surface,
              borderColor: t.separator,
            }}
          >
            {/* 开始 & 结束时间 (映射规则 5: 数值 text-primary，辅助标签 text-secondary) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="text-[11px] block mb-1 font-medium"
                  style={{ color: t.textSecondary }}
                >
                  开始时间
                </label>
                <div
                  className="flex items-center gap-1.5 h-11 px-3 rounded-xl border transition-colors"
                  style={{
                    backgroundColor: t.input,
                    borderColor: t.separator,
                  }}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: t.textSecondary }} />
                  <input
                    type="time"
                    value={config.startTime}
                    onChange={(e) => onChange({ startTime: e.target.value })}
                    className="w-full bg-transparent text-sm font-mono font-medium outline-hidden"
                    style={{ color: t.textPrimary }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="text-[11px] block mb-1 font-medium"
                  style={{ color: t.textSecondary }}
                >
                  结束时间
                </label>
                <div
                  className="flex items-center gap-1.5 h-11 px-3 rounded-xl border transition-colors"
                  style={{
                    backgroundColor: t.input,
                    borderColor: t.separator,
                  }}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: t.textSecondary }} />
                  <input
                    type="time"
                    value={config.endTime}
                    onChange={(e) => onChange({ endTime: e.target.value })}
                    className="w-full bg-transparent text-sm font-mono font-medium outline-hidden"
                    style={{ color: t.textPrimary }}
                  />
                </div>
              </div>
            </div>

            {/* 提醒间隔单选按钮组 (映射规则 3: 强选中 accent + on-accent；其他 input + text-secondary) */}
            <div>
              <label
                className="text-[11px] block mb-1.5 font-medium"
                style={{ color: t.textSecondary }}
              >
                提醒间隔
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {INTERVAL_OPTIONS.map((opt) => {
                  const isSelected = config.intervalMinutes === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChange({ intervalMinutes: opt.value })}
                      className="h-9 rounded-xl text-xs font-medium font-mono transition-all flex items-center justify-center cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? t.accent : t.input,
                        color: isSelected ? t.onAccent : t.textSecondary,
                      }}
                    >
                      {opt.value}分
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 午休时段开关 */}
            <div
              className="pt-3 border-t space-y-3"
              style={{ borderColor: t.separator }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4" style={{ color: t.accent }} />
                  <div>
                    <span
                      className="text-[14px] font-semibold block"
                      style={{ color: t.textPrimary }}
                    >
                      午休静音时段
                    </span>
                    <p
                      className="text-[11px]"
                      style={{ color: t.textSecondary }}
                    >
                      休息期间不发送饮水提醒
                    </p>
                  </div>
                </div>

                {/* 44px 触控开关 */}
                <button
                  type="button"
                  onClick={() => onChange({ hasLunchBreak: !config.hasLunchBreak })}
                  className="w-12 h-7 rounded-full transition-colors relative flex items-center px-0.5 min-w-[44px] cursor-pointer"
                  style={{
                    backgroundColor: config.hasLunchBreak ? t.accent : t.input,
                    border: `1px solid ${t.separator}`,
                  }}
                  aria-label="午休时段开关"
                >
                  <span
                    className={`w-5 h-5 rounded-full shadow-sm transition-transform ${
                      config.hasLunchBreak ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                    style={{
                      backgroundColor: config.hasLunchBreak ? t.onAccent : t.surface,
                    }}
                  />
                </button>
              </div>

              {config.hasLunchBreak && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span
                      className="text-[11px] block mb-1 font-medium"
                      style={{ color: t.textSecondary }}
                    >
                      午休开始
                    </span>
                    <input
                      type="time"
                      value={config.lunchStart}
                      onChange={(e) => onChange({ lunchStart: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border text-xs font-mono font-medium outline-hidden"
                      style={{
                        backgroundColor: t.input,
                        borderColor: t.separator,
                        color: t.textPrimary,
                      }}
                    />
                  </div>

                  <div>
                    <span
                      className="text-[11px] block mb-1 font-medium"
                      style={{ color: t.textSecondary }}
                    >
                      午休结束
                    </span>
                    <input
                      type="time"
                      value={config.lunchEnd}
                      onChange={(e) => onChange({ lunchEnd: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border text-xs font-mono font-medium outline-hidden"
                      style={{
                        backgroundColor: t.input,
                        borderColor: t.separator,
                        color: t.textPrimary,
                      }}
                    />
                  </div>
                </div>
              )}

              {isLunchInvalid && (
                <p
                  className="text-[11px] flex items-center gap-1 font-medium"
                  style={{ color: t.error }}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  午休开始时间不能晚于或等于结束时间
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 底部摘要与主操作区 (映射规则 6: 日程摘要使用 selected-soft 或置于背景，清楚深色文字) */}
      <div
        className="mt-8 pt-4 border-t space-y-3"
        style={{ borderColor: t.separator }}
      >
        {/* 自然语言日程摘要 */}
        <div
          className="p-3.5 rounded-xl text-[12px] leading-relaxed border"
          style={{
            backgroundColor: t.selectedSoft,
            borderColor: t.separator,
            color: t.textPrimary,
          }}
        >
          <span
            className="font-semibold mr-1.5"
            style={{ color: t.accent }}
          >
            日程摘要：
          </span>
          <span style={{ color: t.textPrimary }}>
            {currentSummary}
          </span>
        </div>

        {/* 下一步主按钮 (48px 满足 Apple HIG 关键动作规范) */}
        <button
          type="button"
          disabled={hasValidationError}
          onClick={onNext}
          className="w-full h-12 rounded-2xl font-medium text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
          style={{
            backgroundColor: hasValidationError ? t.input : t.accent,
            color: hasValidationError ? t.textSecondary : t.onAccent,
            cursor: hasValidationError ? 'not-allowed' : 'pointer',
          }}
        >
          <span>下一步：选择声音</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
