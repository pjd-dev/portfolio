"use client";
import { styled } from "@/stitches.config";
import Image from "next/image";

export const ParallaxImgContainer = styled("div", {
  position: "relative",
  width: "min(80vw, 560px)",
  aspectRatio: "3 / 4",
  userSelect: "none",
  pointerEvents: "none",
});

export const ParallaxImg = styled(Image, {
  heroFigure: true,
});
