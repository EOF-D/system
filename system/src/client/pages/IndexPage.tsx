import { LoginModal } from "@/client/components/LoginModal";
import { useAuth } from "@/client/context/auth";
import { Layout } from "@/client/layouts/default";
import { Button, useDisclosure } from "@heroui/react";
import { button as buttonStyles } from "@heroui/theme";
import { useState } from "react";

/**
 * IndexPage component that serves as the landing page of the site.
 * @returns {JSX.Element} The IndexPage component.
 */
export function IndexPage(): JSX.Element {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [activeTab, setActiveTab] = useState<"login" | "sign-up">("login");
  const { isLoggedIn } = useAuth();

  const handleOpenLoginModal = () => {
    setActiveTab("login");
    onOpen();
  };

  const handleOpenSignUpModal = () => {
    setActiveTab("sign-up");
    onOpen();
  };

  return (
    <Layout page="Home">
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <span className="text-3xl lg:text-4xl text-lg font-semibold">
            System
          </span>
          <div className="my-2 text-md lg:text-xl text-default-600">
            A simple and lightweight learning management system.
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            className={buttonStyles({
              color: isLoggedIn ? "default" : "primary",
              radius: "full",
              variant: "solid",
            })}
            onPress={handleOpenLoginModal}
            disabled={isLoggedIn}
          >
            Login
          </Button>
          <Button
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "bordered",
            })}
            onPress={handleOpenSignUpModal}
          >
            Sign Up
          </Button>
        </div>
      </section>
      <LoginModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        defaultTab={activeTab}
      />
    </Layout>
  );
}
