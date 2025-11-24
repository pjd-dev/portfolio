"use client";

import { RefObject } from "react";
import { ScrollbarRoot, ScrollThumb, ScrollTrack } from "../scroll";
import { useFormScrollbar } from "./useScrollbar";

type Props = {
  scrollRef: RefObject<HTMLDivElement | null>;
};

export function FormScrollbar({ scrollRef }: Props) {
  const { visible, sizePct, offsetPct } = useFormScrollbar(scrollRef);

  if (!visible) return null;

  return (
    <ScrollbarRoot>
      <ScrollTrack>
        <ScrollThumb
          style={{
            height: `${sizePct * 100}%`,
            transform: `translateY(${offsetPct * 100}%)`,
          }}
        />
      </ScrollTrack>
    </ScrollbarRoot>
  );
}
