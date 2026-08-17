import React from "react";
import { Flame } from "lucide-react";
import { TOKENS } from "./theme.js";

// The daily-streak flame, shown on the dashboard and at the top of every
// module's home screen (previously the same block of markup copy-pasted into
// all four of them, each with its own streakIsLive local). A streak that has
// never been started renders nothing at all rather than a hollow "0 days".
export default function StreakChip({ progress }) {
  const { count, lastDate } = progress.streak;
  if (!(count > 0 && lastDate)) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        color: TOKENS.limoncelloDeep,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: 13,
      }}
    >
      <Flame size={15} /> {count} day{count === 1 ? "" : "s"}
    </div>
  );
}
