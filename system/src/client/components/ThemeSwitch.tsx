import { Button } from "@heroui/react";
import { useTheme } from "@heroui/use-theme";
import {
  IconBrightnessDown,
  IconBrightnessDownFilled,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * ThemeSwitch component that allows users to toggle between light and dark themes.
 * @returns {JSX.Element | null} The ThemeSwitch component or null if not mounted.
 */
export const ThemeSwitch = (): JSX.Element | null => {
  const [isLightMode, setIsLightMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);

    // Check if the theme is set to "dark" or "light".
    if (theme === "light") {
      setIsLightMode(true);
    }
  }, []);

  if (!isMounted) return null;

  const handleThemeChange = () => {
    const newTheme = isLightMode ? "dark" : "light";
    setIsLightMode(!isLightMode);
    setTheme(newTheme);
  };

  return (
    <Button
      isIconOnly
      variant="light"
      onPress={handleThemeChange}
      className="rounded-full"
      color="primary"
      size="sm"
    >
      {isLightMode ? (
        <IconBrightnessDownFilled size={24} />
      ) : (
        <IconBrightnessDown size={24} />
      )}
    </Button>
  );
};
