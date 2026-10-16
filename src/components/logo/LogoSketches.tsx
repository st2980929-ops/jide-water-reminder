import React, { useState } from 'react';
import { Check, Copy, Eye, Sparkles, Droplets, RefreshCw } from 'lucide-react';
import { CupWaterlineSVG, CupWaterlineSVGProps } from './CupWaterlineSVG';
import { playDrinkWaterSound } from '../../utils/audio';

export { CupWaterlineSVG };
export type { CupWaterlineSVGProps };

export const LogoSketches: React.FC = () => {
  const [demoWaterLevel, setDemoWaterLevel] = useState(65);
  const [activeIconTheme, setActiveIconTheme] = useState<'light' | 'dark' | 'tinted'>('light');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showFullSVGModal, setShowFullSVGModal] = useState(false);
  const [isWobbling, setIsWobbling] = useState(false);

  const triggerDrinkSimulation = (delta: number = -20) => {
    setIsWobbling(true);
    playDrinkWaterSound();
    setDemoWaterLevel((prev) => Math.max(5, prev + delta));
    setTimeout(() => setIsWobbling(false), 800);
  };

  const resetWater = () => {
    setIsWobbling(true);
    setDemoWaterLevel(100);
    setTimeout(() => setIsWobbling(false), 600);
  };

  const getExportSVGSource = () => {
    const clamped = Math.max(0, Math.min(100, demoWaterLevel));
    const waterNum = 74 - (clamped / 100) * 44;
    const yScaled = (waterNum * 10).toFixed(0);
    const ctrl1 = ((waterNum - 1.5) * 10).toFixed(0);
    const ctrl2 = ((waterNum + 1.5) * 10).toFixed(0);
    const subLine = ((waterNum + 7) * 10).toFixed(0);
    const subCtrl1 = ((waterNum + 6) * 10).toFixed(0);
    const subCtrl2 = ((waterNum + 8) * 10).toFixed(0);

    return `<!-- 喝水提醒 App 图标 - 瓷白 × 深湖青 (1024x1024) -->
<svg viewBox="0 0 1024 1024" width="1024" height="1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 底层独立背景：可根据 iOS Light/Dark/Tinted 分离 -->
  <rect width="1024" height="1024" rx="224" fill="#F6F7F3" />
  
  <!-- 水体填充层 (随剩余喝水杯数动态下降，当前对应水位 ${clamped}%) -->
  <path d="M 320 ${yScaled} C 400 ${ctrl1} 620 ${ctrl2} 704 ${yScaled} L 665 760 C 655 790 625 805 585 805 H 415 C 375 805 345 790 335 760 Z"
        fill="#2F665E" fill-opacity="0.18" />

  <!-- 杯体主轮廓 -->
  <path d="M266 256 C266 245 276 235 287 235 H737 C748 235 758 245 758 256 L701 768 C698 804 667 830 632 830 H392 C357 830 326 804 323 768 Z" 
        stroke="#24332F" stroke-width="58" stroke-linecap="round" stroke-linejoin="round" />
        
  <!-- 杯口平缓弧度 -->
  <path d="M287 235 C358 260 666 260 737 235" 
        stroke="#24332F" stroke-width="40" stroke-linecap="round" />
        
  <!-- 动态弧形主水线 (深湖青) -->
  <path d="M 320 ${yScaled} C 400 ${ctrl1} 620 ${ctrl2} 704 ${yScaled}" 
        stroke="#2F665E" stroke-width="50" stroke-linecap="round" />
        
  <!-- 次级水光微线 -->
  <path d="M 350 ${subLine} C 420 ${subCtrl1} 600 ${subCtrl2} 670 ${subLine}" 
        stroke="#5B6A63" stroke-width="24" stroke-linecap="round" opacity="0.6" />
</svg>`;
  };

  const handleCopySVG = () => {
    navigator.clipboard.writeText(getExportSVGSource());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8 p-1">
      {/* 头部定稿结论 */}
      <div className="border-b border-[#DEE4DE] pb-6">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-[#2F665E]">
          <Sparkles className="w-4 h-4" />
          <span>Brand Identity · Approved Direction</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#24332F] tracking-tight">
              Logo 方案：原创水杯与动态水线（瓷白 × 深湖青）
            </h2>
            <p className="mt-1.5 text-sm text-[#5B6A63] leading-relaxed max-w-3xl">
              微收腰杯身与平缓外撇口奠定稳固器皿质感，
              <strong>杯中水线与水体随着喝水杯数减少而实时动态下降</strong>，兼具直观辨识度与安静精致的视觉体验。
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E7EFEB] text-[#2F665E] text-xs font-medium shrink-0 self-start sm:self-center border border-[#DEE4DE]">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>品牌色与 accent 对齐</span>
          </div>
        </div>
      </div>

      {/* 核心互动演示：水位随喝水动态沉降 */}
      <div className="bg-white rounded-3xl p-6 border border-[#DEE4DE] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#DEE4DE]">
          <div>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#2F665E]" />
              <h3 className="text-base font-semibold text-[#24332F]">
                水位动态沉降交互演示 (Water Level Decrement)
              </h3>
            </div>
            <p className="text-xs text-[#5B6A63] mt-1">
              用户在通知或主页点击「收到 马上去喝」时，水线即刻伴随柔和波浪微澜向下沉降。
            </p>
          </div>

          {/* 快捷模拟操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerDrinkSimulation(-20)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#2F665E] rounded-xl hover:bg-[#26534C] transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>模拟喝掉一杯 (-20%)</span>
            </button>
            <button
              onClick={resetWater}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#24332F] bg-[#F6F7F3] border border-[#DEE4DE] rounded-xl hover:bg-[#E7EFEB] transition-colors cursor-pointer"
              title="重新装满水"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新满杯</span>
            </button>
          </div>
        </div>

        {/* 动态水位主展示台 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 左侧超大水杯动画展示台 */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-[#F6F7F3] rounded-2xl border border-[#DEE4DE]">
            <div className="relative">
              <div className="w-48 h-48 rounded-3xl bg-white flex items-center justify-center shadow-md border border-[#DEE4DE]">
                <CupWaterlineSVG
                  size={120}
                  color="#24332F"
                  waterColor="#2F665E"
                  waterLevel={demoWaterLevel}
                  isAnimating={isWobbling}
                  showFill={true}
                />
              </div>
            </div>

            <div className="mt-4 text-center">
              <div className="text-sm font-semibold text-[#24332F] font-mono">
                当前水位: {demoWaterLevel}%
              </div>
              <p className="text-[11px] text-[#5B6A63] mt-0.5">
                {demoWaterLevel >= 80
                  ? '杯水充盈 · 开始一天的饮水节奏'
                  : demoWaterLevel >= 40
                  ? '稳步推进 · 喝水杯数持续减少'
                  : demoWaterLevel > 5
                  ? '即将见底 · 目标完成度高'
                  : '已喝完全部水杯 · 今日安排达成'}
              </p>
            </div>
          </div>

          {/* 右侧阶段预设与滑块 */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[#24332F] mb-2">
                <span>连续水位微调滑块</span>
                <span className="font-mono text-[#2F665E] font-semibold">{demoWaterLevel}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={demoWaterLevel}
                onChange={(e) => setDemoWaterLevel(Number(e.target.value))}
                className="w-full accent-[#2F665E] cursor-pointer"
              />
            </div>

            {/* 四档典型杯数状态预设 */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#24332F] block">
                四档典型杯数状态对比 (点击直接跳转)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '8 杯 (满杯)', level: 100, desc: '晨间开启' },
                  { label: '6 杯 (75%)', level: 75, desc: '上午进行' },
                  { label: '4 杯 (50%)', level: 50, desc: '午休过后' },
                  { label: '1 杯 (20%)', level: 20, desc: '临近下班' },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => {
                      setIsWobbling(true);
                      setDemoWaterLevel(item.level);
                      setTimeout(() => setIsWobbling(false), 600);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      demoWaterLevel === item.level
                        ? 'bg-[#E7EFEB] border-[#2F665E] text-[#2F665E] ring-1 ring-[#2F665E] shadow-xs'
                        : 'bg-[#F6F7F3] border-[#DEE4DE] text-[#5B6A63] hover:bg-[#E7EFEB]'
                    }`}
                  >
                    <div className="text-xs font-semibold text-current">{item.label}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#E7EFEB] text-xs text-[#24332F] space-y-1 border border-[#DEE4DE]">
              <span className="font-semibold text-[#2F665E]">交互联动规则：</span>
              <p className="text-[11px] text-[#5B6A63] leading-relaxed">
                每次用户在锁屏通知或主页点击「收到 马上去喝」，Logo
                水线将下降一格并伴随水波微动，声音反馈为轻柔清润的泛音；点击「现在还不渴」则水线维持不变，10
                分钟后再行提示。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 极限缩放清晰度核查 (24px · 40px · 60px · 120px) 随水位联动 */}
      <div className="bg-white rounded-2xl p-6 border border-[#DEE4DE] shadow-xs">
        <h3 className="text-base font-semibold text-[#24332F] mb-1">
          多尺寸极限缩放清晰度核查（实时联动当前水位）
        </h3>
        <p className="text-xs text-[#5B6A63] mb-5">
          杯体微收腰外廓与平缓外撇口构成刚性识别骨架，内部水线在 24pt、40pt、60pt 各尺寸下均保持干净锐利：
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
          {/* 24px Spotlight / 通知 */}
          <div className="bg-[#F6F7F3] rounded-xl p-4 flex flex-col items-center justify-center border border-[#DEE4DE]">
            <div className="h-16 flex items-center justify-center">
              <CupWaterlineSVG
                size={24}
                color="#24332F"
                waterColor="#2F665E"
                waterLevel={demoWaterLevel}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-xs font-semibold text-[#24332F] font-mono">24 × 24 pt</span>
              <p className="text-[11px] text-[#5B6A63]">通知小图标 / 列表</p>
            </div>
          </div>

          {/* 40px Spotlight */}
          <div className="bg-[#F6F7F3] rounded-xl p-4 flex flex-col items-center justify-center border border-[#DEE4DE]">
            <div className="h-16 flex items-center justify-center">
              <CupWaterlineSVG
                size={40}
                color="#24332F"
                waterColor="#2F665E"
                waterLevel={demoWaterLevel}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-xs font-semibold text-[#24332F] font-mono">40 × 40 pt</span>
              <p className="text-[11px] text-[#5B6A63]">设置列表 / 搜索</p>
            </div>
          </div>

          {/* 60px iPhone 主屏实际尺寸 */}
          <div className="bg-[#F6F7F3] rounded-xl p-4 flex flex-col items-center justify-center border border-[#DEE4DE]">
            <div className="h-16 flex items-center justify-center">
              <CupWaterlineSVG
                size={60}
                color="#24332F"
                waterColor="#2F665E"
                waterLevel={demoWaterLevel}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-xs font-semibold text-[#24332F] font-mono">60 × 60 pt</span>
              <p className="text-[11px] text-[#5B6A63]">iPhone 主屏幕实际渲染</p>
            </div>
          </div>

          {/* 120px 视网膜高清资产 */}
          <div className="bg-[#F6F7F3] rounded-xl p-4 flex flex-col items-center justify-center border border-[#DEE4DE]">
            <div className="h-16 flex items-center justify-center">
              <CupWaterlineSVG
                size={68}
                color="#24332F"
                waterColor="#2F665E"
                waterLevel={demoWaterLevel}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-xs font-semibold text-[#24332F] font-mono">120 × 120 pt</span>
              <p className="text-[11px] text-[#5B6A63]">@2x / @3x 高清资产</p>
            </div>
          </div>
        </div>
      </div>

      {/* iOS 18 规范 App 图标预览 (浅色 / 深色 / 系统着色) */}
      <div className="bg-white rounded-2xl p-6 border border-[#DEE4DE] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-semibold text-[#24332F]">
              iOS 18 规范 App 图标预览 (1024×1024 母版画板)
            </h3>
            <p className="text-xs text-[#5B6A63] mt-1">
              遵循 HIG 规范：图形充满中区留白、圆角由 iOS 系统统一切割（Squircle）。
            </p>
          </div>

          {/* 模式切换 */}
          <div className="flex items-center bg-[#F6F7F3] p-1 rounded-xl border border-[#DEE4DE] shrink-0">
            <button
              onClick={() => setActiveIconTheme('light')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeIconTheme === 'light'
                  ? 'bg-white text-[#2F665E] shadow-xs'
                  : 'text-[#5B6A63] hover:text-[#24332F]'
              }`}
            >
              浅色模式
            </button>
            <button
              onClick={() => setActiveIconTheme('dark')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeIconTheme === 'dark'
                  ? 'bg-white text-[#2F665E] shadow-xs'
                  : 'text-[#5B6A63] hover:text-[#24332F]'
              }`}
            >
              深色模式
            </button>
            <button
              onClick={() => setActiveIconTheme('tinted')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeIconTheme === 'tinted'
                  ? 'bg-white text-[#2F665E] shadow-xs'
                  : 'text-[#5B6A63] hover:text-[#24332F]'
              }`}
            >
              iOS 18 系统着色
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 大图标展示 */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#F6F7F3] rounded-2xl border border-[#DEE4DE]">
            <div className="relative group">
              <div
                className={`w-44 h-44 rounded-[42px] p-6 flex items-center justify-center shadow-lg transition-all ${
                  activeIconTheme === 'light'
                    ? 'bg-[#F6F7F3] border border-[#DEE4DE]'
                    : activeIconTheme === 'dark'
                    ? 'bg-[#141D1B] border border-[#3A4B43]'
                    : 'bg-[#2F665E] border border-[#9CC8BA]'
                }`}
              >
                {activeIconTheme === 'light' && (
                  <CupWaterlineSVG
                    size={110}
                    color="#24332F"
                    waterColor="#2F665E"
                    waterLevel={demoWaterLevel}
                  />
                )}
                {activeIconTheme === 'dark' && (
                  <CupWaterlineSVG
                    size={110}
                    color="#EDF2EE"
                    waterColor="#9CC8BA"
                    waterLevel={demoWaterLevel}
                    isDarkMode={true}
                  />
                )}
                {activeIconTheme === 'tinted' && (
                  <CupWaterlineSVG
                    size={110}
                    color="#FFFFFF"
                    waterColor="#9CC8BA"
                    monochrome
                    waterLevel={demoWaterLevel}
                  />
                )}
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className="text-xs font-semibold text-[#24332F]">喝水提醒</span>
              <p className="text-[11px] text-[#5B6A63] mt-0.5 font-mono">1024 × 1024 Master Icon</p>
            </div>
          </div>

          {/* 导出与代码交付 */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-[#24332F]">定稿交付标准说明</h4>
              <ul className="text-xs text-[#5B6A63] space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F665E] mt-1.5 shrink-0" />
                  <span>
                    <strong>动态水线可参数化：</strong>
                    SVG 内的水体与弧线由清晰的几何控制点计算，前端或原生 Swift UI 均可通过数值绑定进行平滑插值动画。
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2F665E] mt-1.5 shrink-0" />
                  <span>
                    <strong>极简矢量无栅格依赖：</strong>
                    主体仅由纯贝塞尔曲线构成，移除阴影与渐变后，在纯黑白单色或浅深色背景下依然坚挺。
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={handleCopySVG}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#2F665E] rounded-xl hover:bg-[#26534C] transition-colors shadow-xs cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? '已复制 SVG 源码' : '复制定稿矢量 SVG 代码'}</span>
              </button>

              <button
                onClick={() => setShowFullSVGModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#2F665E] bg-[#E7EFEB] border border-[#DEE4DE] rounded-xl hover:bg-[#D5E3DC] transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>检视 SVG 节点结构</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SVG 节点查看弹窗 */}
      {showFullSVGModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-[#DEE4DE]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEE4DE]">
              <h3 className="text-sm font-semibold text-[#24332F]">定稿水杯与水线 Logo - SVG 源码</h3>
              <button
                onClick={() => setShowFullSVGModal(false)}
                className="text-xs text-[#5B6A63] hover:text-[#24332F] px-2 py-1 rounded-md cursor-pointer"
              >
                关闭
              </button>
            </div>
            <pre className="mt-4 p-3 bg-[#F6F7F3] rounded-xl text-[11px] font-mono text-[#24332F] overflow-x-auto max-h-72 border border-[#DEE4DE]">
              {getExportSVGSource()}
            </pre>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleCopySVG}
                className="px-4 py-2 text-xs font-medium bg-[#2F665E] text-white rounded-xl hover:bg-[#26534C] cursor-pointer"
              >
                {copiedCode ? '已复制' : '复制代码'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
