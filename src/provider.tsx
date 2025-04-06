import { HeroUIProvider } from "@heroui/system";
import type { NavigateOptions } from "react-router-dom";
import { useHref, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/client/context/auth";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <AuthProvider>{children}</AuthProvider>
    </HeroUIProvider>
  );
}
