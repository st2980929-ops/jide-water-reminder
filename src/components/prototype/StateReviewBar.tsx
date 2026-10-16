import React from 'react';
import { HomeDisplayState, ReminderConfig } from '../../types/reminder';
import { RotateCcw, Bell, Moon, Sun, Sliders } from 'lucide-react';
import { getThemeTokens } from '../../utils/theme';

interface StateReviewBarProps {
  currentForcedState: HomeDisplayState | null;
  onSelectForcedState: (state: HomeDisplayState | null) => void;
  config: ReminderConfig;
  onUpdateConfig: (partial: Partial<ReminderConfig>) => void;
  onTriggerNotification: () => void;
  onRestartOnboarding: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  activeScreen: 'step1' | 'step2' | 'home';
  onNavigateScreen: (screen: 'step1' | 'step2' | 'home') => void;
  onDrinkGlass: () => void;
  onResetGlasses: () => void;
}

const STATE_OPTIONS: { id: HomeDisplayState | null; label: string; desc: string }[] = [
  { id: null, label: '实时真实计算', desc: '根据当前时钟和设定自动推导' },
  { id: 'active', label: '1. 正常提醒中', desc: '工作时段内正常运行' },
  { id: 'lunch_break', label: '2. 正在午休', desc: '12:00–13:30 休息静音' },
  { id: 'day_ended', label: '3. 今日已结束', desc: '18:00 后显示次日安排' },
  { id: 'paused', label: '4. 今日已暂停', desc: '用户手动暂停' },
  { id: 'not_today', label: '5. 非提醒日', desc: '周末或无安排的星期' },
  { id: 'all_dates_passed', label: '6. 所选日期已过', desc: '指定日期的所有天数已失效' },
  { id: 'unauthorized', label: '7. 通知未授权', desc: '系统权限被关闭' },
  { id: 'invalid_schedule', label: '8. 设置冲突', desc: '开始晚于结束或午休异常' },
];

