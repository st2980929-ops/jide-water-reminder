import React, { useEffect, useRef, useState } from "react";
import type { ReminderConfig } from "./types/reminder";
import { Step1Schedule } from "./components/prototype/Step1Schedule";
import { Step2Sound } from "./components/prototype/Step2Sound";
import { HomeScreen } from "./components/prototype/HomeScreen";
import { Sun, Moon, X } from "lucide-react";
import { getThemeTokens } from "./utils/theme";
import { compilePlan, dateKey } from "./native/plan";
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
  const [screen, setScreen] = useState<"step1" | "step2" | "home">(
    config.hasCompletedSetup ? "home" : "step1",
  );
  const [status, setStatus] = useState<NativeStatus | null>(null);
  const [ready, setReady] = useState(!isIPhoneApp),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const generation = useRef(0);
  const operation = useRef(false),
    t = getThemeTokens(dark);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen, message]);
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
    if (isIPhoneApp) void notifications.setAppearance(dark).catch(() => {});
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    document.documentElement.style.backgroundColor = t.background;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", t.background);
  }, [dark, t.background]);
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
        if (initial && value.hasPlan) {
          const saved = JSON.parse(value.configuration) as ReminderConfig;
          const local = resetDay(readLocal());
          const loaded = {
            ...DEFAULT_CONFIG,
            ...saved,
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
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };
  const permission = async () => {
    const current = await notifications.requestPermission();
    applyStatus(current);
    if (current.permission !== "granted")
      throw new Error("请在 iPhone 设置中允许通知，然后再启用提醒。");
    return current;
  };
  const save = () =>
    void run(async () => {
      const next = {
        ...draft,
        hasCompletedSetup: true,
        isPausedToday: false,
        notificationPermission: "granted" as const,
        snoozeUntilTime: null,
      };
      const plan = compilePlan(next);
      await permission();
      const installed = await notifications.configure(plan);
      setConfig(resetDay(next));
      setDraft(next);
      applyStatus(installed);
      setScreen("home");
      setMessage("提醒安排已保存。可以关闭 App，iPhone 会按安排提醒。");
    });
  const test = () =>
    void run(async () => {
      const plan = compilePlan({ ...draft, mode: "everyday" });
      await permission();
      applyStatus(await notifications.test(plan.sound));
      setMessage("测试提醒将在 10 秒后出现。现在可以锁屏听一听。");
    });
  const edit = (page: "step1" | "step2") => {
    setDraft(config);
    setScreen(page);
    setMessage("");
  };
  return (
    <div
      className="app-shell"
      style={{ backgroundColor: t.background, color: t.textPrimary }}
    >
      <div className="app-content">
        <div className="flex items-center justify-between px-6 pt-2 min-h-11">
          <span className="text-xs" style={{ color: t.textSecondary }}>
            {isIPhoneApp
              ? "留一点时间，喝口水。"
              : "网页预览 · 系统通知需安装 iPhone 版"}
          </span>
          <button
            aria-label={dark ? "切换浅色" : "切换深色"}
            onClick={() => setDark(!dark)}
            className="w-11 h-11 flex items-center justify-center"
            style={{ color: t.accent }}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
        {message && (
          <div
            role="status"
            className="mx-6 my-3 p-3 rounded-xl border flex items-start gap-2 text-sm leading-relaxed"
            style={{ backgroundColor: t.surface, borderColor: t.separator }}
          >
            <span className="flex-1">{message}</span>
            <button
              aria-label="关闭提示"
              onClick={() => setMessage("")}
              className="min-w-11 min-h-11 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {!ready ? (
          <p className="p-6 text-sm">正在读取提醒安排…</p>
        ) : (
          <fieldset disabled={busy} className="contents">
            {screen === "step1" && (
              <Step1Schedule
                config={draft}
                onChange={(partial) => setDraft((p) => ({ ...p, ...partial }))}
                onNext={() => {
                  try {
                    compilePlan(draft);
                    setMessage("");
                    setScreen("step2");
                    window.scrollTo(0, 0);
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
                onBack={() => setScreen("step1")}
                onComplete={save}
                onTriggerTestNotification={test}
                onOpenSettings={() =>
                  void run(() => notifications.openSettings())
                }
                isDarkMode={dark}
                busy={busy}
              />
            )}
            {screen === "home" && (
              <HomeScreen
                config={config}
                onEditSchedule={() => edit("step1")}
                onEditSound={() => edit("step2")}
                onTogglePauseToday={() =>
                  void run(async () =>
                    applyStatus(
                      await notifications.setPaused(!config.isPausedToday),
                    ),
                  )
                }
                onTriggerNotification={test}
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
                onFixUnauthorized={() =>
                  void run(() => notifications.openSettings())
                }
                nextReminderAt={status?.nextReminderAt}
                pendingCount={status?.pendingCount}
                planHealthy={status?.planHealthy}
                isDarkMode={dark}
              />
            )}
          </fieldset>
        )}
        {screen !== "home" && (config.hasCompletedSetup || !isIPhoneApp) && (
          <div className="px-6 pb-6 text-center">
            <button
              onClick={() => {
                setDraft(config);
                setScreen("home");
                setMessage("");
              }}
              className="min-h-11 text-sm underline"
              style={{ color: t.textSecondary }}
            >
              {config.hasCompletedSetup
                ? "取消修改，返回首页"
                : !isIPhoneApp
                  ? "预览首页（不会启用通知）"
                  : ""}
            </button>
          </div>
        )}
        {status && status.permission === "granted" && !status.soundEnabled && (
          <p className="px-6 pb-5 text-xs" style={{ color: t.textSecondary }}>
            系统通知声音已关闭，可在 iPhone 设置中开启。
          </p>
        )}
      </div>
    </div>
  );
}
