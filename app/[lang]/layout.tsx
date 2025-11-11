import { SiteFooter, SiteHead, SiteHeader } from "@/components/layout";
import {
  cako,
  // condeSans,
  spaceGrotesk,
} from "@/components/ui";
import { getLayoutDictionary } from "@/lib/getDictionary";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Viewport } from "next";
import "../globals.css";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  initialScale: 1.0,
  userScalable: true,
  viewportFit: "cover",
};

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }];
}

// IMPORTANT: match Next's inferred props type
type RootLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { lang: rawLang } = await params;

  // Narrow to your Locale type, with a safe fallback
  const lang: Locale = rawLang === "fr" || rawLang === "en" ? rawLang : "fr";

  const { footer } = await getLayoutDictionary(lang, "base");

  return (
    <html
      lang={lang}
      className={`${cako.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <SiteHead />
      </head>

      <body>
        <SiteHeader lang={lang} />
        {children}
        <SiteFooter {...footer} />
        <SpeedInsights />
      </body>
    </html>
  );
}
