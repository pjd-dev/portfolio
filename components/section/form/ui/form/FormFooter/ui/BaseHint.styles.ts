// components/section/form/ui/FormFooter.tsx
"use client";

import { styled } from "@/stitches.config";

export const BaseHint = styled("div", {
  flex: 1,
  minWidth: 0,
  fontSize: "0.7rem",
  color: "rgba(var(--background-rgb),0.6)",

  "@bp1": {
    order: 2,
  },
});
