"use client";

import { BarRoot, Thumb, Track } from "../ui";

type BarProps = {
  visible: boolean;
  sizePct: number;
  offsetPct: number;
};

export function Bar({ visible, sizePct, offsetPct }: BarProps) {
  if (!visible) return null;

  return (
    <BarRoot>
      <Track>
        <Thumb
          style={{
            height: `${sizePct * 100}%`,
            transform: `translateY(${offsetPct * 100}%)`,
          }}
        />
      </Track>
    </BarRoot>
  );
}
