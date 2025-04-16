import { ThemeSwitch } from "@/client/components/ThemeSwitch";
import { useAuth } from "@/client/context/auth";
import {
  Button,
  Navbar as HeroNavbar,
  Link,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { button as buttonStyles } from "@heroui/theme";
import { FC } from "react";

/**
 * Navbar component that displays the navigation links and theme switcher.
 * @param {string} activePage The current active page, used to highlight the corresponding link.
 * @returns {JSX.Element} The Navbar component.
 */
export const Navbar: FC<{ activePage: string }> = ({
  activePage,
}): JSX.Element => {
  const { isLoggedIn, logout } = useAuth();

  return (
    <HeroNavbar>
      <NavbarContent className="sm:flex gap-4" justify="center">
        <NavbarItem isActive={activePage === "Home"}>
          <Link color="foreground" href="/" underline="always">
            Home
          </Link>
        </NavbarItem>
        <NavbarItem isActive={activePage === "Profile"}>
          <Link
            color="foreground"
            href="/profile"
            underline="always"
            isDisabled={!isLoggedIn}
          >
            Profile
          </Link>
        </NavbarItem>
        <NavbarItem isActive={activePage === "Dashboard"}>
          <Link
            color="foreground"
            href="/dashboard"
            underline="always"
            isDisabled={!isLoggedIn}
          >
            Dashboard
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem>
          {isLoggedIn && (
            <Button
              className={buttonStyles({
                color: "primary",
                radius: "full",
                variant: "bordered",
                size: "sm",
              })}
              onPress={logout}
            >
              Logout
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>
    </HeroNavbar>
  );
};
