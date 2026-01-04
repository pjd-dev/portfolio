import { styled } from "@/stitches.config";

export const FormHeader = styled("div", {
  position: "sticky",
  top: 0,
  zIndex: 3,
  padding: "1rem 1.25rem",
  glass: true,
  borderRadius: "1.2rem",
  border: "1px solid rgba(var(--foreground-rgb),0.18)",
  backgroundImage:
    "linear-gradient(180deg, rgba(var(--foreground-rgb),0.6) 0%, rgba(var(--foreground-rgb),0.28) 100%)",
  boxShadow: "0 16px 32px rgba(var(--foreground-rgb),0.35)",
  backdropFilter: "blur(18px)",
  transition: "padding 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
  overflow: "hidden",
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
