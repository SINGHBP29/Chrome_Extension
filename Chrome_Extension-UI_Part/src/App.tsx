import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index.tsx";
import MeetingPage from "./pages/MeetingPage.tsx";
import UserTimesheet from "./pages/UserTimesheet.tsx";
import AdminTimesheet from "./pages/AdminTimesheet.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.connect) return;
    const port = chrome.runtime.connect({ name: "team-assistant-ui" });
    port.postMessage({
      type: "UI_CONNECTED",
      url: globalThis.location?.href,
      hash: globalThis.location?.hash,
    });
    return () => {
      try {
        port.disconnect();
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
