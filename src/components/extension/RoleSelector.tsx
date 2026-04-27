import { useAuth } from "@/context/AuthContext";

type Role = "user" | "admin";

export const RoleSelector = () => {
  const { userRole, setUserRole } = useAuth();

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-1">
      {(["user", "admin"] as Role[]).map((nextRole) => (
        <button
          key={nextRole}
          onClick={() => setUserRole(nextRole)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            userRole === nextRole
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          {nextRole === "user" ? "User" : "Admin"}
        </button>
      ))}
    </div>
  );
};
