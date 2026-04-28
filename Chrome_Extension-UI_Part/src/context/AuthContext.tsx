import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type UserRole = "user" | "admin";

interface AuthContextType {
  userRole: UserRole;
  userName: string;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    // Admin mode is currently hidden in the UI; always default to user.
    return "user";
  });

  useEffect(() => {
    localStorage.setItem("userRole", userRole);
  }, [userRole]);

  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
  };

  const userName = "John Doe";

  return (
    <AuthContext.Provider value={{ userRole, userName, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
