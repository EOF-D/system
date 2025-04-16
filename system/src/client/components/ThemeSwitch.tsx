import { Switch } from "@heroui/react";
import { useTheme } from "@heroui/use-theme";
import {
  IconBrightnessDown,
  IconBrightnessDownFilled,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * ThemeSwitch component that allows users to toggle between light and dark themes.
 */
export const ThemeSwitch = () => {
  const [isSelected, setIsSelected] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
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
    setIsSelected(!isSelected);
    setTheme(isSelected ? "dark" : "light");
  };

  return (
    <Switch
      isSelected={isSelected}
      onValueChange={handleThemeChange}
      defaultSelected
      color="primary"
      size="lg"
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
