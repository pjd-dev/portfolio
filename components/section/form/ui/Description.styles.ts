import { styled } from "@/stitches.config";

export const Description = styled("p", {
  fontSize: "1.125rem",
  color: "rgba(var(--background-rgb), 0.86)",
  // marginBottom: "2rem",
  lineHeight: "1.6",
  textShadow: "0 2px 10px rgba(var(--foreground-rgb), 0.35)",

  "@media (max-width: 768px)": {
    fontSize: "1rem",
  },
});
