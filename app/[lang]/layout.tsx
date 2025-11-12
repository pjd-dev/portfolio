// app/[lang]/layout.tsx
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Viewport } from "next";
import type { ReactNode } from "react";
import { cache } from "react";

import { SiteFooter, SiteHead, SiteHeader } from "@/components/layout";
import { cako, condeSans, spaceGrotesk, wildWorld } from "@/components/ui/font";
import { getLayoutDictionary } from "@/lib/getDictionary";

import "../globals.css";

export const viewport: Viewport = {
  initialScale: 1,
  userScalable: true,
  viewportFit: "cover",
};

// pre-generate locales
export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }];
}

type Locale = "en" | "fr";

// cache to avoid re-fetch jitter across soft navigations
const getDictCached = cache((lang: Locale) => getLayoutDictionary(lang, "base"));

type RootLayoutProps = {
  children: ReactNode;
  // IMPORTANT: params is NOT a Promise in Next.js App Router
  params: { lang: Locale };
};

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { lang } = await params;
  // const raw = params?.lang;
  // const lang: Locale = raw === "en" || raw === "fr" ? raw : "fr";

  const { footer } = await getDictCached(lang);

  return (
    <html
      lang={lang}
      dir="ltr"
      className={`${cako.variable} ${spaceGrotesk.variable} ${condeSans.variable} ${wildWorld.variable}`}
      suppressHydrationWarning
    >
      <SiteHead />

      <body>
        <SiteHeader lang={lang} />
        <>{children}</>
        <SiteFooter {...footer} />
        <SpeedInsights />
      </body>
    </html>
  );
}
