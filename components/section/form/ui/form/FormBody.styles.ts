import { styled } from "@/stitches.config";

export const FormBody = styled("div", {
  flex: 1,
  display: "grid",
  gridTemplateColumns: "1.6fr 1fr",
  padding: "2rem 0.55rem",

  gap: "1rem",
  "@media (max-width: 768px)": {
    gridTemplateColumns: "1fr",
  },
});
