import { styled } from "@/stitches.config";

export const CtaGroup = styled("div", {
  display: "flex",
  gap: "1rem",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",

  "@portrait": {
    "@md": {
      gap: "2rem",
      flexDirection: "column",
      justifyContent: "end",
      alignItems: "stretch",
    },
  },
  // "@lg": { gap: "3rem" },
});
