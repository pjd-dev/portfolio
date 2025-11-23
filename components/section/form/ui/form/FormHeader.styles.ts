import { styled } from "@/stitches.config";

export const FormHeader = styled("div", {
  position: "sticky",
  top: 0,
  zIndex: 3,
  padding: "1rem 1.25rem",
  glass: true,
  // background: "rgba(10,10,20,0.85)",
  borderRadius: "1.2rem",
  border: "1px solid rgba(255,255,255,0.12)",
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
