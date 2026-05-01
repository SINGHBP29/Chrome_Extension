import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getDisplayName, getGoogleUserProfile } from "@/google_workspace/googleUserProfile";

export const RoleSelector = () => {
  const { userRole } = useAuth();
  const [label, setLabel] = useState<string>(userRole === "admin" ? "Admin" : "User");

  useEffect(() => {
    const refresh = async () => {
      try {
        const profile = await getGoogleUserProfile();
        const name = getDisplayName(profile);
        if (name) setLabel(name);
        else setLabel(userRole === "admin" ? "Admin" : "User");
      } catch {
        setLabel(userRole === "admin" ? "Admin" : "User");
      }
    };

    void refresh();

    const onAuth = () => void refresh();
    window.addEventListener("google-auth-changed", onAuth);
    return () => window.removeEventListener("google-auth-changed", onAuth);
  }, [userRole]);

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-1 shadow-soft">
      <span
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
          userRole === "user"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground"
        }`}
      >
        <span className="block max-w-[140px] truncate">{label}</span>
      </span>
    </div>
  );
};
