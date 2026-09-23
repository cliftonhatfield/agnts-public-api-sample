import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

/** Same key the developer portal uses, so a choice made there carries over here. */
const THEME_STORAGE_KEY = "agnts.developerPortal.theme";

function storedTheme(): ThemeMode | undefined {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : undefined;
  } catch {
    return undefined;
  }
}

function systemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Applies the stored theme before first render so the page does not flash. */
export function applyInitialTheme(): void {
  const theme = storedTheme();
  if (theme) document.documentElement.dataset.theme = theme;
}

export function useThemeMode(): [ThemeMode, () => void] {
  const [theme, setTheme] = useState<ThemeMode>(() => storedTheme() ?? systemTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggle(): void {
    const next = theme === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the toggle still applies for this visit.
    }
    setTheme(next);
  }

  return [theme, toggle];
}
