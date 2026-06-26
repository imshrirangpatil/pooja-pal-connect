import { useEffect, useState } from "react";

// The app ships a .dark theme in styles.css. This persists the user's choice and
// applies it by toggling the `dark` class on <html>. A tiny inline script in the
// root shell sets the class before first paint to avoid a flash.

export type Theme = "light" | "dark";
const KEY = "pranam-theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
}

export function applyTheme(t: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", t === "dark");
  }
}

export function setTheme(t: Theme) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, t);
  applyTheme(t);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };
  return { theme, toggle };
}
