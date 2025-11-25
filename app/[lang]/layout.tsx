// app/[lang]/layout.tsx
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Viewport } from "next";
import { cache } from "react";

import { SiteFooter, SiteHead, SiteHeader } from "@/components/layout";
import { cako, condeSans, spaceGrotesk, wildWorld } from "@/components/ui/font";
import { loadLayoutDictionary } from "@/lib/dictionary";

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

// cache to avoid re-fetch jitter across soft navigations
const getDictCached = cache((lang: Locale) =>
  loadLayoutDictionary({ locale: lang, target: "base" }),
);

type RootLayoutProps = LayoutProps<"/[lang]">;

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { lang: rawLang } = await params;
  const lang: Locale = rawLang === "en" || rawLang === "fr" ? rawLang : "fr";

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
