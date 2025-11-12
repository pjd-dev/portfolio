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
  // backgroundColor: "rgba(var(--background-rgb), 0.9)",
  color: "rgba(var(--foreground-rgb), 0.95)",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
  transition: "background-color 200ms ease, color 200ms ease",
  userSelect: "none",
  glassButton: true,
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
        color: "rgba(var(--foreground-rgb), 0.65)",
      },
    },
  },
});
