import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { requestUiLeaveCheck } from "@/utils/leaveNotifications";
import Index from "./pages/Index.tsx";
import MeetingPage from "./pages/MeetingPage.tsx";
import UserTimesheet from "./pages/UserTimesheet.tsx";
import AdminTimesheet from "./pages/AdminTimesheet.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      void requestUiLeaveCheck("app_hidden");
    };

    const handlePageHide = () => {
      void requestUiLeaveCheck("app_pagehide");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    globalThis.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      globalThis.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.connect) return;
    let port: chrome.runtime.Port | null = null;
    let heartbeatTimer: number | null = null;
    let disposed = false;

    const stopHeartbeat = () => {
      if (heartbeatTimer !== null) {
        window.clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    const startHeartbeat = () => {
      stopHeartbeat();
      // MV3: opening a Port doesn't keep the service worker alive; sending messages does.
      heartbeatTimer = window.setInterval(() => {
        try {
          port?.postMessage({ type: "UI_HEARTBEAT", now: Date.now() });
        } catch {
          // ignore
        }
      }, 20_000);
    };

    const connectPort = () => {
      if (disposed) return;
      stopHeartbeat();

      try {
        port = chrome.runtime.connect({ name: "team-assistant-ui" });
      } catch {
        port = null;
        return;
      }

      try {
        port.postMessage({
          type: "UI_CONNECTED",
          url: globalThis.location?.href,
          hash: globalThis.location?.hash,
        });
      } catch {
        // ignore
      }

      startHeartbeat();

      port.onDisconnect.addListener(() => {
        stopHeartbeat();
        // Service worker can terminate/restart while UI is open; reconnect.
        if (!disposed) window.setTimeout(connectPort, 250);
      });
    };

    connectPort();
    return () => {
      disposed = true;
      stopHeartbeat();
      try {
        port?.disconnect();
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/meeting" element={<MeetingPage />} />
              <Route path="/timesheet/user" element={<UserTimesheet />} />
              <Route path="/timesheet/admin" element={<AdminTimesheet />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
