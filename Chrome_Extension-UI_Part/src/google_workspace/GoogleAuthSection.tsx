import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  clearAllCachedTokens,
  getGoogleAccessToken,
  getOAuthClientId,
  getProfileUserInfo,
  isOAuthConfigured,
  notifyGoogleAuthChanged,
} from "./googleIdentity";

export const GoogleAuthSection = () => {
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<"unknown" | "signed_out" | "signed_in">("unknown");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const info = await getProfileUserInfo();
      setEmail(info.email || "");

      // Only mark as "signed_in" if we can actually get a token non-interactively.
      try {
        await getGoogleAccessToken(false);
        setStatus("signed_in");
      } catch {
        setStatus("signed_out");
      }
    })();
  }, []);

  const signIn = async () => {
    setBusy(true);
    try {
      const chromeAny = (globalThis as any).chrome;
      const baseUrl = chromeAny?.runtime?.getURL?.("index.html") || "index.html";
      const url = `${baseUrl}#/google-auth`;
      if (chromeAny?.tabs?.create) {
        chromeAny.tabs.create({ url });
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }

      toast({
        title: "Continue in new tab",
        description: "Finish Google sign-in, then reopen the extension popup.",
      });
    } catch (error) {
      toast({
        title: "Could not open sign-in tab",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await clearAllCachedTokens();
      setEmail("");
      setStatus("signed_out");
      notifyGoogleAuthChanged();
      toast({ title: "Signed out", description: "Cleared cached Google tokens." });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  };

  const clientId = getOAuthClientId();
  const inExtension = typeof (globalThis as any).chrome !== "undefined" && !!(globalThis as any).chrome?.runtime?.id;

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="leading-tight">
          <p className="text-[12px] font-semibold text-foreground">Google account</p>
          {!inExtension ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Open inside the extension popup to sign in.
            </p>
          ) : !clientId ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Missing <span className="font-medium text-foreground">oauth2.client_id</span> in{" "}
              <span className="font-medium text-foreground">manifest.json</span>.
            </p>
          ) : !isOAuthConfigured() ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Replace the placeholder <span className="font-medium text-foreground">oauth2.client_id</span> in{" "}
              <span className="font-medium text-foreground">manifest.json</span>.
            </p>
          ) : status === "signed_in" && email ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Connected as <span className="font-medium text-foreground">{email}</span>
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Not connected.
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {status === "signed_in" ? (
            <Button size="sm" variant="outline" onClick={signOut} disabled={busy || !inExtension}>
              Sign out
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={signIn} disabled={busy || !inExtension || !isOAuthConfigured()}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
