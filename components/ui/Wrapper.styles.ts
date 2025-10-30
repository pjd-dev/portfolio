import { styled } from "@/stitches.config";

export const Wrapper = styled("main", {
  position: "relative",
  height: "calc(100% - var(--footer-height))",
  display: "flex",
  padding: "0 1rem",
  "@md": { padding: "0 2rem" },
  "@lg": { padding: "0 3rem" },
});
