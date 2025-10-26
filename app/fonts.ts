import localFont from "next/font/local";
import { Space_Grotesk } from "next/font/google";
export const WildWorld = localFont({
  src: [{ path: "../public/fonts/wild-world.woff2" }],
});

export const CondeSans = localFont({
  src: [{ path: "../public/fonts/CondeSans.woff2" }],
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-space-grotesk",
  display: "swap",
});
