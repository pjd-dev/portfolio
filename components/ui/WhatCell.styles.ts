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
  containerType: "size",
  // backgroundColor: "DarkCyan",
  "@md": {
    // padding: "3rem 2rem",
    containerType: "inline-size",
    // backgroundColor: "teal",
  },
  "@lg": {
    // padding: "3rem 3rem",
    // backgroundColor: "MediumSeaGreen",
  },
});
