"use client";

import { Switch, SwitchPart } from "@/components/ui/Switch.styles";
import { swapLocaleInPath, type Locale } from "@/lib/i18n";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
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
      disabled={isPending}
      aria-label={`fr / en – ${ariaLabel}`}
      onClick={() => {
        startTransition(() => router.replace(targetHref));
      }}
    >
      <SwitchPart active={!isEN} className={!isEN ? "font-bold uppercase" : "lowercase"}>
        fr
      </SwitchPart>
      <span className="split">/</span>
      <SwitchPart active={isEN} className={isEN ? "font-bold uppercase" : "lowercase"}>
        en
      </SwitchPart>
    </Switch>
  );
}
