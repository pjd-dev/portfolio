// app/(components)/ThemeToggle.tsx
"use client";

import { Switch, SwitchPart } from "@/components/ui/Switch.styles";
import { useThemeToggle } from "@/hooks/theme";
import { type Locale } from "@/lib/i18n";
import { Moon, Sun } from "lucide-react";
type Props = { locale: Locale };

export default function ThemeToggle({ locale }: Props) {
  const { theme, toggleTheme } = useThemeToggle();
  const isDark = theme === "dark";
  const isEN = locale === "en";

  const ariaLabel = isDark && isEN ? "Switch  theme" : "Changer de thème";

  return (
    <Switch
      type="button"
      aria-label={`☾ / ☀︎ — ${ariaLabel}`}
      onClick={toggleTheme}
      className={"glass text-2xl"}
    >
      <SwitchPart active={!isDark}>
        <Moon size={!isDark ? 18 : 16} />
      </SwitchPart>
      <span className="split">/</span>
      <SwitchPart active={isDark}>
        <Sun size={isDark ? 18 : 16} />
      </SwitchPart>
    </Switch>
  );
}
