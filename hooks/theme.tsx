"use client";

import { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  // SSR fallback
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "light";
  }

  // 1. Explicit persisted choice wins
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  // 2. Existing DOM attribute wins
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") {
    return attr;
  }

  // 3. Fallback to system
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  // push state → DOM + localStorage
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore write failures
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
