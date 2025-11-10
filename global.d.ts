// global.d.ts
export {};

declare global {
  /** Supported application locales */
  type Locale = import("./lib/i18n").Locale;
  /** Explicit link classification */
  type Cta = import("./lib/validation/shared").Cta;
}
