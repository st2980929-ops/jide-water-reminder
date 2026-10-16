import React from 'react';
import { Wifi } from 'lucide-react';
import { getThemeTokens } from '../../utils/theme';

interface IPhoneFrameProps {
  children: React.ReactNode;
  isDarkMode?: boolean;
  simulatedTime?: string;
  onDynamicIslandClick?: () => void;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({
  children,
  isDarkMode = false,
  simulatedTime = '09:41',
  onDynamicIslandClick,
}) => {
  const t = getThemeTokens(isDarkMode);

  return (
    <div className="relative mx-auto flex items-center justify-center p-2 sm:p-4 select-none">
      {/* 外部 iPhone 钛金属/雾面边框 */}
      <div
        className={`relative w-full max-w-[393px] h-[830px] rounded-[52px] p-[10px] shadow-2xl transition-all duration-300 flex flex-col ${
          isDarkMode
            ? 'bg-[#182320] border-[3.5px] border-[#2A3B34] shadow-black/70 ring-1 ring-white/5'
            : 'bg-[#E5ECE7] border-[3.5px] border-[#D0DAD2] shadow-stone-300/60 ring-1 ring-black/5'
        }`}
      >
        {/* 屏幕内壳 */}
        <div
          className="relative w-full h-full rounded-[44px] overflow-hidden flex flex-col transition-colors"
          style={{
            backgroundColor: t.background,
            color: t.textPrimary,
          }}
        >
          {/* iOS 顶部状态栏与灵动岛 */}
          <div
            className="relative z-40 h-11 shrink-0 px-6 flex items-center justify-between text-xs font-semibold"
            style={{ color: t.textPrimary }}
          >
            {/* 时间 (等宽清晰数字) */}
            <span className="font-mono tracking-tight text-[13px]">{simulatedTime}</span>

            {/* 灵动岛 (Dynamic Island) */}
            <div
              onClick={onDynamicIslandClick}
              className="absolute left-1/2 -translate-x-1/2 top-2 w-[108px] h-[28px] bg-black rounded-full flex items-center justify-between px-3 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              title="轻触灵动岛"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#24332F]" />
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: t.accent, opacity: 0.8 }}
              />
            </div>

            {/* 蜂窝网络、Wi-Fi、电池电量指示 */}
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: t.textPrimary }}>
              {/* 4条信号阶梯 */}
              <div className="flex items-end gap-[1.5px] h-3">
                <span className="w-[2.5px] h-1 bg-current rounded-xs" />
                <span className="w-[2.5px] h-1.5 bg-current rounded-xs" />
                <span className="w-[2.5px] h-2 bg-current rounded-xs" />
                <span className="w-[2.5px] h-2.5 bg-current rounded-xs" />
              </div>

              {/* Wi-Fi */}
              <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />

              {/* 电池 */}
              <div className="w-5 h-2.5 rounded-[4px] border border-current p-[1px] flex items-center relative">
                <div className="h-full w-3.5 bg-current rounded-[2px]" />
                <span className="absolute -right-1 top-0.5 w-0.5 h-1.5 bg-current rounded-r-xs" />
              </div>
            </div>
          </div>

          {/* 屏幕内容区域 (滚动区域) */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
            {children}
          </div>

          {/* iOS 底部 Home 指示条 (Home Indicator) */}
          <div className="relative z-40 h-6 shrink-0 flex items-center justify-center">
            <div
              className="w-32 h-1 rounded-full transition-colors"
              style={{
                backgroundColor: isDarkMode ? 'rgba(237, 242, 238, 0.35)' : 'rgba(36, 51, 47, 0.25)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
