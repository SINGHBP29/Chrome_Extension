import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getGoogleAccessToken, googleApiGetJson, notifyGoogleAuthChanged } from "@/google_workspace/googleIdentity";

type Status = "loading" | "success" | "error";

type Profile = {
  email?: string;
  name?: string;
  picture?: string;
};

export default function GoogleAuthPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const token = await getGoogleAccessToken(true);
        const data = await googleApiGetJson<Profile>("https://www.googleapis.com/oauth2/v3/userinfo", token).catch(
          () => null
        );

        if (!alive) return;
        setProfile(data && typeof data === "object" ? data : null);
        setStatus("success");
        notifyGoogleAuthChanged();
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 bg-background px-6 py-10 text-foreground">
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-pop">
        <h1 className="text-lg font-semibold">Connect Google</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This page finishes Google sign-in for Team Assistant. You can close it after it completes.
        </p>

        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          {status === "loading" ? (
            <p className="text-sm text-muted-foreground">Waiting for Google sign-in…</p>
          ) : status === "success" ? (
            <div className="flex items-center gap-3">
              {profile?.picture ? (
                <img src={profile.picture} alt="Google profile" className="h-10 w-10 rounded-full" />
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Connected</p>
                <p className="truncate text-xs text-muted-foreground">{profile?.email || profile?.name || "Google account linked."}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-destructive">Sign-in failed</p>
              <p className="mt-1 break-words text-xs text-muted-foreground">{error}</p>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              try {
                window.close();
              } catch {
                // ignore
              }
            }}
          >
            Close tab
          </Button>
          <Button
            onClick={() => {
              try {
                location.reload();
              } catch {
                // ignore
              }
            }}
            disabled={status === "loading"}
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}

