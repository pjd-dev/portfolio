import { styled } from "@/stitches.config";

export const Description = styled("p", {
  fontSize: "1.125rem",
  color: "#666",
  marginBottom: "2rem",
  lineHeight: "1.6",

  "@media (max-width: 768px)": {
    fontSize: "1rem",
  },
});
