import { styled } from "@/stitches.config";

export const Title = styled("h1", {
  fontSize: "1.6rem",
  fontWeight: "700",
  marginBottom: "1rem",
  color: "var(--background)",
  textTransform: "uppercase",

  "@media (max-width: 768px)": {
    fontSize: "1.5rem",
  },
});
