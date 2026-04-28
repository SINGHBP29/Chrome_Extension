import { Sparkles, Settings } from "lucide-react";
import { RoleSelector } from "@/components/extension/RoleSelector";
import { SettingsDialog } from "@/components/extension/SettingsDialog";

export const PopupHeader = () => {
  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight text-foreground">
            Team Assistant
          </h1>
          <p className="text-[11px] leading-tight text-muted-foreground">
            Quick actions & reminders
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <RoleSelector />
        <SettingsDialog>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </SettingsDialog>
      </div>
    </header>
  );
};
