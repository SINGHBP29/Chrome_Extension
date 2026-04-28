import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";

export const SettingsDialog = ({ children }: { children: ReactNode }) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [notificationPermission, setNotificationPermission] = useState<string>("unknown");

  useEffect(() => {
    const loadPermission = async () => {
      try {
        const chromeAny = (globalThis as any).chrome;
        const getPermissionLevel = chromeAny?.notifications?.getPermissionLevel;
        if (typeof getPermissionLevel !== "function") {
          setNotificationPermission("unavailable");
          return;
        }

        // MV3 supports Promises in newer Chrome, but callback works too.
        const maybePromise = getPermissionLevel();
        if (maybePromise && typeof maybePromise.then === "function") {
          const level = await maybePromise;
          setNotificationPermission(typeof level === "string" ? level : "unknown");
          return;
        }

        getPermissionLevel((level: unknown) => {
          setNotificationPermission(typeof level === "string" ? level : "unknown");
        });
      } catch {
        setNotificationPermission("unknown");
      }
    };

    void loadPermission();
  }, []);

  const sendTestNotification = () => {
    try {
      const chromeAny = (globalThis as any).chrome;
      if (!chromeAny?.runtime?.sendMessage) {
        toast({
          title: "Not in extension",
          description: "Open this UI inside the Chrome extension popup.",
        });
        return;
      }

      chromeAny.runtime.sendMessage({
        type: "SHOW_NOTIFICATION",
        title: "Team Assistant",
        message: "Test notification from Settings",
      }, () => {
        if (chromeAny.runtime?.lastError?.message) {
          toast({
            title: "Failed",
            description: chromeAny.runtime.lastError.message,
          });
          return;
        }

        toast({
          title: "Sent",
          description:
            "If nothing appears, notifications may be blocked for Chrome/extension.",
        });
      });

      return;
    } catch {
      toast({ title: "Failed", description: "Could not send test notification." });
    }
  };

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

          <div className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="leading-tight">
                <p className="text-[12px] font-semibold text-foreground">Notifications</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Permission:{" "}
                  <span className="font-medium text-foreground">
                    {notificationPermission}
                  </span>
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={sendTestNotification}>
                Test
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
