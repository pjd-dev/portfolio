import { styled } from "@/stitches.config";

export const Title = styled("h1", {
  fontSize: "1.6rem",
  fontWeight: "700",
  marginBottom: "1rem",
  color: "rgba(var(--background-rgb), 0.96)",
  textTransform: "uppercase",
  textShadow: "0 2px 12px rgba(var(--foreground-rgb), 0.45)",

  "@media (max-width: 768px)": {
    fontSize: "1.5rem",
  },
});
