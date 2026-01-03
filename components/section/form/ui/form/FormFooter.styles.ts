import { styled } from "@/stitches.config";

export const FormFooter = styled("div", {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0.7rem 0.85rem",
  borderRadius: "1rem",
  glass: true,
  marginTop: "0.25rem",
  border: "1px solid rgba(var(--foreground-rgb),0.16)",
  backgroundImage:
    "linear-gradient(180deg, rgba(var(--foreground-rgb),0.28) 0%, rgba(var(--foreground-rgb),0.16) 100%)",
  boxShadow:
    "0 12px 26px rgba(var(--foreground-rgb),0.28), 0 0 0 1px rgba(var(--foreground-rgb),0.08) inset",
});
