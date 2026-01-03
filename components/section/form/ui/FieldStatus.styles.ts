import { styled } from "@/stitches.config";

export const FieldStatus = styled("span", {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.55rem",
  fontWeight: 700,
  lineHeight: 1,
  color: "rgba(var(--success-rgb), 0.95)",
  background: "rgba(var(--success-rgb), 0.18)",
  border: "1px solid rgba(var(--success-rgb), 0.45)",
  borderRadius: "999px",
  padding: "0.15rem 0.35rem",
  letterSpacing: "0.08em",
});
