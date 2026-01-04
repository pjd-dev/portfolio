import { styled } from "@/stitches.config";

export const ScrollAssistRoot = styled("div", {
  position: "fixed",
  right: "1.25rem",
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.75rem",
  zIndex: 40,
  pointerEvents: "none",

  "@md": {
    right: "2rem",
  },
});

export const ScrollDots = styled("div", {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.6rem 0.5rem",
  borderRadius: "999px",
  backgroundColor: "rgba(var(--foreground-rgb),0.08)",
  border: "1px solid rgba(var(--foreground-rgb),0.18)",
  boxShadow: "0 8px 20px rgba(var(--foreground-rgb),0.22)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
});

export const ScrollDot = styled("span", {
  width: "6px",
  height: "6px",
  borderRadius: "999px",
  backgroundColor: "rgba(var(--foreground-rgb),0.4)",
  border: "1px solid rgba(var(--foreground-rgb),0.45)",
  transition: "transform 150ms ease, background 150ms ease, border-color 150ms ease",
  variants: {
    active: {
      true: {
        backgroundColor: "rgba(var(--foreground-rgb),0.95)",
        borderColor: "rgba(var(--foreground-rgb),0.9)",
        transform: "scale(1.25)",
        boxShadow: "0 0 0 4px rgba(var(--foreground-rgb),0.16)",
      },
    },
  },
});

export const ScrollTopButton = styled("button", {
  position: "fixed",
  right: "1.25rem",
  bottom: "2rem",
  padding: "0.55rem 0.85rem",
  borderRadius: "999px",
  fontSize: "0.65rem",
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--foreground)",
  backgroundColor: "rgba(var(--foreground-rgb),0.08)",
  border: "1px solid rgba(var(--foreground-rgb),0.2)",
  boxShadow:
    "0 10px 22px rgba(var(--foreground-rgb),0.2), 0 0 0 1px rgba(var(--foreground-rgb),0.08) inset",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  transition: "opacity 160ms ease, transform 160ms ease",
  zIndex: 40,

  variants: {
    visible: {
      true: {
        opacity: 1,
        transform: "translateY(0)",
        pointerEvents: "auto",
      },
      false: {
        opacity: 0,
        transform: "translateY(6px)",
        pointerEvents: "none",
      },
    },
  },

  defaultVariants: {
    visible: false,
  },

  "@md": {
    right: "2rem",
  },

  "@media (prefers-reduced-motion: reduce)": {
    transition: "none",
  },
});
