import { styled } from "@/stitches.config";

export const WhatCell = styled("div", {
  gridArea: "what",
  minWidth: 0,
  minHeight: 0,
  // overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  justifyContent: "end",
  alignItems: "end",
  padding: "2rem 0",
  containerType: "inline-size",
});
