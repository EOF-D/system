import {
  fetchUserProfile,
  getCurrentUser,
  getUserFullName,
  isAdmin,
  isAuthenticated,
  isProfessor,
  logout,
} from "@client/services/authService";
import { User } from "@shared/types/models/user";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * Auth context type representing the authentication state and actions.
 */
interface AuthContextType {
  /**
   * The current user object.
   * @type {User | null}
   */
  user: User | null;

  /**
   * Indicates if the user is logged in.
   * @type {boolean}
   */
  isLoggedIn: boolean;

  /**
   * Indicates if the user is an admin.
   * @type {boolean}
   */
  isAdmin: boolean;

  /**
   * Indicates if the user is a professor.
   * @type {boolean}
   */
  isProfessor: boolean;

  /**
   * The full name of the user.
   * @type {string}
   */
  userFullName: string;

  /**
   * Function to log out the user.
   * @returns {void}
   */
  logout: () => void;

  /**
   * Function to refresh the user data.
   * @returns {Promise<void>}
   */
  refreshUser: () => Promise<void>;
}

// Create the auth context.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component that provides the auth context to its children.
 * @param {ReactNode} children - The children components.
 */
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // State to hold the user object.
  const [user, setUser] = useState<User | null>(null);

  // State to hold the login status.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // States for derived user properties.
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);
  const [isUserProfessor, setIsUserProfessor] = useState<boolean>(false);
  const [userFullName, setUserFullName] = useState<string>("");

  // Function to refresh user data.
  const refreshUser = async () => {
    // First check local storage.
    const userFromStorage = getCurrentUser();

    if (userFromStorage) {
      setUser(userFromStorage as User);
      setIsLoggedIn(true);
      setIsUserAdmin(isAdmin());
      setIsUserProfessor(isProfessor());
      setUserFullName(getUserFullName());

      if (isAuthenticated()) {
        try {
          const response = await fetchUserProfile();
          if (response.success && response.data) {
            setUser(response.data as User);
            setIsUserAdmin(response.data.role === "admin");
            setIsUserProfessor(response.data.role === "professor");
            setUserFullName(
              `${response.data.first_name} ${response.data.last_name}`
            );
          }
        } catch (error) {
          console.error(`Failed to refresh user profile: ${error}`);
        }
      }
    } else {
      setUser(null);
      setIsLoggedIn(false);
      setIsUserAdmin(false);
      setIsUserProfessor(false);
      setUserFullName("");
    }
  };

  // Handle user logout.
  const handleLogout = () => {
    logout();
    setUser(null);
    setIsLoggedIn(false);
    setIsUserAdmin(false);
    setIsUserProfessor(false);
    setUserFullName("");
  };

  // Check for existing auth on mount.
  useEffect(() => {
    refreshUser();
  }, []);

  const value = {
    user,
    isLoggedIn,
    isAdmin: isUserAdmin,
    isProfessor: isUserProfessor,
    userFullName,
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
