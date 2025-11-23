import { styled } from "@/stitches.config";

export const Title = styled("h1", {
  fontSize: "2.5rem",
  fontWeight: "700",
  marginBottom: "1rem",
  color: "var(--foreground)",
  textTransform: "uppercase",

  "@media (max-width: 768px)": {
    fontSize: "2rem",
  },
});
