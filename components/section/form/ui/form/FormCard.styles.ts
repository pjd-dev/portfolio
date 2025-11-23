import { styled } from "@/stitches.config";

export const FormCard = styled("form", {
  position: "relative",
  width: "100%",
  maxHeight: "70vh",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  padding: "0.75rem",
  borderRadius: "1.75rem",
  border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(22px)",
  glass: true,
  // background: "var(--foreground)",
  overflow: "hidden",
});
