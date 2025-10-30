import { createStitches } from "@stitches/react";

export const { styled, css, theme, config, getCssText } = createStitches({
  media: {
    // width breakpoints
    sm: "(min-width: 480px)",
    md: "(min-width: 768px)",
    lg: "(min-width: 1024px)",

    // input modality
    fine: "(pointer: fine)", // mouse / trackpad / real desktop
    coarse: "(pointer: coarse)", // touch screens (iPad, phones)

    // orientation
    landscape: "(orientation: landscape)",
    portrait: "(orientation: portrait)",

    // compound tiers:
    desktopLg: "(min-width: 1024px) and (pointer: fine)",
    tabletLg: "(min-width: 1024px) and (pointer: coarse)",
  },
});
