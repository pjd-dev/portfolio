import { styled } from "@/stitches.config";

export const Switch = styled("button", {
  height: 24,
  paddingLeft: 8,
  paddingRight: 8,
  borderRadius: 9999,
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 1,
  letterSpacing: "0.06em",
  // make it solid enough for contrast
  backgroundColor: "rgba(var(--background-rgb), 0.9)",
  color: "rgba(var(--foreground-rgb), 0.95)",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
  transition: "background-color 200ms ease, color 200ms ease",
  userSelect: "none",
  border: "1px solid rgba(var(--foreground-rgb), 0.15)",

  "&:hover": {
    backgroundColor: "rgba(var(--background-rgb), 1)",
  },

  "&:focus-visible": {
    outline: "2px solid rgba(var(--foreground-rgb), 0.95)",
    outlineOffset: 2,
  },

  "& .split": {
    color: "rgba(var(--foreground-rgb), 0.65)", // ≥3:1 vs light bg
    paddingLeft: 2,
    paddingRight: 2,
  },

  variants: {
    active: {
      true: {
        backgroundColor: "rgba(var(--foreground-rgb), 0.12)",
        color: "rgba(var(--foreground-rgb), 1)",
        borderColor: "rgba(var(--foreground-rgb), 0.3)",
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: "none",
      },
    },
  },
});

export const SwitchPart = styled("span", {
  paddingLeft: 2,
  paddingRight: 2,

  variants: {
    active: {
      true: {
        color: "rgba(var(--foreground-rgb), 1)",
      },
      false: {
        // 0.4 → 0.65 to pass
        color: "rgba(var(--foreground-rgb), 0.65)",
      },
    },
  },
});