export const StateReviewBar: React.FC<StateReviewBarProps> = ({
  currentForcedState,
  onSelectForcedState,
  config,
  onUpdateConfig,
  onTriggerNotification,
  onRestartOnboarding,
  onDrinkGlass,
  onResetGlasses,
  isDarkMode,
  onToggleDarkMode,
  activeScreen,
  onNavigateScreen,
}) => {
  const t = getThemeTokens(isDarkMode);

  return (
    <div
      className="border rounded-2xl p-5 shadow-xs space-y-4 transition-colors"
      style={{
        backgroundColor: t.surface,
        borderColor: t.separator,
        color: t.textPrimary,
      }}
    >
      {/* 栏目标题 */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b"
        style={{ borderColor: t.separator }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4" style={{ color: t.accent }} />
            <h3 className="text-sm font-semibold" style={{ color: t.textPrimary }}>
              设计评审与状态模拟工具箱
            </h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-mono border"
              style={{
                backgroundColor: t.selectedSoft,
                borderColor: t.separator,
                color: t.accent,
              }}
            >
              瓷白 × 深湖青
            </span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: t.textSecondary }}>
            独立于正式 UI 的评审控制台，方便逐一核对 8 种主页状态、流程步骤与深浅色模式。
          </p>
        </div>

        {/* 全局辅助控制 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 屏幕跳转 */}
          <div
            className="flex items-center p-1 rounded-xl border text-xs"
            style={{
              backgroundColor: t.input,
              borderColor: t.separator,
            }}
          >
            <button
              onClick={() => onNavigateScreen('step1')}
              className="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: activeScreen === 'step1' ? t.surface : 'transparent',
                color: activeScreen === 'step1' ? t.accent : t.textSecondary,
                boxShadow: activeScreen === 'step1' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              第1步设置
            </button>
            <button
              onClick={() => onNavigateScreen('step2')}
              className="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: activeScreen === 'step2' ? t.surface : 'transparent',
                color: activeScreen === 'step2' ? t.accent : t.textSecondary,
                boxShadow: activeScreen === 'step2' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              第2步声音
            </button>
            <button
              onClick={() => onNavigateScreen('home')}
              className="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: activeScreen === 'home' ? t.surface : 'transparent',
                color: activeScreen === 'home' ? t.accent : t.textSecondary,
                boxShadow: activeScreen === 'home' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              主页
            </button>
          </div>

          {/* 深浅色模式 */}
          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: t.input,
              borderColor: t.separator,
              color: t.textPrimary,
            }}
          >
            {isDarkMode ? (
              <Sun className="w-3.5 h-3.5" style={{ color: t.accent }} />
            ) : (
              <Moon className="w-3.5 h-3.5" style={{ color: t.accent }} />
            )}
            <span>{isDarkMode ? '深色模式 (生效中)' : '浅色模式 (生效中)'}</span>
          </button>

          {/* 模拟发通知 */}
          <button
            onClick={onTriggerNotification}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-95"
            style={{
              backgroundColor: t.accent,
              color: t.onAccent,
            }}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>发测试通知</span>
          </button>
        </div>
      </div>

      {/* 状态快捷切换 */}
      <div>
        <div
          className="text-[11px] font-semibold tracking-wider mb-2"
          style={{ color: t.textSecondary }}
        >
          主页 8 种核心状态快速检视
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {STATE_OPTIONS.map((opt) => {
            const isSelected = currentForcedState === opt.id;
            return (
              <button
                key={String(opt.id)}
                onClick={() => {
                  onSelectForcedState(opt.id);
                  if (activeScreen !== 'home') onNavigateScreen('home');
                }}
                className="p-2.5 rounded-xl text-left border transition-all cursor-pointer"
                style={{
                  backgroundColor: isSelected ? t.selectedSoft : t.input,
                  borderColor: isSelected ? t.accent : t.separator,
                  color: t.textPrimary,
                  boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <div
                  className="text-xs font-semibold leading-tight"
                  style={{ color: isSelected ? t.accent : t.textPrimary }}
                >
                  {opt.label}
                </div>
                <div
                  className="text-[10px] mt-0.5 line-clamp-1"
                  style={{ color: t.textSecondary }}
                >
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 水位与喝水互动模拟 */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs"
        style={{ borderColor: t.separator }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium" style={{ color: t.textPrimary }}>
            水杯水位互动模拟：
          </span>
          <span className="font-mono font-semibold" style={{ color: t.accent }}>
            剩余 {config.remainingGlasses} / {config.totalDailyGlasses} 杯 ({Math.round((config.remainingGlasses / config.totalDailyGlasses) * 100)}%)
          </span>
          <button
            type="button"
            onClick={onDrinkGlass}
            className="px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: t.selectedSoft,
              borderColor: t.separator,
              color: t.accent,
            }}
          >
            喝掉 1 杯 (水位下降)
          </button>
          <button
            type="button"
            onClick={onResetGlasses}
            className="px-2.5 py-1 rounded-lg border transition-colors cursor-pointer"
            style={{
              backgroundColor: t.input,
              borderColor: t.separator,
              color: t.textSecondary,
            }}
          >
            重置满杯 (8杯)
          </button>
        </div>
      </div>

      {/* 通知权限模拟开关 & 重置 */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs"
        style={{ borderColor: t.separator, color: t.textSecondary }}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: t.textPrimary }}>
            模拟 iOS 通知权限：
          </span>
          <button
            onClick={() =>
              onUpdateConfig({
                notificationPermission: config.notificationPermission === 'granted' ? 'denied' : 'granted',
              })
            }
            className="px-2.5 py-1 rounded-lg border font-mono font-medium cursor-pointer"
            style={{
              backgroundColor: config.notificationPermission === 'granted' ? t.selectedSoft : t.surface,
              borderColor: config.notificationPermission === 'granted' ? t.accent : t.error,
              color: config.notificationPermission === 'granted' ? t.accent : t.error,
            }}
          >
            {config.notificationPermission === 'granted' ? '已授权 (Granted)' : '已拒绝 (Denied)'}
          </button>
        </div>

        <button
          onClick={onRestartOnboarding}
          className="flex items-center gap-1 hover:underline cursor-pointer font-medium"
          style={{ color: t.accent }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重新从第 1 步走设置流程</span>
        </button>
      </div>
    </div>
  );
};
