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
  fetchUserProfile,
  isAdmin,
  isProfessor,
  getUserFullName,
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
   * The profile id of the user.
   */
  profile_id: number;

  /**
   * The first name of the user.
   */
  first_name: string;

  /**
   * The last name of the user.
   */
  last_name: string;

  /**
   * The major of the user.
   */
  major: string | null;

  /**
   * The graduation year of the user.
   */
  graduation_year: number | null;

  /**
   * The email of the user.
   */
  email: string;

  /**
   * The role of the user.
   */
  role: string;

  /**
   * The creation date of the user.
   */
  created_at: string;

  /**
   * The last update date of the user.
   */
  updated_at: string;
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
   * Indicates if the user is an admin.
   */
  isAdmin: boolean;

  /**
   * Indicates if the user is a professor.
   */
  isProfessor: boolean;

  /**
   * The full name of the user.
   */
  userFullName: string;

  /**
   * Function to log out the user.
   */
  logout: () => void;

  /**
   * Function to refresh the user data.
   */
  refreshUser: () => Promise<void>;
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

  // States for derived user properties.
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);
  const [isUserProfessor, setIsUserProfessor] = useState<boolean>(false);
  const [userFullName, setUserFullName] = useState<string>("");

  // Function to refresh user data.
  const refreshUser = async () => {
    // First check local storage.
    const userDataFromStorage = getCurrentUser();

    if (userDataFromStorage) {
      setUser(userDataFromStorage as User);
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
          console.error("Failed to refresh user profile:", error);
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
