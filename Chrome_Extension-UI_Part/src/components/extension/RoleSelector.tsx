import { useAuth } from "@/context/AuthContext";

export const RoleSelector = () => {
  const { userRole } = useAuth();

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-1 shadow-soft">
      <span
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
          userRole === "user"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground"
        }`}
      >
        User
      </span>
    </div>
  );
};
