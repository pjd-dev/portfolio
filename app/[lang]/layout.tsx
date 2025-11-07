import type { Metadata, Viewport } from "next";
import "../globals.css";
// import EngineClient from "@/hooks/engine-client";
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

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return (
    <html
      lang={lang}
      // data-google-analytics-opt-out=""
      className={spaceGrotesk.className}
      suppressHydrationWarning
    >
      <SiteHead />
      <body>
        <SiteHeader lang={lang} />
        <SiteMain>{children}</SiteMain>
        <SiteFooter {...(dictionary.layout.footer as any)} />
      </body>
      <SpeedInsights />
    </html>
  );
}
