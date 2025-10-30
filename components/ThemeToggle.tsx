// app/(components)/ThemeToggle.tsx
"use client";

import { useThemeToggle } from "@/hooks/theme";
import { type Locale } from "@/lib/i18n";
import { Switch, SwitchPart } from "./ui/Switch.styles";
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
    <Switch
      type="button"
      aria-label={`☾ / ☀︎ — ${ariaLabel}`}
      onClick={toggleTheme}
      className={"glass text-2xl"}
    >
      <SwitchPart active={!isDark}>☾</SwitchPart>
      <span className="split">/</span>
      <SwitchPart active={isDark}>☀︎</SwitchPart>
    </Switch>
  );
}
