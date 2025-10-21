// app/(components)/LanguageToggle.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { swapLocaleInPath, type Locale } from "@/lib/i18n";
import clsx from "clsx";

type Props = { locale: Locale };

export default function LanguageToggle({ locale }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isEN = locale === "en";
  const nextLocale: Locale = isEN ? "fr" : "en";

  const targetHref = useMemo(() => {
    const base = swapLocaleInPath(pathname || "/", nextLocale);
    const qs = searchParams?.toString();
    return qs ? `${base}?${qs}` : base;
  }, [pathname, searchParams, nextLocale]);

  return (
    <label className="relative inline-block w-15 h-8 cursor-pointer">
      <input
        type="checkbox"
        checked={isEN}
        onChange={() => {
          startTransition(() => router.replace(targetHref));
        }}
        disabled={isPending}
        className="peer sr-only"
        aria-label={isEN ? "Switch to French" : "Passer en anglais"}
      />

      <span
        className={clsx(
          "absolute inset-0 bg-zinc-900 dark:bg-white rounded-full transition-colors duration-200 ease-in-out",
          "peer-disabled:opacity-50 peer-disabled:pointer-events-none",
        )}
      />

      <span
        className={clsx(
          "absolute top-1/2 start-0.5 -translate-y-1/2 size-7 rounded-full shadow-xs",
          "transition-transform duration-200 ease-in-out peer-checked:translate-x-full",
          "border-2 border-white/80 dark:border-zinc-900/80 bg-white/10 dark:bg-zinc-900/10 backdrop-blur-sm",
        )}
      />

      <span
        className={clsx(
          "absolute top-1/2 start-1.5 -translate-y-1/2 flex justify-center items-center size-5",
          "text-[11px] font-semibold select-none transition-colors duration-200",
          "text-white dark:text-zinc-900 peer-checked:text-white/50 dark:peer-checked:text-zinc-900/50",
        )}
      >
        FR
      </span>

      <span
        className={clsx(
          "absolute top-1/2 end-1.5 -translate-y-1/2 flex justify-center items-center size-5",
          "text-[11px] font-semibold select-none transition-colors duration-200",
          "text-white/50 dark:text-zinc-900/50 peer-checked:text-white dark:peer-checked:text-zinc-900",
        )}
      >
        EN
      </span>
    </label>
  );
}
