export type ScheduleMode = 'everyday' | 'workday' | 'specific_dates';

export type SoundType =
  | 'celesta'     // 清泉水琴
  | 'bamboo'      // 空灵竹韵
  | 'chime'       // 短风铃
  | 'raindrop'    // 晨雨露滴
  | 'singingbowl' // 静谧铜磬
  | 'morning'     // 晨光微弦
  | 'drop' | 'wood'; // 兼容兼容项
export type LoudnessLevel = 'soft' | 'clear';

export interface ReminderConfig {
  mode: ScheduleMode;
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  intervalMinutes: number; // 30, 45, 60, 90, 120
  hasLunchBreak: boolean;
  lunchStart: string; // "12:00"
  lunchEnd: string;   // "13:30"
  workdays: number[]; // 1 = Monday, 2 = Tuesday, ... 5 = Friday
  specificDates: string[]; // ["2026-10-16", "2026-10-17"]
  sound: SoundType;
  loudness: LoudnessLevel;
  notificationPermission: 'granted' | 'denied' | 'prompt';
  isPausedToday: boolean; // Legacy key: persistent pause until the user resumes.
  pausedUntilDate?: string;
  hasCompletedSetup: boolean;
  remainingGlasses: number;    // 今日剩余未喝杯数
  totalDailyGlasses: number;   // 今日总目标杯数（默认8杯）
  snoozeUntilTime: string | null; // 暂缓提醒时间（点「现在还不渴」后10分钟）
  drinkDate?: string; // Local date of optional cup records.
  lastDrinkTime: string | null;   // 上次喝水时间
}

export type HomeDisplayState =
  | 'active'              // 正常提醒中
  | 'lunch_break'         // 正在午休中，显示恢复时间
  | 'day_ended'           // 今日已结束，显示下次提醒
  | 'paused'              // 今日暂停，显示恢复提醒按钮
  | 'not_today'           // 今天不在提醒日期内
  | 'all_dates_passed'    // 所选日期全部结束
  | 'unauthorized'        // 通知未授权或已关闭
  | 'invalid_schedule';   // 时间设置冲突

export interface ScheduleCalculation {
  state: HomeDisplayState;
  statusHeadline: string;
  nextReminderText: string;
  summaryText: string;
  stateBadgeLabel: string;
  canPause: boolean;
}
