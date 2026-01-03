import { styled } from "@/stitches.config";

// FormCard.styles.ts
export const FormCard = styled("form", {
  position: "relative",
  width: "100%",
  maxHeight: "80svh",

  display: "flex",
  flexDirection: "column",

  gap: "1rem",
  padding: 0,
  borderRadius: "2rem",

  backdropFilter: "blur(26px)",
  glass: true,
  boxShadow:
    "0 12px 28px rgba(var(--foreground-rgb),0.38), 0 2px 0 rgba(var(--background-rgb),0.08) inset, 0 0 0 1px rgba(var(--foreground-rgb),0.2) inset",

  background:
    "linear-gradient(180deg, rgba(var(--foreground-rgb),0.92) 0%, rgba(var(--foreground-rgb),0.78) 100%)",
  border: "1px solid rgba(var(--foreground-rgb),0.22)",
  overflow: "hidden",
  transition: "transform 180ms ease, box-shadow 180ms ease, background 180ms ease",

  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(120% 60% at 50% 0%, rgba(var(--background-rgb),0.18) 0%, rgba(var(--background-rgb),0) 60%)",
    opacity: 0.7,
    pointerEvents: "none",
  },

  "& > *": {
    position: "relative",
    zIndex: 1,
  },

  "&:focus-within": {
    borderColor: "rgba(var(--background-rgb),0.35)",
    background:
      "linear-gradient(180deg, rgba(var(--foreground-rgb),0.96) 0%, rgba(var(--foreground-rgb),0.82) 100%)",
    boxShadow:
      "0 14px 34px rgba(var(--foreground-rgb),0.42), 0 0 0 1px rgba(var(--background-rgb),0.22) inset, 0 0 0 3px rgba(var(--background-rgb),0.18)",
  },

  "@media (pointer: fine)": {
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow:
        "0 16px 38px rgba(var(--foreground-rgb),0.42), 0 2px 0 rgba(var(--background-rgb),0.12) inset, 0 0 0 1px rgba(var(--foreground-rgb),0.25) inset",
    },
  },

  "@media (max-width: 768px)": {
    padding: 0,
    borderRadius: "1.5rem",
    maxHeight: "none",
  },

  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",
    transform: "none",
  },
});
