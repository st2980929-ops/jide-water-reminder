import React, { useId } from 'react';

export interface CupWaterlineSVGProps {
  color?: string;
  waterColor?: string;
  size?: number | string;
  monochrome?: boolean;
  className?: string;
  waterLevel?: number; // 0 to 100
  isAnimating?: boolean;
  animate?: boolean; // 是否启用 CSS transition 过渡动画
  showFill?: boolean;
  isDarkMode?: boolean;
}

/**
 * 喝水提醒 App 核心 Logo：原创水杯与动态水线
 * 在 remainingGlasses 变化时，通过 CSS transition 属性平滑过渡水位的 clip-path 与 transform，
 * 实现如真实水体沉降般的优雅质感。
 * 适配「瓷白 × 深湖青」视觉体系。
 */
export const CupWaterlineSVG: React.FC<CupWaterlineSVGProps> = ({
  color,
  waterColor,
  size = 64,
  monochrome = false,
  className = '',
  waterLevel = 65,
  isAnimating = false,
  animate = true,
  showFill = true,
  isDarkMode = false,
}) => {
  const clipId = useId().replace(/:/g, '-');

  const resolvedColor = color ?? (isDarkMode ? '#EDF2EE' : '#24332F');
  const resolvedWaterColor = waterColor ?? (isDarkMode ? '#9CC8BA' : '#2F665E');

  // 确保水位在 0 到 100 之间
  const clamped = Math.max(0, Math.min(100, waterLevel));

  // 杯子垂直内腔：从 y=28 (100% 满) 到 y=74 (0% 杯底)
  // topInsetPercent 计算水体顶部裁剪百分比 (从 28% 到 75%)
  const waterY = 74 - (clamped / 100) * 46;
  const topInsetPercent = 74 - (clamped / 100) * 46;

  const actualWaterColor = monochrome ? resolvedColor : resolvedWaterColor;

  // 统一缓动贝塞尔曲线
  const transitionEasing = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const transitionDuration = '0.85s';

  // CSS clip-path 平滑过渡样式
  const liquidClipTransitionStyle: React.CSSProperties = {
    clipPath: clamped <= 1 ? 'inset(78% 0% 0% 0%)' : `inset(${topInsetPercent.toFixed(2)}% 0% 0% 0%)`,
    transition: animate ? `clip-path ${transitionDuration} ${transitionEasing}` : 'none',
    willChange: 'clip-path',
  };

  // 水线 transform translateY 平滑过渡样式
  const waterlineTransformStyle: React.CSSProperties = {
    transform: `translateY(${(waterY - 50).toFixed(2)}px)`,
    transition: animate
      ? `transform ${transitionDuration} ${transitionEasing}, opacity 0.5s ease`
      : 'opacity 0.5s ease',
    opacity: clamped <= 1 ? 0 : 1,
    transformOrigin: '50% 50%',
    willChange: 'transform',
  };

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`cup-waterline-svg ${className} ${isAnimating ? 'cup-waterline-animating' : ''}`}
      aria-label={`原创水杯与水线 Logo (当前水位: ${Math.round(clamped)}%)`}
    >
      <defs>
        {/* 杯身内部水体刚性轮廓裁剪蒙版：确保水体严格局限在杯壁内 */}
        <clipPath id={`cup-contour-mask-${clipId}`}>
          <path d="M28 25 L72 25 L68 74 C67.5 77.5 64.8 80 61.5 80 H38.5 C35.2 80 32.5 77.5 32 74 Z" />
        </clipPath>
      </defs>

      {/* 1. 内部水体填充层：应用 CSS transition: clip-path 平滑沉降 */}
      {showFill && (
        <g clipPath={`url(#cup-contour-mask-${clipId})`}>
          <g style={liquidClipTransitionStyle}>
            {/* 充满杯腔的整块水体，由外层 clip-path: inset(...) 随水位百分比平滑裁剪 */}
            <path
              d="M 26 24 H 74 L 69 76 C 68 79 65 81 61.5 81 H 38.5 C 35 81 32 79 31 76 Z"
              fill={actualWaterColor}
              fillOpacity={monochrome ? 0.14 : isDarkMode ? 0.28 : 0.18}
            />
          </g>
        </g>
      )}

      {/* 2. 杯体主外轮廓：微收腰、平缓外撇口、厚底平衡质感 */}
      <path
        d="M26 25 C26 24 27 23 28 23 H72 C73 23 74 24 74 25 L68.5 75 C68.2 78.5 65.2 81 61.8 81 H38.2 C34.8 81 31.8 78.5 31.5 75 Z"
        stroke={resolvedColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. 杯口平缓微弧度边缘，强化开口立体感 */}
      <path
        d="M28 23 C35 25.5 65 25.5 72 23"
        stroke={resolvedColor}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* 4. 动态弧形主水线与微波：随水位高度平滑下移，并支持微水波互动 */}
      <g style={waterlineTransformStyle}>
        {/* 弧形主水线 */}
        <path
          d={
            isAnimating
              ? 'M 31 50 C 39 46.5 61 53.5 69 50'
              : 'M 31 50 C 39 48.5 61 51.5 69 50'
          }
          stroke={actualWaterColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={isAnimating ? '38' : 'none'}
          className={isAnimating ? 'animate-pulse' : ''}
          style={{
            strokeDashoffset: isAnimating ? 4 : 0,
            transition: 'stroke-dashoffset 0.85s ease-out, d 0.3s ease',
          }}
        />

        {/* 次级微波泛光线：当水位在中高位时呈现张力微光 */}
        {clamped > 15 && (
          <path
            d="M 34 56 C 41 55 59 57 66 55.5"
            stroke={actualWaterColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity={monochrome ? 0.35 : 0.65}
            style={{
              transition: 'opacity 0.4s ease',
            }}
          />
        )}
      </g>
    </svg>
  );
};
