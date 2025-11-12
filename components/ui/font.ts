// components/ui/font.ts
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";

// Display font
export const wildWorld = localFont({
  src: [{ path: "../../public/fonts/wild-world.woff2", weight: "400", style: "normal" }],
  variable: "--font-wild-world",
  display: "swap",
  preload: true,
  // Key lines ↓
  fallback: ["Arial", "system-ui"],
  adjustFontFallback: "Arial", // size-adjust for metric match
});

// French display family (Cako)
export const cako = localFont({
  src: [
    { path: "../../public/fonts/Cako-Thin.woff2", weight: "200", style: "normal" },
    { path: "../../public/fonts/Cako-ThinItalic.woff2", weight: "200", style: "italic" },
    { path: "../../public/fonts/Cako-Regular.woff2", weight: "400", style: "normal" },
    {
      path: "../../public/fonts/Cako-RegularItalic.woff2",
      weight: "400",
      style: "italic",
    },
    { path: "../../public/fonts/Cako-Black.woff2", weight: "900", style: "normal" },
    { path: "../../public/fonts/Cako-BlackItalic.woff2", weight: "900", style: "italic" },
  ],
  variable: "--font-cako",
  display: "swap",
  preload: true,
  fallback: ["Arial", "system-ui"],
  adjustFontFallback: "Arial",
});

// Clean text font (Conde Sans)
export const condeSans = localFont({
  src: [
    { path: "../../public/fonts/CondeSans.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/CondeSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-conde-sans",
  display: "swap",
  preload: true,
  fallback: ["Arial", "system-ui"],
  adjustFontFallback: "Arial",
});

// Supporting Google font (Space Grotesk)
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
  // Key lines ↓
  fallback: ["Arial", "system-ui"],
  adjustFontFallback: true,
  preload: true,
});
