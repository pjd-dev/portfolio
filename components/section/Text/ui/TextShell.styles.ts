import { styled } from "@/stitches.config";

export const TextShell = styled("div", {
  width: "100%",
  maxWidth: "60rem",
  borderRadius: "2rem",
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  color: "var(--foreground)",
  glass: true,
  boxShadow:
    "0 18px 40px rgba(var(--foreground-rgb),0.18), 0 0 0 1px rgba(var(--foreground-rgb),0.08) inset",

  "@md": {
    padding: "2.5rem 3rem",
  },

  variants: {
    variant: {
      default: {},
      muted: {
        backgroundColor: "rgba(var(--foreground-rgb),0.05)",
        boxShadow: "0 8px 20px rgba(var(--foreground-rgb),0.12)",
      },
      small: {
        padding: "1.5rem",
        gap: "1rem",
      },
      legal: {
        backgroundColor: "rgba(var(--foreground-rgb),0.06)",
      },
    },
  },

  defaultVariants: {
    variant: "default",
  },
});
