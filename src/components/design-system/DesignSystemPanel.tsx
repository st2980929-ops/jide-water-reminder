import React from 'react';
import { Palette, Type, Maximize2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const DesignSystemPanel: React.FC = () => {
  const colorTokens = [
    { name: 'background', hex: '#F6F7F3', darkHex: '#141D1B', desc: '整体页面背景，明亮轻微暖调中性色', usage: 'Canvas / App Background' },
    { name: 'surface', hex: '#FFFFFF', darkHex: '#1D2A26', desc: '表单容器、分组列表与卡片表面', usage: 'Card / Group Surface' },
    { name: 'input', hex: '#F0F3EF', darkHex: '#26362F', desc: '输入区域背景、未选中的间隔项', usage: 'Input / Unselected Chip' },
    { name: 'text-primary', hex: '#24332F', darkHex: '#EDF2EE', desc: '标题、主要文字、时间数值，对比度 13.21:1', usage: 'Headline / Tabular Numbers' },
    { name: 'text-secondary', hex: '#5B6A63', darkHex: '#B0BEB5', desc: '标签、说明、日程摘要，对比度 5.29:1', usage: 'Caption / Secondary Text' },
    { name: 'accent', hex: '#2F665E', darkHex: '#9CC8BA', desc: '深湖青品牌色，主按钮、启用开关、强选中态', usage: 'Primary CTA / Active State' },
    { name: 'on-accent', hex: '#FFFFFF', darkHex: '#17382F', desc: '深色主按钮上的文字，对比度 6.60:1', usage: 'On-Accent Text' },
    { name: 'selected-soft', hex: '#E7EFEB', darkHex: '#2B4036', desc: '大面积选中项背景、日程摘要承载区', usage: 'Soft Active Surface' },
    { name: 'separator', hex: '#DEE4DE', darkHex: '#3A4B43', desc: '细分隔线与轻边界，克制微弱边缘', usage: 'Hairline Divider / Border' },
  ];

  const contrastRatios = [
    { pair: '正文 (text-primary) / 表单表面 (surface)', ratio: '13.21 : 1', rating: 'WCAG AAA (极佳)' },
    { pair: '说明文字 (text-secondary) / 页面背景 (background)', ratio: '5.29 : 1', rating: 'WCAG AA (合格)' },
    { pair: '白字 (on-accent) / 主色 (accent)', ratio: '6.60 : 1', rating: 'WCAG AA (合格)' },
    { pair: '主色 (accent) / 浅选中底 (selected-soft)', ratio: '5.64 : 1', rating: 'WCAG AA (合格)' },
  ];

  const typeTokens = [
    { level: '页面大标题 (Large Title)', size: '26 pt', weight: '600 SemiBold', sample: '你希望什么时候提醒？' },
    { level: '卡片状态标语 (Title 2)', size: '23 pt', weight: '600 SemiBold', sample: '今日提醒进行中' },
    { level: '主要文字 / 选项标题', size: '15 pt', weight: '600 SemiBold', sample: '工作安排 · 每天 · 指定日期' },
    { level: '辅助说明 (Subheadline)', size: '13 pt', weight: '400 Regular', sample: '自选每周工作日与上下班时段，周末不打扰' },
    { level: '标签与注脚 (Footnote)', size: '11 pt', weight: '500 Medium', sample: '次日结束 (跨午夜) · 安静运行中' },
    { level: '等宽时间数值 (Tabular Time)', size: '16 pt', weight: '500 font-mono', sample: '下一次 14:30  ·  09:00–18:00  ·  60分' },
  ];

  const mappingRules = [
    '深灰紫色容器改为 surface (#FFFFFF / #1D2A26)；内部输入框改为 input (#F0F3EF / #26362F)。',
    '亮青色标题改为 text-primary 或 text-secondary，保留清楚的文字层级，避免花哨。',
    '强选中的间隔按钮使用 accent + on-accent；其他间隔项用 input + text-secondary。',
    '日期模式选中项用 selected-soft (#E7EFEB)，文字仍然保持深色，再用选中标记表达状态。',
    '时间数值用 text-primary，辅助标签用 text-secondary。',
    '日程摘要直接置于页面背景或 selected-soft 承载少量内容，采用清楚的深色文字。',
    '分隔线用 separator，边界细且克制；通过间距和分组表达层级。',
    '“次日结束 / 跨午夜”属于说明信息，使用 text-secondary；仅在真正的错误或风险状态使用语义警示色。',
    '去掉靠降低整个容器 opacity 获得浅色的写法。背景、文字、边框分别使用语义 token。',
    '深色模式作为完整配色单独适配，不在浅色页面内部嵌入深色表单。',
  ];

  return (
    <div className="space-y-8 p-1">
      {/* 头部说明 */}
      <div className="border-b border-[#DEE4DE] pb-6">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-[#2F665E]">
          <ShieldCheck className="w-4 h-4" />
          <span>Visual Foundation & HIG Specification</span>
        </div>
        <h2 className="text-2xl font-semibold text-[#24332F] tracking-tight">
          视觉主方案：瓷白 × 深湖青 (Porcelain White × Deep Lake Teal)
        </h2>
        <p className="mt-2 text-sm text-[#5B6A63] leading-relaxed max-w-3xl">
          以明亮、轻微暖调的中性色承载大面积界面。品牌色使用克制的深湖青，集中在主按钮、选中项、小图标及启用开关。普通标签和正文使用深色中性文字，视觉目标：轻量、安静、清晰、精致。
        </p>
      </div>

      {/* 色彩 Token 表 */}
      <div className="bg-white rounded-2xl p-6 border border-[#DEE4DE] shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-[#2F665E]" />
          <h3 className="text-base font-semibold text-[#24332F]">1. 完整语义色彩 Token 表 (浅色 / 深色模式单独适配)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {colorTokens.map((token) => (
            <div key={token.name} className="p-3.5 bg-[#F6F7F3] rounded-xl border border-[#DEE4DE] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold font-mono text-[#24332F]">{token.name}</span>
                  <span className="text-[10px] text-[#5B6A63] font-mono">{token.usage}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg border border-[#DEE4DE] shadow-xs"
                    style={{ backgroundColor: token.hex }}
                    title={`浅色: ${token.hex}`}
                  />
                  <div
                    className="w-8 h-8 rounded-lg border border-[#3A4B43] shadow-xs"
                    style={{ backgroundColor: token.darkHex }}
                    title={`深色: ${token.darkHex}`}
                  />
                  <div className="text-[11px] font-mono leading-tight">
                    <div className="text-[#24332F] font-semibold">{token.hex} (浅)</div>
                    <div className="text-[#5B6A63]">{token.darkHex} (深)</div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#5B6A63] mt-1 border-t border-[#DEE4DE] pt-2">{token.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 对比度与可读性核查 */}
      <div className="bg-white rounded-2xl p-6 border border-[#DEE4DE] shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-[#2F665E]" />
          <h3 className="text-base font-semibold text-[#24332F]">2. 静态色对对比度核查 (WCAG / Apple HIG)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contrastRatios.map((cr, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-[#F6F7F3] border border-[#DEE4DE] flex items-center justify-between">
              <span className="text-xs font-medium text-[#24332F]">{cr.pair}</span>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#2F665E] mr-2">{cr.ratio}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {cr.rating}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 修改映射规则清单 */}
      <div className="bg-white rounded-2xl p-6 border border-[#DEE4DE] shadow-xs">
        <h3 className="text-base font-semibold text-[#24332F] mb-3">
          3. 界面的 10 项修改映射落地清单
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#5B6A63]">
          {mappingRules.map((rule, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-[#F6F7F3] border border-[#DEE4DE] flex items-start gap-2">
              <span className="font-mono font-bold text-[#2F665E] shrink-0">{idx + 1}.</span>
              <span className="leading-relaxed">{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 字体层级 */}
      <div className="bg-white rounded-2xl p-6 border border-[#DEE4DE] shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-[#2F665E]" />
          <h3 className="text-base font-semibold text-[#24332F]">4. 字体尺度与等宽时间数值</h3>
        </div>

        <div className="space-y-3">
          {typeTokens.map((t, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#F6F7F3] border border-[#DEE4DE] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="sm:w-1/3">
                <div className="text-xs font-semibold text-[#24332F]">{t.level}</div>
                <div className="text-[11px] text-[#5B6A63] font-mono mt-0.5">
                  {t.size} · {t.weight}
                </div>
              </div>
              <div className="sm:w-2/3 text-[#24332F] text-sm truncate font-medium">
                {t.sample}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
