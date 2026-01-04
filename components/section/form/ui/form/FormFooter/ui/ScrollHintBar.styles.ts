"use client";

import { styled } from "@/stitches.config";

import { BarBase } from "./BarBase.styles";
export const ScrollHintBar = styled(BarBase, {
  color: "rgba(var(--background-rgb),0.7)",
  justifyContent: "center",
  textAlign: "center",
  minHeight: "2rem",
  paddingBlock: "0.35rem",
  transition: "opacity 180ms ease, transform 180ms ease",
  variants: {
    visible: {
      true: {
        opacity: 1,
        transform: "translateY(0)",
        pointerEvents: "auto",
        visibility: "visible",
        maxHeight: "2rem",
        paddingBlock: "0.35rem",
      },
      false: {
        opacity: 0,
        transform: "translateY(2px)",
        pointerEvents: "none",
        visibility: "hidden",
        maxHeight: "2rem",
        paddingBlock: "0.35rem",
      },
    },
  },
});
