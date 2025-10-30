import { styled } from "@/stitches.config";

export const Switch = styled("button", {
  height: 24,
  paddingLeft: 8,
  paddingRight: 8,
  borderRadius: 9999,
  fontSize: 9,
  fontWeight: 500,
  lineHeight: 1,
  letterSpacing: "0.06em",
  color: "rgba(var(--foreground-rgb), 0.4)",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)",
  transition: "background-color 300ms ease-in-out, color 300ms ease-in-out",
  userSelect: "none",
  "&:hover": {
    cursor: "pointer",
  },
  "& .split": {
    color: "rgba(var(--foreground-rgb), 0.4)",
    paddingLeft: 2,
    paddingRight: 2,
  },

  variants: {
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
        color: "rgba(var(--foreground-rgb), 0.9)",
      },
      false: {
        color: "rgba(var(--foreground-rgb), 0.4)",
      },
    },
  },
});
