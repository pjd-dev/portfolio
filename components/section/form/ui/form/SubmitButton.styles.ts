import { styled } from "@/stitches.config";
export const SubmitButton = styled("button", {
  borderRadius: "999px",
  padding: "0.55rem 1.4rem",
  fontSize: "0.85rem",
  border: "none",
  cursor: "pointer",
  background: "linear-gradient(135deg, rgba(164,120,255,1), rgba(102,204,255,1))",
  color: "#050509",
  fontWeight: 600,
  transition: "transform 100ms ease, box-shadow 100ms ease",
  "&:hover": { transform: "translateY(-1px)" },
  "&:active": { transform: "translateY(0)" },
});
