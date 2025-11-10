// src/components/ui/createCtaButton.tsx
import { styled } from "@/stitches.config";
import type { ElementType } from "react";
import { SharedButton } from "./shared";
export function createCtaButton<Base extends ElementType>(Base: Base) {
  return styled(Base, SharedButton);
}

export const CtaAnchor = createCtaButton("a");
