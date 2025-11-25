// components/form/FormSectionShell.tsx
import { styled } from "@/stitches.config";

/** Section wrapper (anchors, spacing, height control) */
export const FormWrapper = styled("section", {
  position: "relative",
  display: "flex",
  // backgroundColor: "Violet",
  paddingInline: " 1rem",
  // default: no forced height
  "--section-offset": "0px",
  minHeight: "calc( 100svh - var(--footer-height))",
  // maxWidth: "80%",
  alignItems: "center",
  justifyContent: "center",
  "@md": {
    padding: "clamp(1.5rem,4vw, 4rem) 8rem",
  },
});
