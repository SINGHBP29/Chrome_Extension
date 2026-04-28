import { PopupHeader } from "@/components/extension/PopupHeader";
import { QuickAsk } from "@/components/extension/QuickAsk";
import { QuickActions } from "@/components/extension/QuickActions";
import { HRMessages } from "@/components/extension/HRMessages";
import { Notifications } from "@/components/extension/Notifications";
import { Reminders } from "@/components/extension/Reminders";

const Index = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 p-6 font-sans">
      {/* Chrome extension popup mock — fixed width to match real popup constraints */}
      <div className="w-[360px] overflow-hidden rounded-2xl border border-border bg-background shadow-pop">
        <PopupHeader />
        <div className="space-y-4 pb-4">
          <QuickAsk />
          <QuickActions />
          <HRMessages />
          <Notifications />
          <Reminders />
        </div>
      </div>
    </main>
  );
};

export default Index;
