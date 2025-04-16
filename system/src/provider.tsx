import { AuthProvider } from "@client/context/auth";
import { HeroUIProvider } from "@heroui/system";
import type { NavigateOptions } from "react-router-dom";
import { useHref, useNavigate } from "react-router-dom";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

/**
 * The main provider component that wraps the application with necessary context providers.
 * @param {React.ReactNode} children - The child components to be rendered within the provider.
 * @returns {JSX.Element} The provider component.
 */
export function Provider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <AuthProvider>{children}</AuthProvider>
    </HeroUIProvider>
  );
}
