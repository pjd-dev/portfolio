// app/(components)/ThemeToggle.tsx
"use client";

import clsx from "clsx";
import { useThemeToggle } from "@/hooks/theme";
import { type Locale } from "@/lib/i18n";
type Props = { locale: Locale };
export default function ThemeToggle({ locale }: Props) {
  const { theme, toggleTheme } = useThemeToggle();
  const isDark = theme === "dark";
  const isEN = locale === "en";

  const ariaLabel = isDark
    ? isEN
      ? "Switch to light theme"
      : "Passer en thème clair"
    : isEN
      ? "Switch to dark theme"
      : "Passer en thème sombre";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={toggleTheme}
      className={clsx(
        "inline-flex items-center rounded-full border",
        "border-[rgba(var(--foreground-rgb),0.25)]",
        "bg-[rgba(var(--foreground-rgb),0.08)]",
        "backdrop-blur-[8px]",
        "h-[24px] px-2",
        "text-[9px] font-medium leading-none tracking-[0.06em]",
        "shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]",
        "transition-colors duration-300 ease-in-out select-none",
      )}
    >
      <span
        className={clsx(
          "px-[2px]",
          isDark
            ? "text-[rgba(var(--foreground-rgb),0.9)]"
            : "text-[rgba(var(--foreground-rgb),0.4)]",
        )}
      >
        ☾
      </span>

      <span className="text-[rgba(var(--foreground-rgb),0.4)] px-[2px]">/</span>

      <span
        className={clsx(
          "px-[2px]",
          isDark
            ? "text-[rgba(var(--foreground-rgb),0.4)]"
            : "text-[rgba(var(--foreground-rgb),0.9)]",
        )}
      >
        ☀︎
      </span>
    </button>
  );
}
