import { styled } from "@/stitches.config";

export const FormBody = styled("div", {
  flex: 1,
  display: "grid",
  gridTemplateColumns: "1fr",
  padding: "1.5rem 0.5rem 1.2rem",
  rowGap: "1.25rem",
  columnGap: "0.9rem",
  "@container form-card (min-width: 520px)": {
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    padding: "2.25rem 0.75rem 1.6rem",
    columnGap: "1rem",
  },
});
