import React, { useState, useEffect } from 'react';
import { CupWaterlineSVG } from '../logo/LogoSketches';
import { X, Clock, Check, ChevronDown, CheckCircle2 } from 'lucide-react';
import { playReminderSound } from '../../utils/audio';
import { SoundType, LoudnessLevel } from '../../types/reminder';
import { getThemeTokens } from '../../utils/theme';

interface NotificationBannerProps {
  isOpen: boolean;
  onClose: () => void;
  onPostpone10m: () => void; // 「现在还不渴」
  onConfirmDrink: () => void; // 「收到 马上去喝」
  sound: SoundType;
  loudness: LoudnessLevel;
  simulatedTime?: string;
  isDarkMode?: boolean;
  waterLevel?: number;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  isOpen,
  onClose,
  onPostpone10m,
  onConfirmDrink,
  sound,
  loudness,
  simulatedTime = '现在',
  isDarkMode = false,
  waterLevel = 65,
}) => {
  const t = getThemeTokens(isDarkMode);
  const [isExpanded, setIsExpanded] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isDrinkingAnimation, setIsDrinkingAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      playReminderSound(sound, loudness);
      setFeedbackMessage(null);
      setIsDrinkingAnimation(false);
    }
  }, [isOpen, sound, loudness]);

  if (!isOpen) return null;

  const handleDrinkClick = () => {
    setIsDrinkingAnimation(true);
    setFeedbackMessage('已记录喝水，水杯水位已更新');
    onConfirmDrink();

    setTimeout(() => {
      onClose();
      setIsDrinkingAnimation(false);
      setFeedbackMessage(null);
    }, 1200);
  };

  const handlePostponeClick = () => {
    setFeedbackMessage('好的，10 分钟后再次提醒你');
    onPostpone10m();

    setTimeout(() => {
      onClose();
      setFeedbackMessage(null);
    }, 1100);
  };

  return (
    <div className="absolute top-12 left-3 right-3 z-50 animate-in slide-in-from-top-4 duration-300">
      {/* iOS 玻璃质感系统通知横幅 */}
      <div
        className="w-full rounded-[24px] p-4 backdrop-blur-xl shadow-2xl border transition-all"
        style={{
          backgroundColor: isDarkMode ? 'rgba(29, 42, 38, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          borderColor: t.separator,
          color: t.textPrimary,
        }}
      >
        {/* 通知顶部栏 */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: t.input,
                borderColor: t.separator,
              }}
            >
              <CupWaterlineSVG
                size={16}
                color={t.accent}
                waterColor={t.accent}
                waterLevel={waterLevel}
                isAnimating={isDrinkingAnimation}
                isDarkMode={isDarkMode}
              />
            </div>
            <span
              className="text-[12px] font-semibold tracking-tight uppercase"
              style={{ color: t.accent }}
            >
              喝水提醒
            </span>
          </div>
          <div
            className="flex items-center gap-2 text-[11px] font-mono"
            style={{ color: t.textSecondary }}
          >
            <span>{simulatedTime}</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:opacity-100 rounded-full cursor-pointer"
              aria-label="关闭横幅"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 核心正文 */}
        <div className="py-1">
          <p className="text-[15px] font-semibold leading-snug" style={{ color: t.textPrimary }}>
            喝口水，歇一下。
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: t.textSecondary }}>
            连续专注了一段时间，起身喝杯温水、放松片刻吧。
          </p>
        </div>

        {/* 即时操作反馈提示 */}
        {feedbackMessage ? (
          <div
            className="mt-3 p-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 animate-in fade-in border"
            style={{
              backgroundColor: t.selectedSoft,
              borderColor: t.separator,
              color: t.accent,
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMessage}</span>
          </div>
        ) : (
          /* 展开快捷操作区 */
          <div
            className="mt-2.5 pt-2.5 border-t"
            style={{ borderColor: t.separator }}
          >
            {!isExpanded ? (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="w-full flex items-center justify-center gap-1 text-[11px] py-1 cursor-pointer"
                style={{ color: t.textSecondary }}
              >
                <span>展开快捷操作</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-200">
                {/* 选项 1：现在还不渴 */}
                <button
                  type="button"
                  onClick={handlePostponeClick}
                  className="h-11 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border"
                  style={{
                    backgroundColor: t.input,
                    borderColor: t.separator,
                    color: t.textSecondary,
                  }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>现在还不渴</span>
                </button>

                {/* 选项 2：收到 马上去喝 */}
                <button
                  type="button"
                  onClick={handleDrinkClick}
                  className="h-11 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                  style={{
                    backgroundColor: t.accent,
                    color: t.onAccent,
                  }}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>收到 马上去喝</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
