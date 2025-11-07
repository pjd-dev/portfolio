// components/layout/SiteMain.tsx
"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Wrapper } from "@/components/ui/layout";
import { SUPPORTED_LOCALES } from "@/lib/i18n";

type WrapperLayoutVariant = React.ComponentProps<typeof Wrapper>["layout"];

function stripLocale(pathname: string): string {
  if (!pathname.startsWith("/")) return pathname;

  const segments = pathname.split("/").filter(Boolean); // e.g. ["fr", "privacy"]
  if (segments.length === 0) return "/";

  const [first, ...rest] = segments;

  // use your Locale type + SUPPORTED_LOCALES
  if (SUPPORTED_LOCALES.includes(first as Locale)) {
    return rest.length ? `/${rest.join("/")}` : "/";
  }

  return pathname;
}

function resolveLayoutVariant(pathname: string): WrapperLayoutVariant {
  const path = stripLocale(pathname || "/");

  if (path === "/privacy" || path === "/terms" || path.startsWith("/legal")) {
    return "legal";
  }

  return "landing";
}

type SiteMainProps = {
  children: ReactNode;
};

export function SiteMain({ children }: SiteMainProps) {
  const pathname = usePathname() ?? "/";
  const layout = resolveLayoutVariant(pathname);

  return <Wrapper layout={layout}>{children}</Wrapper>;
}
