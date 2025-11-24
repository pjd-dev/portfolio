import { styled } from "@/stitches.config";

export const FormCard = styled("form", {
  position: "relative",
  width: "100%",
  maxHeight: "70vh", // the “card has a max height” part
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
  gap: "0.75rem",
  padding: "0.75rem",
  borderRadius: "1.75rem",
  // border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(22px)",
  boxShadow: "0 10px 38px rgba(0,0,0,0.30), 0 10px 20px rgba(0,0,0,0.22)",
  glass: true,
  overflow: "hidden",
});
