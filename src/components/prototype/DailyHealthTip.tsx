import React, { useEffect, useState } from "react";
import { dailyHealthTip, millisecondsToNextDay } from "../../utils/healthTips";

export function DailyHealthTip({ color }: { color: string }) {
  const [tip, setTip] = useState(() => dailyHealthTip());
  useEffect(() => {
    let timer: number;
    const refresh = () => {
      const now = new Date();
      setTip(dailyHealthTip(now));
      window.clearTimeout(timer);
      timer = window.setTimeout(refresh, millisecondsToNextDay(now) + 50);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return (
    <p role="note" aria-label="每日健康小知识" className="text-sm leading-6 mb-6 max-w-72 min-h-12 flex items-center justify-center" style={{ color }}>
      {tip}
    </p>
  );
}
