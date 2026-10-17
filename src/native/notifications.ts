import { Capacitor, registerPlugin } from "@capacitor/core";
import type { NativePlan } from "./plan";

export const isIPhoneApp = Capacitor.getPlatform() === "ios";
export interface NativeStatus {
  permission: "prompt" | "granted" | "denied";
  hasPlan: boolean;
  planHealthy: boolean;
  configuration: string;
  paused: boolean;
  pendingCount: number;
  nextReminderAt: number | null;
  soundEnabled: boolean;
  savedSound: string;
  soundResourceAvailable: boolean;
  testReminderAt: number | null;
  soundMigrationNotice?: string;
}
interface NotificationsPlugin {
  status(): Promise<NativeStatus>;
  requestPermission(): Promise<NativeStatus>;
  configure(options: { plan: string; paused: boolean }): Promise<NativeStatus>;
  setPaused(options: { paused: boolean }): Promise<NativeStatus>;
  snooze(): Promise<NativeStatus>;
  test(options: {
    sound: string;
    useSystemSound: boolean;
  }): Promise<NativeStatus>;
  openSettings(): Promise<void>;
  setAppearance(options: {
    appearance: "system" | "light" | "dark";
  }): Promise<void>;
}
const plugin = isIPhoneApp
  ? registerPlugin<NotificationsPlugin>("WaterNotifications")
  : null;
function nativePlugin(): NotificationsPlugin {
  if (!plugin)
    throw new Error(
      "这里是网页预览。请用 Xcode 安装 iPhone 版后开启系统通知。",
    );
  return plugin;
}
export const notifications = {
  setAppearance: (appearance: "system" | "light" | "dark") =>
    nativePlugin().setAppearance({ appearance }),
  status: () => nativePlugin().status(),
  requestPermission: () => nativePlugin().requestPermission(),
  configure: (plan: NativePlan, paused = false) =>
    nativePlugin().configure({ plan: JSON.stringify(plan), paused }),
  setPaused: (paused: boolean) => nativePlugin().setPaused({ paused }),
  test: (sound: string, useSystemSound = false) =>
    nativePlugin().test({ sound, useSystemSound }),
  snooze: () => nativePlugin().snooze(),
  openSettings: () => nativePlugin().openSettings(),
};
