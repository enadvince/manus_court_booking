import React, { createContext, useContext, useEffect, useState } from "react";
import { readStorage, writeStorage } from "@/lib/storage";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

// Keep in sync with the inline script in client/index.html, which applies the
// theme before first paint so the page never flashes the wrong colours.
const STORAGE_KEY = "theme";
const darkQuery = "(prefers-color-scheme: dark)";

function storedTheme(): Theme | null {
  const stored = readStorage(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function systemTheme(fallback: Theme): Theme {
  if (typeof window.matchMedia !== "function") return fallback;
  return window.matchMedia(darkQuery).matches ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  // An explicit choice wins; until one is made, follow the operating system.
  const [userTheme, setUserTheme] = useState<Theme | null>(() =>
    switchable ? storedTheme() : null
  );
  const [osTheme, setOsTheme] = useState<Theme>(() =>
    switchable ? systemTheme(defaultTheme) : defaultTheme
  );
  const theme = userTheme ?? osTheme;

  useEffect(() => {
    if (!switchable || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(darkQuery);
    const onChange = () => setOsTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [switchable]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = switchable
    ? () => {
        const next = theme === "light" ? "dark" : "light";
        setUserTheme(next);
        writeStorage(STORAGE_KEY, next);
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
