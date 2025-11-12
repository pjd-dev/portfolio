import Logo from "@/components/layout/Logo";
import { AppLinkBase } from "@/components/navigation/AppLinkBase";
import { styled } from "@/stitches.config";
export const HeaderRoot = styled("header", {
  position: "absolute",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  top: "1rem",
  right: "1rem",
  gap: "0.5rem",
  zIndex: 50,
  "@md": {
    top: "2rem",
    right: "2rem",
  },
  "@lg": {
    top: "3rem",
    right: "3rem",
  },
});

export const HeaderLogo = styled(Logo, {
  height: "1.5rem",
  width: "1.5rem",
  "@md": {
    height: "3rem",
    width: "3rem",
  },
  "@lg": {
    height: "3.5rem",
    width: "3.5rem",
  },
});

export const HeaderHomeLink = styled(AppLinkBase, {
  glassButton: true,
  borderRadius: "9999px",
  paddingInline: "0.6rem",
  paddingBlock: "0.2rem",
});
