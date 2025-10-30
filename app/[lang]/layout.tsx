import type { Metadata, Viewport } from "next";
import "../globals.css";
import { getDictionary } from "@/lib/getDictionary";
import { spaceGrotesk } from "@/components/ui/fonts";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  SiteFooter,
  SiteHeader,
  SiteMain,
  SiteHead,
} from "@/components/layout";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Darrybook - Jean Darry Paulette Portfolio",
  description:
    "Portfolio of Jean Darry Paulette - Full-Stack Developer, Tech Enthusiast, and Lifelong Learner.",
};

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

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { lang: rawLang } = await params;

  // Narrow to your Locale type, with a safe fallback
  const lang: Locale = rawLang === "fr" || rawLang === "en" ? rawLang : "fr";

  const dictionary = await getDictionary(lang, 
    "base", 
    "layout"
  );

  return (
    <html
      lang={lang}
      className={spaceGrotesk.className}
      suppressHydrationWarning
    >
      <head>
        <SiteHead />
      </head>

      <body>
        <SiteHeader lang={lang} />
        <SiteMain>{children}</SiteMain>
        <SiteFooter {...dictionary.layout.footer} />
        <SpeedInsights />
      </body>
    </html>
  );
}
