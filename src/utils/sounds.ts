import type { SoundType } from "../types/reminder";
export function canonicalSound(id: string): string {
  return id === "drop" ? "celesta" : id === "wood" ? "bamboo" : id;
}
export const SOUNDS: { id: SoundType; name: string; desc: string }[] = [
  { id: "celesta", name: "清泉水琴", desc: "清澈的水晶琴鸣，柔和而清润" },
  { id: "bamboo", name: "空灵竹韵", desc: "温润的竹管共鸣，带一点空气感" },
  { id: "chime", name: "短风铃", desc: "微风掠过的清透双音" },
  { id: "raindrop", name: "晨雨露滴", desc: "轻轻落下的一滴晨雨" },
  { id: "singingbowl", name: "静谧铜磬", desc: "低沉悠远的金属泛音" },
  { id: "morning", name: "晨光微弦", desc: "温暖的琴弦双音和弦" },
];
export function soundName(id: string) {
  const sound = id.replace(/_(soft|clear)\.wav$/, "");
  return (
    SOUNDS.find((s) => s.id === canonicalSound(sound))?.name ?? "未保存"
  );
}
