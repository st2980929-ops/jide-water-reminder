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
}
interface NotificationsPlugin {
  status(): Promise<NativeStatus>;
  requestPermission(): Promise<NativeStatus>;
  configure(options: { plan: string }): Promise<NativeStatus>;
  setPaused(options: { paused: boolean }): Promise<NativeStatus>;
  snooze(): Promise<NativeStatus>;
  test(options: { sound: string }): Promise<NativeStatus>;
  openSettings(): Promise<void>;
  setAppearance(options: { dark: boolean }): Promise<void>;
}
const plugin = isIPhoneApp
  ? registerPlugin<NotificationsPlugin>("WaterNotifications")
  : null;
function nativePlugin(): NotificationsPlugin {
  if (!plugin) throw new Error("这里是网页预览。请用 Xcode 安装 iPhone 版后开启系统通知。");
  return plugin;
}
export const notifications = {
  setAppearance: (dark: boolean) => nativePlugin().setAppearance({ dark }),
  status: () => nativePlugin().status(),
  requestPermission: () => nativePlugin().requestPermission(),
  configure: (plan: NativePlan) => nativePlugin().configure({ plan: JSON.stringify(plan) }),
  setPaused: (paused: boolean) => nativePlugin().setPaused({ paused }),
  test: (sound: string) => nativePlugin().test({ sound }),
  snooze: () => nativePlugin().snooze(),
  openSettings: () => nativePlugin().openSettings(),
};
