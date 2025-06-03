"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Theme, themes } from "@/lib/themes";

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // 从 localStorage 获取保存的主题
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // 移除所有主题类
    document.documentElement.classList.remove("theme-light", "theme-dark");
    // 添加新主题类
    document.documentElement.classList.add(`theme-${theme}`);
    // 保存主题到 localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
