import "@testing-library/jest-dom";
import React, { forwardRef } from "react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/contact",
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => React.createElement("img", props),
}));

vi.mock("next/font/local", () => ({
  default: () => ({
    className: "font-local",
    variable: "--font-local",
  }),
}));

vi.mock("next/font/google", () => ({
  Space_Grotesk: () => ({
    className: "font-google",
    variable: "--font-google",
  }),
}));

vi.mock("@/stitches.config", () => {
  const styled = (Tag: React.ElementType) => {
    const Component = forwardRef<HTMLElement, React.ComponentPropsWithoutRef<typeof Tag>>(
      (props, ref) => React.createElement(Tag as React.ElementType, { ...props, ref }),
    );
    Component.displayName =
      typeof Tag === "string" ? `styled.${Tag}` : "styled.Component";
    return Component;
  };

  return {
    styled,
    css: () => "",
    theme: {},
    config: {},
    getCssText: () => "",
    langSelector: {
      fr: 'html[lang="fr"] &',
      en: 'html[lang="en"] &',
    },
    themeSelector: {
      light: 'html[data-theme="light"] &',
      dark: 'html[data-theme="dark"] &',
    },
  };
});
