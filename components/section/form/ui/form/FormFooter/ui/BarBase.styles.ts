"use client";

import { styled } from "@/stitches.config";
export const BarBase = styled("div", {
  overflow: "hidden",
  borderRadius: "999px",
  border: "1px solid transparent",
  backgroundColor: "rgba(var(--foreground-rgb),0.9)",
  paddingInline: "0.85rem",
  fontSize: "0.7rem",
  lineHeight: 1.3,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  transition: "max-height 180ms ease, padding 180ms ease, opacity 180ms ease",
  color: "var(--background)",
  variants: {
    visible: {
      true: {
        maxHeight: "2rem",
        paddingBlock: "0.35rem",
        opacity: 1,
        borderColor: "rgba(var(--background-rgb),0.06)",
      },
      false: {
        maxHeight: 0,
        paddingBlock: 0,
        opacity: 0,
        borderColor: "transparent",
      },
    },
  },

  defaultVariants: {
    visible: false,
  },
});
