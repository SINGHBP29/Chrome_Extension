import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export const SettingsDialog = ({ children }: { children: ReactNode }) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm rounded-2xl border-border bg-card p-5 shadow-pop">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base">Settings</DialogTitle>
          <DialogDescription className="text-xs">
            Appearance preferences for Team Assistant.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground">
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </span>
              <div className="leading-tight">
                <p className="text-[12px] font-semibold text-foreground">
                  Dark mode
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Toggle light/dark theme.
                </p>
              </div>
            </div>

            <Switch
              checked={isDark}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              aria-label="Toggle dark mode"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
