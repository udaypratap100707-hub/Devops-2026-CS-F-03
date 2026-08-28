import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("placement_user")) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("placement_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("placement_user");
    }
  }, [user]);

  const login = (email, password, role = "student") => {
    const demoUser = {
      name: email.split("@")[0] || "User",
      email,
      role,
    };

    setUser(demoUser);
    return demoUser;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);