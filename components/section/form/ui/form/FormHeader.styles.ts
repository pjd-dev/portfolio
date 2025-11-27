import { styled } from "@/stitches.config";

export const FormHeader = styled("div", {
  position: "sticky",
  top: 0,
  zIndex: 3,
  padding: "1rem 1.25rem",
  glass: true,
  borderRadius: "1.2rem",
  border: "1px solid rgba(var(--foreground-rgb),0.12)",
  backgroundColor: "rgba(var(--background-rgb),0.4)",
  boxShadow: "0 18px 40px rgba(var(--foreground-rgb),0.45)",
  transition: "all 150ms ease",
  variants: {
    condensed: {
      true: {
        paddingTop: "0.5rem",
        paddingBottom: "0.5rem",
        "& p": { opacity: 0, maxHeight: 0 },
      },
      false: {
        "& p": { opacity: 1, maxHeight: 200 },
      },
    },
  },
});
