import { styled } from "@/stitches.config";

export const FormBody = styled("div", {
  flex: 1,
  display: "grid",
  gridTemplateColumns: "1.6fr 1fr",
  padding: "2.25rem 0.75rem 1.6rem",

  gap: "1.25rem",
  "@media (max-width: 768px)": {
    gridTemplateColumns: "1fr",
    padding: "1.5rem 0.5rem 1.2rem",
  },
});
