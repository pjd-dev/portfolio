"use client";

import { styled } from "@/stitches.config";
import { BarBase } from "./BarBase.styles";

export const StatusBarRoot = styled(BarBase, {
  variants: {
    tone: {
      idle: { color: "rgba(var(--background-rgb),0.5)" },
      submitting: { color: "rgba(var(--background-rgb),0.7)" },
      info: { color: "rgba(var(--background-rgb),0.7)" },
      error: { color: "rgba(var(--error-rgb), 0.7)" },
      success: { color: "rgba(var(--success-rgb), 0.7)" },
      validation: { color: "rgba(var(--background-rgb),0.7)" },
    },
  },
  defaultVariants: {
    tone: "idle",
  },
});
