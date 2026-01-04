import { styled } from "@/stitches.config";

export const TextContent = styled("div", {
  fontSize: "1rem",
  lineHeight: 1.7,
  color: "var(--foreground)",

  "& .prose": {
    maxWidth: "none",
  },

  "@md": {
    fontSize: "1.05rem",
  },
});
