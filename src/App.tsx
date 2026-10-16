/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ReminderConfig, HomeDisplayState } from './types/reminder';
import { IPhoneFrame } from './components/phone/IPhoneFrame';
import { Step1Schedule } from './components/prototype/Step1Schedule';
import { Step2Sound } from './components/prototype/Step2Sound';
import { HomeScreen } from './components/prototype/HomeScreen';
import { NotificationBanner } from './components/prototype/NotificationBanner';
import { LogoSketches, CupWaterlineSVG } from './components/logo/LogoSketches';
import { DesignSystemPanel } from './components/design-system/DesignSystemPanel';
import { StateReviewBar } from './components/prototype/StateReviewBar';
import { Smartphone, Sparkles, Layers, Sun, Moon } from 'lucide-react';
import { getThemeTokens } from './utils/theme';

import { playDrinkWaterSound } from './utils/audio';

const STORAGE_KEY = 'water_reminder_config_v1';

const DEFAULT_CONFIG: ReminderConfig = {
  mode: 'workday',
  startTime: '09:00',
  endTime: '18:00',
  intervalMinutes: 60,
  hasLunchBreak: true,
  lunchStart: '12:00',
  lunchEnd: '13:30',
  workdays: [1, 2, 3, 4, 5], // 周一至周五
  specificDates: ['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19'],
  sound: 'celesta',
  loudness: 'soft',
  notificationPermission: 'granted',
  isPausedToday: false,
  hasCompletedSetup: false, // 首次打开展示第 1 步
  remainingGlasses: 6,      // 默认剩余 6 杯
  totalDailyGlasses: 8,     // 目标 8 杯 (对应 75% 水位)
  snoozeUntilTime: null,
  lastDrinkTime: '13:30',
};

