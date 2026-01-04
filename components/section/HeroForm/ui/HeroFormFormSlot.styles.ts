"use client";
import { styled } from "@/stitches.config";

export const HeroFormFormSlot = styled("div", {
  width: "100%",
  maxWidth: "min(100%, 520px)",
  margin: "0 auto",
  "@md": {
    maxWidth: "min(100%, 540px)",
    marginLeft: "auto",
    marginRight: 0,
  },
  "@lg": {
    maxWidth: "min(100%, 600px)",
  },
});
