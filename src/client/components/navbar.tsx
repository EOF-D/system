import {
  Navbar as HeroNavbar,
  Button,
  Link,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { button as buttonStyles } from "@heroui/theme";
import { FC } from "react";

import { useAuth } from "@/client/context/auth";
import { ThemeSwitcher } from "@/client/components/switch";

/**
 * A navbar component that displays navigation links and a theme switcher.
 * @param {string} activePage The current active page, used to highlight the corresponding link.
 */
export const Navbar: FC<{ activePage: string }> = ({ activePage }) => {
  // Get the auth context to log out the user.
  const { isLoggedIn, logout } = useAuth();

  return (
    <HeroNavbar>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem isActive={activePage === "Home"}>
          <Link color="foreground" href="/" underline="always">
            Home
          </Link>
        </NavbarItem>
        <NavbarItem isActive={activePage === "Profile"}>
          <Link color="foreground" href="/profile" underline="always">
            Profile
          </Link>
        </NavbarItem>
        <NavbarItem isActive={activePage === "Calendar"}>
          <Link color="foreground" href="/calendar" underline="always">
            Calendar
          </Link>
        </NavbarItem>
        <NavbarItem isActive={activePage === "Dashboard"}>
          <Link color="foreground" href="/dashboard" underline="always">
            Dashboard
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          {isLoggedIn && (
            <Button
              className={buttonStyles({
                color: "primary",
                radius: "full",
                variant: "bordered",
                size: "md",
              })}
              onPress={logout}
            >
              Logout
            </Button>
          )}
        </NavbarItem>
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
      </NavbarContent>
    </HeroNavbar>
  );
};