export default function App() {
  // Navigation tabs for the design & review workbench
  const [activeTab, setActiveTab] = useState<'prototype' | 'logo' | 'design_system'>('prototype');

  // App screen inside the iPhone prototype: 'step1' | 'step2' | 'home'
  const [currentScreen, setCurrentScreen] = useState<'step1' | 'step2' | 'home'>('step1');

  // Device & theme settings (深浅色模式)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [forcedState, setForcedState] = useState<HomeDisplayState | null>(null);

  // Simulated notification banner state
  const [showNotification, setShowNotification] = useState(false);

  const t = getThemeTokens(isDarkMode);

  // Persistent user configuration
  const [config, setConfig] = useState<ReminderConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load saved config', e);
    }
    return DEFAULT_CONFIG;
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save config', e);
    }
  }, [config]);

  // If already completed setup on initial load, show home screen
  useEffect(() => {
    if (config.hasCompletedSetup) {
      setCurrentScreen('home');
    }
  }, []);

  const currentWaterLevel = Math.round((config.remainingGlasses / config.totalDailyGlasses) * 100);

  const handleDrinkGlass = () => {
    playDrinkWaterSound();
    setConfig((prev) => ({
      ...prev,
      remainingGlasses: Math.max(0, prev.remainingGlasses - 1),
      snoozeUntilTime: null,
      lastDrinkTime: new Date().toTimeString().slice(0, 5),
    }));
  };

  const handlePostpone10m = () => {
    const now = new Date();
    const futureMinutes = now.getHours() * 60 + now.getMinutes() + 10;
    const h = Math.floor((futureMinutes % (24 * 60)) / 60).toString().padStart(2, '0');
    const m = ((futureMinutes % (24 * 60)) % 60).toString().padStart(2, '0');
    setConfig((prev) => ({
      ...prev,
      snoozeUntilTime: `${h}:${m}`,
    }));
  };

  const handleResetGlasses = () => {
    setConfig((prev) => ({
      ...prev,
      remainingGlasses: prev.totalDailyGlasses,
      snoozeUntilTime: null,
    }));
  };

  const handleUpdateConfig = (partial: Partial<ReminderConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const handleTriggerNotification = () => {
    setShowNotification(true);
  };

  const handleRestartOnboarding = () => {
    setConfig((prev) => ({
      ...prev,
      hasCompletedSetup: false,
      isPausedToday: false,
    }));
    setCurrentScreen('step1');
    setForcedState(null);
  };

  return (
    <div
      className="min-h-screen transition-colors flex flex-col"
      style={{
        backgroundColor: t.background,
        color: t.textPrimary,
      }}
    >
      {/* 顶部主工作台导航条 (3 区结构：品牌 / 视图切换 / 主题模式) */}
      <header
        className="sticky top-0 z-40 px-4 sm:px-8 py-3.5 border-b backdrop-blur-md transition-colors"
        style={{
          backgroundColor: isDarkMode ? 'rgba(29, 42, 38, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          borderColor: t.separator,
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: 品牌标题 */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl border flex items-center justify-center shadow-xs transition-colors"
              style={{
                backgroundColor: t.surface,
                borderColor: t.separator,
              }}
            >
              <CupWaterlineSVG
                size={20}
                color={t.accent}
                waterColor={t.accent}
                waterLevel={currentWaterLevel}
                isDarkMode={isDarkMode}
              />
            </div>
            <div>
              <span
                className="text-base font-semibold tracking-tight whitespace-nowrap"
                style={{ color: t.textPrimary }}
              >
                喝水提醒
              </span>
              <span
                className="hidden sm:inline-block text-xs ml-2 font-medium"
                style={{ color: t.textSecondary }}
              >
                瓷白 × 深湖青 · 视觉评审样机
              </span>
            </div>
          </div>

          {/* Zone 2: 核心视图切换 (原型体验 / Logo方案 / 视觉系统规范) */}
          <nav
            className="flex items-center p-1 rounded-xl border text-xs font-medium"
            style={{
              backgroundColor: t.input,
              borderColor: t.separator,
            }}
          >
            <button
              onClick={() => setActiveTab('prototype')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              style={{
                backgroundColor: activeTab === 'prototype' ? t.surface : 'transparent',
                color: activeTab === 'prototype' ? t.accent : t.textSecondary,
                fontWeight: activeTab === 'prototype' ? 600 : 500,
                boxShadow: activeTab === 'prototype' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iPhone 交互样机</span>
            </button>

            <button
              onClick={() => setActiveTab('logo')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              style={{
                backgroundColor: activeTab === 'logo' ? t.surface : 'transparent',
                color: activeTab === 'logo' ? t.accent : t.textSecondary,
                fontWeight: activeTab === 'logo' ? 600 : 500,
                boxShadow: activeTab === 'logo' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Logo 与小尺寸核查</span>
            </button>

            <button
              onClick={() => setActiveTab('design_system')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              style={{
                backgroundColor: activeTab === 'design_system' ? t.surface : 'transparent',
                color: activeTab === 'design_system' ? t.accent : t.textSecondary,
                fontWeight: activeTab === 'design_system' ? 600 : 500,
                boxShadow: activeTab === 'design_system' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Token 系统与 HIG 规范</span>
            </button>
          </nav>

          {/* Zone 3: 深浅色模式切换 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: t.input,
                borderColor: t.separator,
                color: t.textPrimary,
              }}
              title={isDarkMode ? '切换至浅色模式' : '切换至深色模式'}
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5" style={{ color: t.accent }} />
              )}
              <span className="hidden sm:inline">
                {isDarkMode ? '浅色' : '深色'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 主工作区 */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex-1 w-full">
        {activeTab === 'prototype' && (
          <div className="space-y-6">
            {/* 评审专用控制台 */}
            <StateReviewBar
              currentForcedState={forcedState}
              onSelectForcedState={setForcedState}
              config={config}
              onUpdateConfig={handleUpdateConfig}
              onTriggerNotification={handleTriggerNotification}
              onRestartOnboarding={handleRestartOnboarding}
              onDrinkGlass={handleDrinkGlass}
              onResetGlasses={handleResetGlasses}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              activeScreen={currentScreen}
              onNavigateScreen={(screen) => {
                setCurrentScreen(screen);
                if (screen === 'home') setForcedState(null);
              }}
            />

            {/* 手机容器居中渲染 */}
            <div className="py-2">
              <IPhoneFrame
                isDarkMode={isDarkMode}
                simulatedTime="09:41"
                onDynamicIslandClick={handleTriggerNotification}
              >
                {/* 模拟通知横幅浮层：提供「现在还不渴」与「收到 马上去喝」 */}
                <NotificationBanner
                  isOpen={showNotification}
                  onClose={() => setShowNotification(false)}
                  onPostpone10m={handlePostpone10m}
                  onConfirmDrink={handleDrinkGlass}
                  sound={config.sound}
                  loudness={config.loudness}
                  simulatedTime="现在"
                  isDarkMode={isDarkMode}
                  waterLevel={currentWaterLevel}
                />

                {/* 屏幕内容路由 */}
                {currentScreen === 'step1' && (
                  <Step1Schedule
                    config={config}
                    onChange={handleUpdateConfig}
                    onNext={() => setCurrentScreen('step2')}
                    isDarkMode={isDarkMode}
                  />
                )}

                {currentScreen === 'step2' && (
                  <Step2Sound
                    config={config}
                    onChange={handleUpdateConfig}
                    onBack={() => setCurrentScreen('step1')}
                    onComplete={() => setCurrentScreen('home')}
                    onTriggerTestNotification={handleTriggerNotification}
                    isDarkMode={isDarkMode}
                  />
                )}

                {currentScreen === 'home' && (
                  <HomeScreen
                    config={config}
                    onEditSchedule={() => setCurrentScreen('step1')}
                    onEditSound={() => setCurrentScreen('step2')}
                    onTogglePauseToday={() =>
                      handleUpdateConfig({ isPausedToday: !config.isPausedToday })
                    }
                    onTriggerNotification={handleTriggerNotification}
                    onDrinkGlass={handleDrinkGlass}
                    onResetGlasses={handleResetGlasses}
                    onFixUnauthorized={() =>
                      handleUpdateConfig({ notificationPermission: 'granted' })
                    }
                    forcedState={forcedState}
                    isDarkMode={isDarkMode}
                  />
                )}
              </IPhoneFrame>
            </div>
          </div>
        )}

        {activeTab === 'logo' && (
          <LogoSketches />
        )}

        {activeTab === 'design_system' && (
          <DesignSystemPanel />
        )}
      </main>
    </div>
  );
}
