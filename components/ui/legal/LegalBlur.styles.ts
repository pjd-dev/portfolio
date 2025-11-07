// components/ui/legal/LegalBlur.ts
import { styled } from "@/stitches.config";

export const LegalBlur = styled("div", {
  position: "absolute",

  left: 0,
  right: 0,
  height: "24px",
  zIndex: 2,
  pointerEvents: "none",

  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  variants: {
    position: {
      top: {
        top: 0,
        background:
          "linear-gradient(to bottom, rgba(var(--foreground-rgb), 0.05), rgba(var(--foreground-rgb), 0))",
      },
      bottom: {
        bottom: 0,
        background:
          "linear-gradient(to top, rgba(var(--foreground-rgb), 0.05), rgba(var(--foreground-rgb), 0))",
      },
    },
  },
});
