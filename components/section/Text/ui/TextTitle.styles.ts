import { styled } from "@/stitches.config";

export const TextTitle = styled("h2", {
  fontFamily: "var(--font-conde-sans)",
  fontSize: "1.5rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "var(--foreground)",

  "@md": {
    fontSize: "1.75rem",
  },
});
