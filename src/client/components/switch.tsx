import { Switch } from "@heroui/react";
import { useTheme } from "@heroui/use-theme";
import { useEffect, useState } from "react";

import {
  IconBrightnessDown,
  IconBrightnessDownFilled,
} from "@tabler/icons-react";

/**
 * A component that allows users to switch between light and dark themes.
 */
export const ThemeSwitcher = () => {
  // State to manage the selected theme.
  const [isSelected, setIsSelected] = useState(false);

  // State to check if the component is mounted.
  const [isMounted, setIsMounted] = useState(false);

  // Get the current theme and function to set the theme from the context.
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);

    // Check if the theme is set to "dark" or "light".
    if (theme === "light") {
      setIsSelected(true);
    }
  }, []);

  if (!isMounted) return null;

  const handleThemeChange = () => {
    // Toggle the theme between "dark" and "light".
    setIsSelected(!isSelected);
    setTheme(isSelected ? "dark" : "light");
  };

  return (
    <Switch
      isSelected={isSelected}
      onValueChange={handleThemeChange}
      defaultSelected
      color="primary"
      size="md"
      thumbIcon={({ isSelected, className }) =>
        isSelected ? (
          <IconBrightnessDownFilled className={className} />
        ) : (
          <IconBrightnessDown className={className} />
        )
      }
    ></Switch>
  );
};
