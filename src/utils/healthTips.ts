// General health education, reviewed 2026-10-18. Claim-to-source mapping:
// HEALTH_TIPS.md. Keep copy short and avoid treating symptoms as a diagnosis.
export const HEALTH_TIPS = [
  "规律补水，有助于减少脱水的风险。",
  "缺水时，人可能更疲倦，也更难集中注意力。",
  "水分充足，有助于身体维持正常体温。",
  "饮水不足，可能让便秘更容易发生。",
  "运动出汗后，身体需要补回流失的水分。",
  "白水没有糖和热量，是日常补水的好选择。",
  "口干、尿量变少，可能是缺水的信号。",
  "用白水替代含糖饮料，能减少糖和热量摄入。",
  "食物里的水分，也算一天的水分摄入。",
  "天热或活动增多时，身体通常需要更多水。",
  "缺水可能引起头痛，也可能让人感到头晕。",
  "每天需要多少水，会随活动量和身体状况变化。",
  "喝水之余，也起身走走，减少连续久坐。",
  "水分参与关节润滑，也帮助身体排出废物。",
] as const;

export function dailyHealthTip(date = new Date()): string {
  // Convert local calendar components to an ordinal; UTC timestamps alone
  // would change the tip at 08:00 in China, and elapsed hours drift over DST.
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return HEALTH_TIPS[((day % HEALTH_TIPS.length) + HEALTH_TIPS.length) % HEALTH_TIPS.length];
}

export function millisecondsToNextDay(date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime() - date.getTime();
}
