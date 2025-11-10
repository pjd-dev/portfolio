"use client";
import { styled } from "@/stitches.config";

export const CtaButton = styled("a", {
  display: "inline-block",
  padding: "0.5rem 1.2rem",
  fontSize: "0.6rem",
  fontWeight: 500,
  textAlign: "center",
  borderRadius: "9999px",
  textDecoration: "none",
  "@md": { fontSize: "0.8rem", padding: "0.5rem 1rem" },
  "@lg": { fontSize: "0.9rem", padding: ".8rem 1rem" },
});
