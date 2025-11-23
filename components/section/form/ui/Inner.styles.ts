import { styled } from "@/stitches.config";

export const Inner = styled("div", {
  background: "white",
  position: "relative",
  glass: true,
  borderRadius: "22px",
  padding: "3rem",
  maxWidth: "800px",
  width: "100%",
  boxSizing: "border-box",
  overflowY: "auto",
  maxHeight: "80vh",
  margin: "0 auto",
  "@media (max-width: 768px)": {
    padding: "2rem 1.5rem",
  },
});
