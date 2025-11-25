import { styled } from "@/stitches.config";

export const Shell = styled("div", {
  width: "100%",
  // maxWidth: "800px",
  margin: "0 auto",
  padding: "2rem",
  display: "flex",
  flexDirection: "column",
  gap: "0",
  alignItems: "center",
  justifyContent: "center",
  // border: "2px solid lightgray",
  // backgroundColor: "darkgray",
  "@md": {
    padding: "1rem",
    flexDirection: "row",
  },
});
