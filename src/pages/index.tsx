import { useState } from "react";
import { button as buttonStyles } from "@heroui/theme";
import { Button, useDisclosure } from "@heroui/react";

import Layout from "@/layouts/default";
import LoginModal from "@/components/login";

/**
 * The index page for the application.
 */
function IndexPage() {
  // State to manage the modal's open state and the active tab.
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // State to manage the active tab in the modal.
  const [activeTab, setActiveTab] = useState<"login" | "sign-up">("login");

  // Function to handle opening the modal with specific tab.
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
          <span className="text-3xl lg:text-4xl font-semibold">System</span>
          <div className="my-2 text-lg lg:text-xl text-default-600">
            A simple and lightweight learning management system.
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
            onPress={handleOpenLoginModal}
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

export default IndexPage;
