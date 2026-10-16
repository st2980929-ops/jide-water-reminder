import React, { useState } from 'react';
import { ReminderConfig, HomeDisplayState } from '../../types/reminder';
import { calculateSchedule, nextReminderLabel } from '../../utils/scheduleCalculator';
import { CupWaterlineSVG } from '../logo/LogoSketches';
import { getThemeTokens } from '../../utils/theme';
import {
  Clock,
  Settings,
  Volume2,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface HomeScreenProps {
  config: ReminderConfig;
  onEditSchedule: () => void;
  onEditSound: () => void;
  onTogglePauseToday: () => void;
  onTriggerNotification: () => void;
  onDrinkGlass: () => void;
  onResetGlasses?: () => void;
  onFixUnauthorized?: () => void;
  forcedState?: HomeDisplayState | null;
  isDarkMode?: boolean;
  nextReminderAt?: number | null;
  pendingCount?: number;
  planHealthy?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  config,
  onEditSchedule,
  onEditSound,
  onTogglePauseToday,
  onTriggerNotification,
  onDrinkGlass,
  onResetGlasses,
  onFixUnauthorized,
  forcedState,
  nextReminderAt,
  pendingCount,
  planHealthy,
  isDarkMode = false,
}) => {
  const t = getThemeTokens(isDarkMode);
  const [isWobbling, setIsWobbling] = useState(false);

  // Calculate real schedule state
  const calculation = calculateSchedule(config, undefined, forcedState);

  if (config.notificationPermission==='granted'&&!config.isPausedToday&&nextReminderAt) calculation.nextReminderText=nextReminderLabel(new Date(nextReminderAt));
  if (config.notificationPermission==='granted'&&!config.isPausedToday&&(pendingCount===0||planHealthy===false)&&calculation.state!=='all_dates_passed') {
    calculation.state='invalid_schedule'; calculation.statusHeadline='系统提醒需要重新保存'; calculation.nextReminderText='请重新保存提醒安排'; calculation.stateBadgeLabel='需要保存';
  }

  // Water level derived directly from remaining glasses
  const waterLevel = Math.round((config.remainingGlasses / config.totalDailyGlasses) * 100);

  const handleCupTap = () => {
    setIsWobbling(true);
    onDrinkGlass();
    setTimeout(() => setIsWobbling(false), 800);
  };

  const getStatusBadge = () => {
    switch (calculation.state) {
      case 'active':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" style={{ color: t.accent }} />,
          bg: t.selectedSoft,
          color: t.accent,
        };
      case 'lunch_break':
        return {
          icon: <Clock className="w-3.5 h-3.5" style={{ color: t.textSecondary }} />,
          bg: t.input,
          color: t.textSecondary,
        };
      case 'unauthorized':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5" style={{ color: t.error }} />,
          bg: t.surface,
          color: t.error,
          borderColor: t.error,
        };
      case 'invalid_schedule':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5" style={{ color: t.warning }} />,
          bg: t.surface,
          color: t.warning,
          borderColor: t.warning,
        };
      default:
        return {
          icon: <Calendar className="w-3.5 h-3.5" style={{ color: t.textSecondary }} />,
          bg: t.input,
          color: t.textSecondary,
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      className="flex-1 flex flex-col justify-between px-6 pt-5 pb-6 transition-colors"
      style={{ backgroundColor: t.background, color: t.textPrimary }}
    >
      <div className="space-y-6">
        {/* 顶部轻量 App 标题与品牌锚点 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg border flex items-center justify-center transition-colors"
              style={{
                backgroundColor: t.surface,
                borderColor: t.separator,
              }}
            >
              <CupWaterlineSVG
                size={18}
                color={t.accent}
                waterColor={t.accent}
                waterLevel={waterLevel}
                isAnimating={isWobbling}
                isDarkMode={isDarkMode}
              />
            </div>
            <span
              className="text-[15px] font-semibold tracking-tight"
              style={{ color: t.textPrimary }}
            >
              喝水提醒
            </span>
          </div>

          {/* 状态徽标 (纯净文字标识，无大块涂抹) */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
            style={{
              backgroundColor: statusBadge.bg,
              color: statusBadge.color,
              borderColor: statusBadge.borderColor ?? t.separator,
            }}
          >
            {statusBadge.icon}
            <span>{calculation.stateBadgeLabel}</span>
          </div>
        </div>

        {/* 核心状态卡片：安静大字标题 + 水位沉降水杯 + 下次提醒 */}
        <div
          role="button"
          tabIndex={0}
          aria-label="记录喝了一杯水"
          onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();handleCupTap();}}}
          onClick={handleCupTap}
          className="p-6 rounded-3xl border transition-all text-center relative overflow-hidden group cursor-pointer shadow-xs hover:shadow-md"
          style={{
            backgroundColor: t.surface,
            borderColor: t.separator,
          }}
          title="轻触记录喝掉一杯水，水线将自动下降"
        >
          {/* 水杯微动效视觉母题：随着喝水杯数减少，水位动态沉降 */}
          <div
            className="w-24 h-24 mx-auto mb-3.5 rounded-2xl flex items-center justify-center border relative transition-colors"
            style={{
              backgroundColor: t.input,
              borderColor: t.separator,
            }}
          >
            <CupWaterlineSVG
              size={62}
              color={t.textPrimary}
              waterColor={t.accent}
              waterLevel={waterLevel}
              isAnimating={isWobbling}
              isDarkMode={isDarkMode}
              className="transition-transform duration-300 group-hover:scale-105"
            />
            {/* 轻触提示气泡 */}
            <span
              className="absolute -bottom-2 px-2 py-0.5 rounded-full text-[10px] font-mono border shadow-xs"
              style={{
                backgroundColor: t.surface,
                borderColor: t.separator,
                color: t.textSecondary,
              }}
            >
              余 {config.remainingGlasses} 杯
            </span>
          </div>

          {/* 1. 当前状态标语 */}
          <h1
            className="text-[23px] font-semibold tracking-tight leading-snug"
            style={{ color: t.textPrimary }}
          >
            {calculation.statusHeadline}
          </h1>

          {/* 2. 下一次提醒等宽大字 (映射规则 5: 时间数值用 text-primary) */}
          <div
            className="text-[16px] font-mono font-medium mt-1.5"
            style={{ color: t.textPrimary }}
          >
            {calculation.nextReminderText}
          </div>

          {/* 3. 当前日程摘要 (映射规则 5: 辅助标签与摘要用 text-secondary) */}
          <div
            className="mt-4 pt-3 border-t text-[12px] leading-relaxed max-w-xs mx-auto"
            style={{
              borderColor: t.separator,
              color: t.textSecondary,
            }}
          >
            {calculation.summaryText}
          </div>

          {/* 快捷点击喝水操作提示 */}
          <div
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium transition-opacity"
            style={{ color: t.accent }}
          >
            <span>轻触水杯 · 记录喝水并降低水位</span>
          </div>
        </div>

        {/* 异常状态特殊处理入口 */}
        {calculation.state === 'unauthorized' && (
          <div
            className="p-4 rounded-2xl border space-y-2 text-left"
            style={{
              backgroundColor: t.surface,
              borderColor: t.error,
              color: t.textPrimary,
            }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: t.error }}>
              <ShieldAlert className="w-4 h-4" />
              <span>通知权限已关闭</span>
            </div>
            <p className="text-[11px] leading-normal" style={{ color: t.textSecondary }}>
              请允许通知，并在系统设置中开启声音。实际送达方式受静音、专注模式和通知摘要设置影响。
            </p>
            <button
              type="button"
              onClick={onFixUnauthorized}
              className="text-xs font-medium underline pt-1 block cursor-pointer"
              style={{ color: t.accent }}
            >
              在设置中重新开启通知权限 →
            </button>
          </div>
        )}

        {calculation.state === 'invalid_schedule' && (
          <div
            className="p-4 rounded-2xl border space-y-2 text-left"
            style={{
              backgroundColor: t.surface,
              borderColor: t.warning,
              color: t.textPrimary,
            }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: t.warning }}>
              <AlertTriangle className="w-4 h-4" />
              <span>时间设置冲突</span>
            </div>
            <p className="text-[11px] leading-normal" style={{ color: t.textSecondary }}>
              请检查日期、起止时间和休息时段，然后重新保存安排。
            </p>
            <button
              type="button"
              onClick={onEditSchedule}
              className="text-xs font-medium underline pt-1 block cursor-pointer"
              style={{ color: t.accent }}
            >
              立即修改时间安排 →
            </button>
          </div>
        )}

        {/* 4. 管理操作入口列表 (iOS 紧凑列表节奏，保证每行 >= 52px 触控标准) */}
        <div
          className="rounded-2xl border overflow-hidden divide-y shadow-xs"
          style={{
            backgroundColor: t.surface,
            borderColor: t.separator,
          }}
        >
          {/* 修改安排 */}
          <button
            type="button"
            onClick={onEditSchedule}
            className="w-full h-[52px] px-4 flex items-center justify-between text-left transition-colors cursor-pointer"
            style={{ borderColor: t.separator }}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4" style={{ color: t.textSecondary }} />
              <span className="text-[14px] font-medium" style={{ color: t.textPrimary }}>
                修改提醒安排
              </span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: t.textSecondary }}>
              <span className="text-xs font-mono">
                {config.mode === 'workday' ? '工作安排' : config.mode === 'everyday' ? '每天' : '指定日期'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* 提示音 */}
          <button
            type="button"
            onClick={onEditSound}
            className="w-full h-[52px] px-4 flex items-center justify-between text-left transition-colors cursor-pointer"
            style={{ borderColor: t.separator }}
          >
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4" style={{ color: t.textSecondary }} />
              <span className="text-[14px] font-medium" style={{ color: t.textPrimary }}>
                提示音与音效
              </span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: t.textSecondary }}>
              <span className="text-xs">
                {config.sound === 'celesta' || config.sound === 'drop'
                  ? '清泉水琴'
                  : config.sound === 'bamboo' || config.sound === 'wood'
                  ? '空灵竹韵'
                  : config.sound === 'raindrop'
                  ? '晨雨露滴'
                  : config.sound === 'singingbowl'
                  ? '静谧铜磬'
                  : config.sound === 'morning'
                  ? '晨光微弦'
                  : '短风铃'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* 今天暂停 / 恢复提醒 */}
          <button
            type="button"
            onClick={onTogglePauseToday}
            className="w-full h-[52px] px-4 flex items-center justify-between text-left transition-colors cursor-pointer"
            style={{ borderColor: t.separator }}
          >
            <div className="flex items-center gap-3">
              {config.isPausedToday ? (
                <PlayCircle className="w-4 h-4" style={{ color: t.accent }} />
              ) : (
                <PauseCircle className="w-4 h-4" style={{ color: t.textSecondary }} />
              )}
              <span className="text-[14px] font-medium" style={{ color: t.textPrimary }}>
                {config.isPausedToday ? '恢复提醒' : '暂停提醒'}
              </span>
            </div>
            <span className="text-xs" style={{ color: t.textSecondary }}>
              {config.isPausedToday ? '点击恢复' : '手动恢复'}
            </span>
          </button>
        </div>
      </div>

      {/* 底部免打扰承诺与测试触发 */}
      <div
        className="mt-8 pt-4 border-t flex items-center justify-between text-[11px]"
        style={{
          borderColor: t.separator,
          color: t.textSecondary,
        }}
      >
        <span>按日程提醒 · 无打卡负担</span>
        <button
          type="button"
          onClick={onTriggerNotification}
          className="font-medium hover:underline cursor-pointer"
          style={{ color: t.accent }}
        >
          10 秒后测试通知
        </button>
      </div>
    </div>
  );
};
