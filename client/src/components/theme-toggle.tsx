import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative h-9 w-9 rounded-full"
      data-testid="button-theme-toggle"
    >
      <Sun 
        className={`h-5 w-5 transition-all duration-500 ${
          isDark 
            ? "rotate-90 scale-0 opacity-0" 
            : "rotate-0 scale-100 opacity-100"
        }`} 
      />
      <Moon 
        className={`absolute h-5 w-5 transition-all duration-500 ${
          isDark 
            ? "rotate-0 scale-100 opacity-100" 
            : "-rotate-90 scale-0 opacity-0"
        }`} 
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
