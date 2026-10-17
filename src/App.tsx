import React, { useEffect, useRef, useState } from "react";
import type { ReminderConfig } from "./types/reminder";
import { Step1Schedule } from "./components/prototype/Step1Schedule";
import { Step2Sound } from "./components/prototype/Step2Sound";
import { HomeScreen } from "./components/prototype/HomeScreen";
import {
  SettingsScreen,
  type Appearance,
} from "./components/prototype/SettingsScreen";
import { getThemeTokens } from "./utils/theme";
import { compilePlan, dateKey } from "./native/plan";
import { canonicalSound } from "./utils/sounds";
import {
  isIPhoneApp,
  notifications,
  type NativeStatus,
} from "./native/notifications";

const STORAGE_KEY = "water_reminder_config_v2";
const DEFAULT_CONFIG: ReminderConfig = {
  mode: "workday",
  startTime: "09:00",
  endTime: "18:00",
  intervalMinutes: 60,
  hasLunchBreak: true,
  lunchStart: "12:00",
  lunchEnd: "13:30",
  workdays: [1, 2, 3, 4, 5],
  specificDates: [dateKey(new Date())],
  sound: "celesta",
  loudness: "soft",
  notificationPermission: "prompt",
  isPausedToday: false,
  hasCompletedSetup: false,
  remainingGlasses: 8,
  totalDailyGlasses: 8,
  snoozeUntilTime: null,
  lastDrinkTime: null,
  drinkDate: dateKey(new Date()),
};
function readLocal(): ReminderConfig {
  try {
    const value = {
      ...DEFAULT_CONFIG,
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
    };
    compilePlan({ ...value, mode: "everyday" }); // Validate the persisted basic schedule before displaying it.
    if (!Array.isArray(value.workdays) || !Array.isArray(value.specificDates))
      return { ...DEFAULT_CONFIG };
    return {
      ...value,
      sound: canonicalSound(value.sound) as ReminderConfig["sound"],
      remainingGlasses: Number.isFinite(value.remainingGlasses)
        ? Math.max(0, Math.min(8, value.remainingGlasses))
        : 8,
      totalDailyGlasses: 8,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
function resetDay(value: ReminderConfig): ReminderConfig {
  return value.drinkDate === dateKey(new Date())
    ? value
    : {
        ...value,
        drinkDate: dateKey(new Date()),
        remainingGlasses: value.totalDailyGlasses,
        lastDrinkTime: null,
      };
}
export default function App() {
  const [config, setConfig] = useState<ReminderConfig>(() => ({
    ...resetDay(readLocal()),
    notificationPermission: "prompt" as const,
  }));
  const [draft, setDraft] = useState(config);
  const [screen, setScreen] = useState<"step1" | "step2" | "home" | "settings">(
    config.hasCompletedSetup ? "home" : "step1",
  );
  const [status, setStatus] = useState<NativeStatus | null>(null);
  const [ready, setReady] = useState(!isIPhoneApp),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [appearance, setAppearance] = useState<Appearance>(() => {
    try {
      const saved = localStorage.getItem("water_appearance_v1");
      return saved === "light" || saved === "dark" ? saved : "system";
    } catch {
      return "system";
    }
  });
  const dark = appearance === "system" ? systemDark : appearance === "dark";
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const change = () => setSystemDark(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("water_appearance_v1", appearance);
    } catch {}
  }, [appearance]);
  const generation = useRef(0);
  const operation = useRef(false),
    t = getThemeTokens(dark);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);
  const applyStatus = (value: NativeStatus) => {
    setStatus(value);
    setConfig((previous) =>
      resetDay({
        ...previous,
        notificationPermission: value.permission,
        isPausedToday: value.paused,
      }),
    );
    setDraft((previous) => ({
      ...previous,
      notificationPermission: value.permission,
      isPausedToday: value.paused,
    }));
  };
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      setMessage("手机存储不可用，饮水记录暂时无法保存。");
    }
  }, [config]);
  useEffect(() => {
    if (isIPhoneApp)
      void notifications.setAppearance(appearance).catch(() => {});
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    document.documentElement.style.backgroundColor = t.background;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", t.background);
  }, [appearance, dark, t.background]);
  useEffect(() => {
    let alive = true;
    const refresh = async (initial = false) => {
      if (operation.current) return;
      if (!isIPhoneApp) {
        setConfig(resetDay);
        return;
      }
      const startedAt = generation.current;
      try {
        const value = await notifications.status();
        if (!alive || operation.current || startedAt !== generation.current)
          return;
        if (value.soundMigrationNotice) setMessage(value.soundMigrationNotice);
        if (initial && value.hasPlan) {
          const saved = JSON.parse(value.configuration) as ReminderConfig;
          const local = resetDay(readLocal());
          const loaded = {
            ...DEFAULT_CONFIG,
            ...saved,
            sound: canonicalSound(saved.sound) as ReminderConfig["sound"],
            remainingGlasses: local.remainingGlasses,
            lastDrinkTime: local.lastDrinkTime,
            drinkDate: local.drinkDate,
            hasCompletedSetup: true,
            notificationPermission: value.permission,
            isPausedToday: value.paused,
          };
          setConfig(loaded);
          setDraft(loaded);
          setScreen("home");
          setStatus(value);
        } else {
          applyStatus(value);
          if (initial && !value.hasPlan) {
            setScreen("step1");
            setConfig((p) => ({ ...p, hasCompletedSetup: false }));
          }
        }
      } catch (error) {
        if (alive)
          setMessage(
            `无法读取系统提醒：${error instanceof Error ? error.message : String(error)}`,
          );
      } finally {
        if (alive) setReady(true);
      }
    };
    void refresh(true);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  const run = async (work: () => Promise<void>) => {
    if (operation.current) return;
    generation.current += 1;
    operation.current = true;
    setBusy(true);
    setMessage("");
    try {
      await work();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      window.scrollTo(0, 0);
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };
  const permission = async () => {
    let current = await notifications.status();
    if (current.permission === "prompt")
      current = await notifications.requestPermission();
    applyStatus(current);
    if (current.permission !== "granted")
      throw new Error("请在 iPhone 设置中允许通知，然后再启用提醒。");
    return current;
  };
  const save = () =>
    void run(async () => {
      const current = await permission();
      const paused = config.hasCompletedSetup ? current.paused : false;
      const next = {
        ...draft,
        hasCompletedSetup: true,
        isPausedToday: paused,
        notificationPermission: "granted" as const,
        snoozeUntilTime: null,
      };
      const installed = await notifications.configure(
        compilePlan(next),
        paused,
      );
      setConfig(resetDay(next));
      setDraft(next);
      applyStatus(installed);
      setScreen(config.hasCompletedSetup ? "settings" : "home");
    });
  const test = (useSystemSound = false) =>
    void run(async () => {
      const plan = compilePlan({ ...draft, mode: "everyday" });
      await permission();
      applyStatus(await notifications.test(plan.sound, useSystemSound, plan.volume ?? 100));
      setMessage(
        `${useSystemSound ? "系统默认音" : "所选提示音"}将在 10 秒后通过通知播放。可以退出 App，在平常的使用场景中听。`,
      );
    });
  const edit = (page: "step1" | "step2") => {
    setDraft(config);
    setScreen(page);
    setMessage("");
  };
  const navigate = (page: typeof screen) => {
    setScreen(page);
    setMessage("");
  };
  const toggleEnabled = () =>
    void run(async () => {
      applyStatus(await notifications.setPaused(!config.isPausedToday));
    });
  const openSystemSettings = () => void run(() => notifications.openSettings());
  return (
    <div
      className="app-shell"
      style={{ backgroundColor: t.background, color: t.textPrimary }}
    >
      <div className="app-content">
        {!isIPhoneApp && (
          <p className="text-xs px-6 pt-3" style={{ color: t.textSecondary }}>
            网页预览 · 系统通知需安装 iPhone 版
          </p>
        )}
        {message && (
          <p
            role="status"
            className="mx-6 mt-4 p-3 rounded-xl border text-sm leading-relaxed"
            style={{ backgroundColor: t.surface, borderColor: t.separator }}
          >
            {message}
          </p>
        )}
        {!ready ? (
          <p className="p-6 text-sm">正在读取提醒安排…</p>
        ) : (
          <fieldset disabled={busy} className="contents">
            {screen === "step1" && (
              <Step1Schedule
                config={draft}
                onChange={(partial) => setDraft((p) => ({ ...p, ...partial }))}
                onBack={
                  config.hasCompletedSetup
                    ? () => navigate("settings")
                    : undefined
                }
                onNext={() => {
                  try {
                    compilePlan(draft);
                    setMessage("");
                    if (config.hasCompletedSetup) save();
                    else navigate("step2");
                  } catch (error) {
                    setMessage((error as Error).message);
                    window.scrollTo(0, 0);
                  }
                }}
                isDarkMode={dark}
              />
            )}
            {screen === "step2" && (
              <Step2Sound
                config={draft}
                onChange={(partial) => setDraft((p) => ({ ...p, ...partial }))}
                onBack={() =>
                  navigate(config.hasCompletedSetup ? "settings" : "step1")
                }
                onComplete={save}
                onTriggerTestNotification={() => test()}
                onTestSystemSound={() => test(true)}
                onOpenSettings={openSystemSettings}
                status={status}
                isDarkMode={dark}
                busy={busy}
              />
            )}
            {screen === "settings" && (
              <SettingsScreen
                config={config}
                onBack={() => navigate("home")}
                onEditSchedule={() => edit("step1")}
                onEditSound={() => edit("step2")}
                onToggleEnabled={toggleEnabled}
                appearance={appearance}
                onAppearanceChange={setAppearance}
                isDarkMode={dark}
              />
            )}
            {screen === "home" && (
              <HomeScreen
                config={config}
                onOpenSettings={() => navigate("settings")}
                onDrinkGlass={() =>
                  setConfig((p) => {
                    const today = resetDay(p);
                    return {
                      ...today,
                      remainingGlasses: Math.max(0, today.remainingGlasses - 1),
                      lastDrinkTime: new Date().toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }),
                    };
                  })
                }
                onFixUnauthorized={openSystemSettings}
                nextReminderAt={status?.nextReminderAt}
                pendingCount={status?.pendingCount}
                planHealthy={status?.planHealthy}
                isDarkMode={dark}
              />
            )}
          </fieldset>
        )}
        {screen === "step1" && !config.hasCompletedSetup && !isIPhoneApp && (
          <button
            onClick={() => {
              const preview = { ...config, hasCompletedSetup: true };
              setConfig(preview);
              setDraft(preview);
              navigate("home");
            }}
            className="min-h-11 text-xs underline mx-6 mb-6"
            style={{ color: t.textSecondary }}
          >
            预览首页（不会启用通知）
          </button>
        )}
      </div>
    </div>
  );
}
