"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { swapLocaleInPath, type Locale } from "@/lib/i18n";
import { Switch, SwitchPart } from "./ui/Switch.styles";
type Props = { locale: Locale };

export default function LanguageToggle({ locale }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isEN = locale === "en";
  const nextLocale: Locale = isEN ? "fr" : "en";
  const ariaLabel = isEN ? "Switch to French" : "Passer en anglais";
  const targetHref = useMemo(() => {
    const base = swapLocaleInPath(pathname || "/", nextLocale);
    const qs = searchParams?.toString();
    return qs ? `${base}?${qs}` : base;
  }, [pathname, searchParams, nextLocale]);

  return (
    <Switch
      type="button"
      className={"glass"}
      disabled={isPending}
      aria-label={`${locale} ${ariaLabel}`}
      onClick={() => {
        startTransition(() => router.replace(targetHref));
      }}
    >
      <SwitchPart active={!isEN}>FR</SwitchPart>
      <span className="split">/</span>
      <SwitchPart active={isEN}>EN</SwitchPart>
    </Switch>
  );
}
