import { styled } from "@/stitches.config";

export const FormAlert = styled("div", {
  marginTop: "0.85rem",
  borderRadius: "1rem",
  border: "1px solid rgba(var(--foreground-rgb),0.22)",
  backgroundImage:
    "linear-gradient(180deg, rgba(var(--foreground-rgb),0.6) 0%, rgba(var(--foreground-rgb),0.45) 100%)",
  boxShadow:
    "0 12px 26px rgba(var(--foreground-rgb),0.32), 0 0 0 1px rgba(var(--foreground-rgb),0.1) inset",
  padding: "0.75rem 0.85rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
});

export const FormAlertTitle = styled("div", {
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "rgba(var(--background-rgb),0.85)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
});

export const FormAlertList = styled("div", {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
});

export const FormAlertItem = styled("button", {
  appearance: "none",
  background: "transparent",
  border: "1px solid rgba(var(--foreground-rgb),0.22)",
  borderRadius: "0.85rem",
  padding: "0.4rem 0.6rem",
  fontSize: "0.7rem",
  color: "rgba(var(--background-rgb),0.85)",
  textAlign: "left",
  display: "flex",
  alignItems: "baseline",
  gap: "0.45rem",
  flexWrap: "wrap",
  cursor: "pointer",
  transition: "background 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
  "& span:first-child": {
    fontWeight: 600,
  },
  "&:hover": {
    background: "rgba(var(--foreground-rgb),0.28)",
    borderColor: "rgba(var(--background-rgb),0.4)",
    transform: "translateY(-1px)",
  },
});
