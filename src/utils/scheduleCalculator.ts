import { ReminderConfig, ScheduleCalculation, HomeDisplayState } from '../types/reminder';

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function formatTimeMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function formatMinutesToTime(mins: number): string {
  const normalized = (mins + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60).toString().padStart(2, '0');
  const m = (normalized % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function generateNaturalSummary(config: ReminderConfig): string {
  let daysPart = '';
  if (config.mode === 'everyday') {
    daysPart = '每天';
  } else if (config.mode === 'workday') {
    const sorted = [...config.workdays].sort();
    if (sorted.length === 5 && sorted.every((d, i) => d === i + 1)) {
      daysPart = '周一至周五';
    } else if (sorted.length === 7) {
      daysPart = '每周每日';
    } else if (sorted.length === 0) {
      daysPart = '未选工作日';
    } else {
      daysPart = sorted.map(d => WEEKDAY_NAMES[d % 7]).join('、');
    }
  } else {
    daysPart = `已选 ${config.specificDates.length} 个日期`;
  }

  const timePart = `${config.startTime}–${config.endTime}`;
  const intervalPart = `每 ${config.intervalMinutes} 分钟提醒`;
  const restPart = config.hasLunchBreak ? `；${config.lunchStart}–${config.lunchEnd} 休息` : '';

  return `${daysPart}，${timePart}，${intervalPart}${restPart}。`;
}

export function calculateSchedule(
  config: ReminderConfig,
  customSimulatedTime?: { time: string; dayOfWeek: number; dateString: string },
  forcedState?: HomeDisplayState | null
): ScheduleCalculation {
  // Check validity
  const startMins = formatTimeMinutes(config.startTime);
  const endMins = formatTimeMinutes(config.endTime);
  const isOvernight = endMins <= startMins;

  if (startMins >= endMins && !isOvernight) {
    return {
      state: 'invalid_schedule',
      statusHeadline: '提醒时间设置有冲突',
      nextReminderText: '请调整开始或结束时间',
      summaryText: '开始时间不能晚于或等于结束时间',
      stateBadgeLabel: '设置无效',
      canPause: false,
    };
  }

  if (config.hasLunchBreak) {
    const lStart = formatTimeMinutes(config.lunchStart);
    const lEnd = formatTimeMinutes(config.lunchEnd);
    if (lStart >= lEnd) {
      return {
        state: 'invalid_schedule',
        statusHeadline: '午休时间设置有误',
        nextReminderText: '请调整午休时间段',
        summaryText: '午休开始时间不能晚于结束时间',
        stateBadgeLabel: '设置无效',
        canPause: false,
      };
    }
  }

  // If reviewer forced a specific state to inspect
  if (forcedState) {
    return getForcedStateCalculation(forcedState, config);
  }

  // Notification authorization check
  if (config.notificationPermission !== 'granted') {
    return {
      state: 'unauthorized',
      statusHeadline: '通知权限未开启',
      nextReminderText: '无法在后台送达提醒',
      summaryText: generateNaturalSummary(config),
      stateBadgeLabel: '权限受限',
      canPause: false,
    };
  }

  // Paused today check
  if (config.isPausedToday) {
    return {
      state: 'paused',
      statusHeadline: '今日提醒已暂停',
      nextReminderText: `明天 ${config.startTime} 自动恢复`,
      summaryText: generateNaturalSummary(config),
      stateBadgeLabel: '今日暂停',
      canPause: false,
    };
  }

  // Determine date and time
  const now = new Date();
  const currentMinutes = customSimulatedTime
    ? formatTimeMinutes(customSimulatedTime.time)
    : now.getHours() * 60 + now.getMinutes();

  const currentDayOfWeek = customSimulatedTime ? customSimulatedTime.dayOfWeek : now.getDay();
  const currentDateStr = customSimulatedTime
    ? customSimulatedTime.dateString
    : now.toISOString().slice(0, 10);

  // Check if today is a scheduled day
  let isTodayScheduled = false;
  if (config.mode === 'everyday') {
    isTodayScheduled = true;
  } else if (config.mode === 'workday') {
    // 0 is Sunday, 1 is Monday ...
    const adjustedDay = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
    isTodayScheduled = config.workdays.includes(adjustedDay);
  } else if (config.mode === 'specific_dates') {
    isTodayScheduled = config.specificDates.includes(currentDateStr);

    // check if all specific dates have passed
    const allPassed = config.specificDates.every(d => d < currentDateStr);
    if (config.specificDates.length === 0 || allPassed) {
      return {
        state: 'all_dates_passed',
        statusHeadline: '所选提醒日期已全部结束',
        nextReminderText: '暂无进行中的提醒日程',
        summaryText: '前往「修改安排」添加新日期',
        stateBadgeLabel: '日程已完成',
        canPause: false,
      };
    }
  }

  if (!isTodayScheduled) {
    let nextDayName = '下一个安排日';
    if (config.mode === 'workday') {
      nextDayName = '周一';
    }
    return {
      state: 'not_today',
      statusHeadline: '今天不在提醒日期内',
      nextReminderText: `下次提醒 ${nextDayName} ${config.startTime}`,
      summaryText: generateNaturalSummary(config),
      stateBadgeLabel: '非提醒日',
      canPause: false,
    };
  }

  // Today is scheduled. Check where current time lands:
  // Before start time
  if (currentMinutes < startMins) {
    return {
      state: 'active',
      statusHeadline: '提醒已开启',
      nextReminderText: `下一次 ${config.startTime}`,
      summaryText: generateNaturalSummary(config),
      stateBadgeLabel: '等待开始',
      canPause: true,
    };
  }

  // Inside lunch break
  if (config.hasLunchBreak) {
    const lStart = formatTimeMinutes(config.lunchStart);
    const lEnd = formatTimeMinutes(config.lunchEnd);
    if (currentMinutes >= lStart && currentMinutes < lEnd) {
      return {
        state: 'lunch_break',
        statusHeadline: '正在午休中',
        nextReminderText: `${config.lunchEnd} 恢复提醒`,
        summaryText: generateNaturalSummary(config),
        stateBadgeLabel: '午休静音',
        canPause: true,
      };
    }
  }

  // After end time (Today ended)
  if (currentMinutes >= endMins) {
    const nextLabel = config.mode === 'workday' && currentDayOfWeek === 5 ? '下周一' : '明天';
    return {
      state: 'day_ended',
      statusHeadline: '今日提醒已结束',
      nextReminderText: `下一次 ${nextLabel} ${config.startTime}`,
      summaryText: generateNaturalSummary(config),
      stateBadgeLabel: '今日结束',
      canPause: false,
    };
  }

  // In active hours: calculate the next reminder interval slot
  const elapsedSinceStart = currentMinutes - startMins;
  const interval = config.intervalMinutes;
  const nextSlotNumber = Math.floor(elapsedSinceStart / interval) + 1;
  let nextMins = startMins + nextSlotNumber * interval;

  // If next slot falls into lunch break, push to lunchEnd
  if (config.hasLunchBreak) {
    const lStart = formatTimeMinutes(config.lunchStart);
    const lEnd = formatTimeMinutes(config.lunchEnd);
    if (nextMins >= lStart && nextMins < lEnd) {
      nextMins = lEnd;
    }
  }

  if (nextMins > endMins) {
    const nextLabel = config.mode === 'workday' && currentDayOfWeek === 5 ? '下周一' : '明天';
    return {
      state: 'day_ended',
      statusHeadline: '今日提醒已结束',
      nextReminderText: `下一次 ${nextLabel} ${config.startTime}`,
      summaryText: generateNaturalSummary(config),
      stateBadgeLabel: '今日结束',
      canPause: false,
    };
  }

  const nextTimeStr = formatMinutesToTime(nextMins);
  return {
    state: 'active',
    statusHeadline: '提醒已开启',
    nextReminderText: `下一次 ${nextTimeStr}`,
    summaryText: generateNaturalSummary(config),
    stateBadgeLabel: '正常运行',
    canPause: true,
  };
}

function getForcedStateCalculation(state: HomeDisplayState, config: ReminderConfig): ScheduleCalculation {
  const summary = generateNaturalSummary(config);
  switch (state) {
    case 'active':
      return {
        state: 'active',
        statusHeadline: '提醒已开启',
        nextReminderText: '下一次 14:30',
        summaryText: summary,
        stateBadgeLabel: '正常运行',
        canPause: true,
      };
    case 'lunch_break':
      return {
        state: 'lunch_break',
        statusHeadline: '正在午休中',
        nextReminderText: `${config.lunchEnd} 恢复提醒`,
        summaryText: summary,
        stateBadgeLabel: '午休静音',
        canPause: true,
      };
    case 'day_ended':
      return {
        state: 'day_ended',
        statusHeadline: '今日提醒已结束',
        nextReminderText: `明天 ${config.startTime} 开启`,
        summaryText: summary,
        stateBadgeLabel: '今日结束',
        canPause: false,
      };
    case 'paused':
      return {
        state: 'paused',
        statusHeadline: '今日提醒已暂停',
        nextReminderText: `明天 ${config.startTime} 自动恢复`,
        summaryText: summary,
        stateBadgeLabel: '今日暂停',
        canPause: false,
      };
    case 'not_today':
      return {
        state: 'not_today',
        statusHeadline: '今天不在提醒日期内',
        nextReminderText: `周一 ${config.startTime} 开启`,
        summaryText: summary,
        stateBadgeLabel: '非提醒日',
        canPause: false,
      };
    case 'all_dates_passed':
      return {
        state: 'all_dates_passed',
        statusHeadline: '所选日期全部结束',
        nextReminderText: '暂无进行中的提醒日程',
        summaryText: '请前往「修改安排」添加新日期',
        stateBadgeLabel: '日期已过',
        canPause: false,
      };
    case 'unauthorized':
      return {
        state: 'unauthorized',
        statusHeadline: '通知权限未开启',
        nextReminderText: '当前无法在后台发送通知',
        summaryText: summary,
        stateBadgeLabel: '权限受限',
        canPause: false,
      };
    case 'invalid_schedule':
      return {
        state: 'invalid_schedule',
        statusHeadline: '时间设置有冲突',
        nextReminderText: '开始时间晚于结束时间',
        summaryText: '请检查并重新调整时间范围',
        stateBadgeLabel: '设置冲突',
        canPause: false,
      };
  }
}
