import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getCurrentUser,
  isAuthenticated,
  logout,
} from "../services/authService";

/**
 * User interface representing the user object.
 */
interface User {
  /**
   * The id of the user.
   */
  id: number;

  /**
   * The name of the user.
   */
  name: string;

  /**
   * The email of the user.
   */
  email: string;

  /**
   * The role of the user.
   */
  role: string;
}

/**
 * Auth context type representing the authentication state and actions.
 */
interface AuthContextType {
  /**
   * The current user object.
   */
  user: User | null;

  /**
   * Indicates if the user is logged in.
   */
  isLoggedIn: boolean;

  /**
   * Function to log out the user.
   */
  logout: () => void;

  /**
   * Function to refresh the user data.
   */
  refreshUser: () => void;
}

// Create the auth context.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component that provides the auth context to its children.
 * @param {React.ReactNode} children - The children components.
 */
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // State to hold the user object.
  const [user, setUser] = useState<User | null>(null);

  // State to hold the login status.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Function to refresh user data.
  const refreshUser = () => {
    const userData = getCurrentUser();

    setUser(userData as User | null);
    setIsLoggedIn(isAuthenticated());
  };

  // Handle user logout.
  const handleLogout = () => {
    logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  // Check for existing auth on mount.
  useEffect(() => {
    refreshUser();
  }, []);

  const value = {
    user,
    isLoggedIn,
    logout: handleLogout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the auth context.
 * @returns {AuthContextType} The auth context value.
 * @throws {Error} If used outside of AuthProvider.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
