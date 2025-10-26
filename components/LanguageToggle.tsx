// // app/(components)/LanguageToggle.tsx
// "use client";

// import { usePathname, useRouter, useSearchParams } from "next/navigation";
// import { useMemo, useTransition } from "react";
// import { swapLocaleInPath, type Locale } from "@/lib/i18n";
// import clsx from "clsx";

// type Props = { locale: Locale };

// export default function LanguageToggle({ locale }: Props) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const searchParams = useSearchParams();
//   const [isPending, startTransition] = useTransition();

//   const isEN = locale === "en";
//   const nextLocale: Locale = isEN ? "fr" : "en";

//   const targetHref = useMemo(() => {
//     const base = swapLocaleInPath(pathname || "/", nextLocale);
//     const qs = searchParams?.toString();
//     return qs ? `${base}?${qs}` : base;
//   }, [pathname, searchParams, nextLocale]);

//   return (
//     <label className="relative inline-block w-[66px] h-[28px] cursor-pointer select-none">
//       <input
//         type="checkbox"
//         checked={isEN}
//         onChange={() => {
//           startTransition(() => router.replace(targetHref));
//         }}
//         disabled={isPending}
//         className="peer sr-only"
//         aria-label={isEN ? "Switch to French" : "Passer en anglais"}
//       />

//       {/* Track */}
//       <span
//         className={clsx(
//           "absolute inset-0 rounded-full",
//           "border border-[rgba(var(--foreground-rgb),0.25)]",
//           "bg-[rgba(var(--foreground-rgb),0.08)] peer-checked:bg-[rgba(var(--foreground-rgb),0.18)]",
//           "backdrop-blur-[8px] transition-colors duration-300 ease-in-out",
//           "peer-disabled:opacity-50 peer-disabled:pointer-events-none",
//           "shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]",
//         )}
//       />

//       {/* Thumb */}
//       <span
//         className={clsx(
//           "absolute top-1/2 start-[0.35rem] -translate-y-1/2 size-7 rounded-full",
//           "bg-[rgba(var(--foreground-rgb),0.9)] shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
//           "transition-transform duration-300 ease-in-out",
//           "peer-checked:translate-x-[38px]",
//         )}
//       />

//       {/* FR label */}
//       <span
//         className={clsx(
//           "absolute top-1/2 start-1.5 -translate-y-1/2 flex justify-center items-center size-5",
//           "text-[11px] font-semibold tracking-[0.02em] select-none",
//           "transition-colors duration-300 ease-in-out",
//           "text-[rgba(var(--background-rgb),0.85)] peer-checked:text-[rgba(var(--background-rgb),0.4)]",
//         )}
//       >
//         FR
//       </span>

//       {/* EN label */}
//       <span
//         className={clsx(
//           "absolute top-1/2 end-1.5 -translate-y-1/2 flex justify-center items-center size-5",
//           "text-[11px] font-semibold tracking-[0.02em] select-none",
//           "transition-colors duration-300 ease-in-out",
//           "text-[rgba(var(--background-rgb),0.4)] peer-checked:text-[rgba(var(--background-rgb),0.85)]",
//         )}
//       >
//         EN
//       </span>
//     </label>
//   );
// }
// app/(components)/LanguageToggle.tsx
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
    <button
      type="button"
      disabled={isPending}
      aria-label={isEN ? "Switch to French" : "Passer en anglais"}
      onClick={() => {
        startTransition(() => router.replace(targetHref));
      }}
      className={clsx(
        // glass chip base, but tighter
        "inline-flex items-center rounded-full border",
        "border-[rgba(var(--foreground-rgb),0.25)]",
        "bg-[rgba(var(--foreground-rgb),0.08)]",
        "backdrop-blur-[8px]",
        // height ~24px, matches badge scale
        "h-[24px] px-2",
        // text sizing
        "text-[9px] font-medium leading-none tracking-[0.06em]",
        "shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]",
        "transition-colors duration-300 ease-in-out",
        "disabled:opacity-50 disabled:pointer-events-none select-none",
      )}
    >
      <span
        className={clsx(
          "px-[2px]",
          isEN
            ? "text-[rgba(var(--foreground-rgb),0.4)]"
            : "text-[rgba(var(--foreground-rgb),0.9)]",
        )}
      >
        FR
      </span>

      <span className="text-[rgba(var(--foreground-rgb),0.4)] px-[2px]">/</span>

      <span
        className={clsx(
          "px-[2px]",
          isEN
            ? "text-[rgba(var(--foreground-rgb),0.9)]"
            : "text-[rgba(var(--foreground-rgb),0.4)]",
        )}
      >
        EN
      </span>
    </button>
  );
}
