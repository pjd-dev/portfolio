// global.d.ts
export {};

declare global {
  /** Supported application locales */
  type Locale = import("./lib/i18n").Locale;
  /** Explicit link classification */
  type AppLinkType = "internal" | "external";

  /** Generic link/button config shared across UI components */
  type AppLinkConfig = {
    label: string;
    href: string;
    alt?: string;
    target?: "_self" | "_blank" | "_parent" | "_top";
    rel?: string;
    type?: AppLinkType; // ← new field
  };
}
