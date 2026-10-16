import React, { useState } from 'react';
import { ReminderConfig, SoundType } from '../../types/reminder';
import { playReminderSound, stopCurrentSound } from '../../utils/audio';
import { Volume2, Bell, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { CupWaterlineSVG } from '../logo/LogoSketches';
import { getThemeTokens } from '../../utils/theme';

interface Step2SoundProps {
  config: ReminderConfig;
  onChange: (updated: Partial<ReminderConfig>) => void;
  onBack: () => void;
  onComplete: () => void;
  onTriggerTestNotification: () => void;
  isDarkMode?: boolean;
}

const SOUNDS: { id: SoundType; name: string; subtitle: string; desc: string }[] = [
  { id: 'celesta', name: '清泉水琴', subtitle: 'Spring Celesta', desc: '纯净空灵的水晶琴鸣，柔和清润唤醒注意力' },
  { id: 'bamboo', name: '空灵竹韵', subtitle: 'Bamboo Resonance', desc: '自然温润的竹管落水共鸣，悠远沉静不惊扰' },
  { id: 'chime', name: '短风铃', subtitle: 'Gentle Chime', desc: '晶莹清透的高频双音微风铃，轻盈悦耳' },
  { id: 'raindrop', name: '晨雨露滴', subtitle: 'Raindrop Ripple', desc: '清晨雨滴滴落荷叶的温润微波，极度柔和放松' },
  { id: 'singingbowl', name: '静谧铜磬', subtitle: 'Singing Bowl', desc: '432Hz 颂钵沉浸共鸣，舒缓治愈，深沉悠远' },
  { id: 'morning', name: '晨光微弦', subtitle: 'Morning Chord', desc: '清晨尼龙琴弦双音和弦，温暖惬意' },
];

export const Step2Sound: React.FC<Step2SoundProps> = ({
  config,
  onChange,
  onBack,
  onComplete,
  onTriggerTestNotification,
  isDarkMode = false,
}) => {
  const t = getThemeTokens(isDarkMode);
  const [playingId, setPlayingId] = useState<SoundType | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const handlePlay = (id: SoundType) => {
    stopCurrentSound();
    setPlayingId(id);
    playReminderSound(id, 'soft');
    setTimeout(() => {
      setPlayingId((curr) => (curr === id ? null : curr));
    }, 950);
  };

  const handleSelectSound = (id: SoundType) => {
    onChange({ sound: id, loudness: 'soft' });
    handlePlay(id);
  };

  const handleEnableReminders = () => {
    if (config.notificationPermission === 'granted') {
      triggerCompletionAnimation();
    } else {
      setShowPermissionPrompt(true);
    }
  };

  const handleGrantPermission = () => {
    onChange({ notificationPermission: 'granted' });
    setShowPermissionPrompt(false);
    triggerCompletionAnimation();
  };

  const handleDenyPermission = () => {
    onChange({ notificationPermission: 'denied' });
    setShowPermissionPrompt(false);
  };

  const triggerCompletionAnimation = () => {
    setIsFinishing(true);
    setTimeout(() => {
      onChange({ hasCompletedSetup: true });
      onComplete();
    }, 1200);
  };

  return (
    <div
      className="flex-1 flex flex-col justify-between px-6 pt-5 pb-6 transition-colors"
      style={{ backgroundColor: t.background, color: t.textPrimary }}
    >
      <div className="space-y-4">
        {/* 返回上一页按钮 */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs transition-colors group cursor-pointer focus:outline-none"
          style={{ color: t.textSecondary }}
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>返回安排提醒</span>
        </button>

        {/* 标题 */}
        <div>
          <div
            className="text-[12px] font-medium tracking-wide mb-1"
            style={{ color: t.textSecondary }}
          >
            第 2 步 · 声音与通知
          </div>
          <h1
            className="text-[24px] font-semibold tracking-tight leading-tight"
            style={{ color: t.textPrimary }}
          >
            选择提示音
          </h1>
          <p
            className="text-[13px] mt-1 leading-normal"
            style={{ color: t.textSecondary }}
          >
            精选多款温和、不刺耳的轻柔音色，安静陪伴专注时光。
          </p>
        </div>

        {/* 提示音选项列表 */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5">
          {SOUNDS.map((s) => {
            const isSelected = config.sound === s.id;
            const isPlaying = playingId === s.id;

            return (
              <div
                key={s.id}
                onClick={() => handleSelectSound(s.id)}
                className="p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-h-[54px]"
                style={{
                  backgroundColor: isSelected ? t.selectedSoft : t.surface,
                  borderColor: isSelected ? t.accent : t.separator,
                }}
              >
                <div className="flex-1 pr-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[14px] font-semibold"
                      style={{ color: t.textPrimary }}
                    >
                      {s.name}
                    </span>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: t.textSecondary }}
                    >
                      {s.subtitle}
                    </span>
                    {isSelected && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.2 rounded"
                        style={{
                          backgroundColor: t.accent,
                          color: t.onAccent,
                        }}
                      >
                        已选
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[11px] mt-0.5 leading-snug line-clamp-1"
                    style={{ color: t.textSecondary }}
                  >
                    {s.desc}
                  </p>
                </div>

                {/* 独立试听按钮 (满足 44px 触控目标) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlay(s.id);
                  }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isPlaying ? t.accent : t.input,
                    color: isPlaying ? t.onAccent : t.textSecondary,
                  }}
                  aria-label={`试听 ${s.name}`}
                  title="试听音效"
                >
                  <Volume2 className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            );
          })}
        </div>

        {/* 平台免责说明注脚 */}
        <p
          className="text-[11px] leading-relaxed px-1"
          style={{ color: t.textSecondary }}
        >
          默认轻柔播放；实际响度受 iPhone 侧边音量键、物理静音开关与系统专注模式影响。
        </p>

        {/* 通知授权状态提示 (未授权警告) */}
        {config.notificationPermission === 'denied' && (
          <div
            className="p-3.5 rounded-xl border text-xs flex items-start gap-2.5"
            style={{
              backgroundColor: t.surface,
              borderColor: t.error,
              color: t.textPrimary,
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: t.error }} />
            <div className="space-y-1">
              <span className="font-semibold block" style={{ color: t.error }}>
                提醒权限未开启
              </span>
              <p className="text-[11px]" style={{ color: t.textSecondary }}>
                如果未允许通知，App 无法在后台到点震动或发声。请在系统「设置」中允许通知。
              </p>
              <button
                type="button"
                onClick={() => onChange({ notificationPermission: 'granted' })}
                className="text-[11px] font-semibold underline mt-1 cursor-pointer block"
                style={{ color: t.accent }}
              >
                在样机中模拟开启权限
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 底部完成操作 */}
      <div
        className="mt-4 pt-4 border-t space-y-3"
        style={{ borderColor: t.separator }}
      >
        {config.notificationPermission === 'granted' && (
          <div
            className="flex items-center justify-between text-[11px] px-1"
            style={{ color: t.textSecondary }}
          >
            <span className="flex items-center gap-1 font-medium" style={{ color: t.accent }}>
              <Check className="w-3.5 h-3.5" />
              已获得系统通知权限
            </span>
            <button
              type="button"
              onClick={onTriggerTestNotification}
              className="hover:underline font-medium cursor-pointer"
              style={{ color: t.accent }}
            >
              发送测试提醒
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleEnableReminders}
          className="w-full h-12 rounded-2xl font-medium text-[15px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          style={{
            backgroundColor: t.accent,
            color: t.onAccent,
          }}
        >
          {isFinishing ? (
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: t.onAccent, borderTopColor: 'transparent' }}
              />
              <span>正在保存安排...</span>
            </div>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              <span>启用提醒</span>
            </>
          )}
        </button>
      </div>

      {/* 模拟 iOS 系统通知授权弹窗 */}
      {showPermissionPrompt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6">
          <div
            className="w-full max-w-[280px] rounded-2xl p-5 shadow-2xl text-center border space-y-4 animate-in fade-in zoom-in-95"
            style={{
              backgroundColor: t.surface,
              borderColor: t.separator,
              color: t.textPrimary,
            }}
          >
            <div
              className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center border"
              style={{
                backgroundColor: t.input,
                borderColor: t.separator,
              }}
            >
              <CupWaterlineSVG
                size={28}
                color={t.accent}
                waterColor={t.accent}
                isDarkMode={isDarkMode}
              />
            </div>

            <div>
              <h3 className="text-[15px] font-semibold" style={{ color: t.textPrimary }}>
                “喝水提醒”想向你发送通知
              </h3>
              <p className="text-[12px] mt-1.5 leading-normal" style={{ color: t.textSecondary }}>
                通知包括声音提示、横幅与锁定屏幕提醒，仅在预设时段内发送喝水间歇提示。
              </p>
            </div>

            <div
              className="grid grid-cols-2 gap-2 pt-2 border-t"
              style={{ borderColor: t.separator }}
            >
              <button
                type="button"
                onClick={handleDenyPermission}
                className="h-10 rounded-xl text-xs font-medium cursor-pointer"
                style={{
                  backgroundColor: t.input,
                  color: t.textSecondary,
                }}
              >
                不允许
              </button>
              <button
                type="button"
                onClick={handleGrantPermission}
                className="h-10 rounded-xl text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: t.accent,
                  color: t.onAccent,
                }}
              >
                允许
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
