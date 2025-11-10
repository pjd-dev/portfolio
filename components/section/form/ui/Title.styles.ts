import { styled } from "@/stitches.config";

export const Title = styled("h1", {
  fontSize: "2.5rem",
  fontWeight: "700",
  marginBottom: "1rem",
  color: "#000",
  //todo add theme forground color
  "@media (max-width: 768px)": {
    fontSize: "2rem",
  },
});
