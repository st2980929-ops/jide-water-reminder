import type { SoundType } from "../types/reminder";
const RETIRED_SOUNDS = new Set(["bamboo", "chime", "brook", "shore", "breeze", "birds", "wood"]);
export function canonicalSound(id: string): string {
  return id === "drop" || RETIRED_SOUNDS.has(id) ? "celesta" : id;
}
export const SOUNDS: { id: SoundType; name: string; desc: string; durationSeconds?: number; family?: "nature" }[] = [
  { id: "celesta", name: "清泉水琴", desc: "清澈的水晶琴鸣，柔和而清润" },
  { id: "raindrop", name: "晨雨露滴", desc: "轻轻落下的一滴晨雨", family: "nature" },
  { id: "singingbowl", name: "静谧铜磬", desc: "低沉悠远的金属泛音" },
  { id: "morning", name: "晨光微弦", desc: "温暖的琴弦双音和弦" },
  { id: "ceramic", name: "陶杯轻触", desc: "温润的陶杯共鸣，轻轻散开", durationSeconds: 1.8 },
  { id: "woodland", name: "木纹回响", desc: "低一点、暖一点的木质余响", durationSeconds: 1.8 },
];
export function soundDuration(id: string): number {
  return SOUNDS.find((sound) => sound.id === canonicalSound(id))?.durationSeconds ?? 1.2;
}
export function soundName(id: string) {
  const sound = id.replace(/_(soft|clear)\.wav$/, "");
  if (RETIRED_SOUNDS.has(sound)) return "已移除的提示音";
  return (
    SOUNDS.find((s) => s.id === canonicalSound(sound))?.name ?? "未保存"
  );
}
