"use client";

import { Palette } from "lucide-react";
import { themes, type Theme } from "@/lib/themes";
import { useTheme } from "@/pages/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem] text-primary" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(themes).map(([key, value]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => setTheme(key as Theme)}
            className={theme === key ? "bg-accent/50" : ""}
          >
            {value.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
