import { createStitches } from "@stitches/react";

export const { styled, css, theme, config, getCssText } = createStitches({
  utils: {
    // ✦ Glass surface utility
    glass: () => ({
      background: "rgba(var(--foreground-rgb), 0.08)",
      border: "1px solid rgba(var(--foreground-rgb), 0.18)",
      boxShadow:
        "0 1px 2px rgba(var(--background-rgb), 0.25), 0 0 0 1px rgba(var(--foreground-rgb), 0.05) inset",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      transition: "var(--transition-glass, all 0.25s ease)",
    }),
    // ✦ Glass button utility
    glassButton: () => ({
      background: "rgba(var(--foreground-rgb), 0.08)",
      border: "1px solid rgba(var(--foreground-rgb), 0.18)",
      boxShadow:
        "0 1px 2px rgba(var(--background-rgb), 0.25), 0 0 0 1px rgba(var(--foreground-rgb), 0.05) inset",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      transition: "var(--transition-glass, all 0.25s ease)",
      "&:hover": {
        background: "rgba(var(--foreground-rgb), 0.16)",
        borderColor: "rgba(var(--foreground-rgb), 0.25)",
        transform: "translateY(-1px)",
        boxShadow:
          "0 3px 6px rgba(var(--background-rgb), 0.35), 0 0 0 1px rgba(var(--foreground-rgb), 0.08) inset",
      },
      "&:active": {
        transform: "translateY(0)",
        background: "rgba(var(--foreground-rgb), 0.24)",
        borderColor: "rgba(var(--foreground-rgb), 0.3)",
      },
    }),
    // ✦ Hero headline shadow
    heroText: () => ({
      color: "var(--foreground)",
      textShadow:
        "2px 3px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(0,0,0,0.8), 0 -1px 0 rgba(255,255,255,0.12)",
      "@media (prefers-color-scheme: dark)": {
        textShadow: "0 2px 4px rgba(0,0,0,0.8), 0 8px 16px rgba(0,0,0,0.6)",
      },
    }),
    heroBevel: () => ({
      color: "var(--foreground)",
      textShadow: `
        0 1px 2px rgb(var(--background-rgb), 0.8),
        0 -1px 0 rgb(var(--foreground-rgb), 0.2)
      `,
    }),
    heroGlow: () => ({
      color: "var(--foreground)",
      textShadow: `
        0 2px 4px rgb(var(--background-rgb), 0.9),
        0 8px 16px rgb(var(--background-rgb), 0.6)
      `,
    }),
    // Default dramatic hero figure (dark fallback)
    heroFigure: () => ({
      filter: `
          drop-shadow(0 18px 32px rgba(0, 0, 0, 0.8))
          drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6))
        `,
      WebkitFilter: `
          drop-shadow(0 18px 32px rgba(0, 0, 0, 0.8))
          drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6))
        `,
      "@media (prefers-color-scheme: light)": {
        filter: `
            drop-shadow(0 40px 60px rgba(0, 0, 0, 0.22))
            drop-shadow(0 6px 4px rgba(0, 0, 0, 0.4))
          `,
        WebkitFilter: `
            drop-shadow(0 40px 60px rgba(0, 0, 0, 0.22))
            drop-shadow(0 6px 4px rgba(0, 0, 0, 0.4))
          `,
      },
    }),
    // Light mode grounded version
  },
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

// language selector helpers
export const langSelector = {
  fr: 'html[lang="fr"] &',
  en: 'html[lang="en"] &',
};

// theme selector helpers
export const themeSelector = {
  light: 'html[data-theme="light"] &',
  dark: 'html[data-theme="dark"] &',
};
