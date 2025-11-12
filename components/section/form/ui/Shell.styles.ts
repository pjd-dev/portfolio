import { styled } from "@/stitches.config";

export const Shell = styled("div", {
  width: "100%",
  // maxWidth: "800px",
  margin: "0 auto",
  // padding: "2rem",
  backgroundColor: "darkgray",
  "@media (max-width: 768px)": {
    padding: "1rem",
  },
});
