import { FC, useState, useEffect, FormEvent } from "react";
import {
  Modal,
  ModalContent,
  ModalBody,
  Tabs,
  Tab,
  Input,
  Link,
  Button,
  Card,
  CardBody,
  ModalProps,
} from "@heroui/react";

/**
 * A modal component for user login and sign-up.
 * @param {boolean} isOpen Indicates if the modal is open or closed.
 * @param {function} onOpenChange Callback function to handle modal open/close events.
 * @param {string} defaultTab The default tab to display when the modal opens. Can be "login" or "sign-up".
 */
export const LoginModal: FC<{
  isOpen: boolean,
  onOpenChange: ModalProps["onOpenChange"];
  defaultTab?: "login" | "sign-up";
}> = ({
  isOpen,
  onOpenChange,
  defaultTab = "login",
}) => {
  // State to manage the selected tab and form fields.
  const [selected, setSelected] = useState(defaultTab);

  // State for login and sign-up form fields and error messages.
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpEmailError, setSignUpEmailError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Reset tab selection when modal opens.
  useEffect(() => {
    if (isOpen) setSelected(defaultTab);
  }, [isOpen, defaultTab]);

  // Reset form fields when modal closes.
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setEmailError("");
      setSignUpEmail("");
      setSignUpEmailError("");
      setPassword("");
      setConfirmPassword("");
      setPasswordError("");
    }
  }, [isOpen]);

  // Validate email domain.
  const validateEmail = (
    emailValue: string,
    setError: (error: string) => void,
  ) => {
    if (!emailValue) {
      setError("Email is required");
      return false;
    }

    // Allow only emails from Champlain to be used.
    const validDomains = ["champlain.edu", "mymail.champlain.edu"];
    const domain = emailValue.split("@")[1];

    if (!domain || !validDomains.includes(domain)) {
      setError(
        "Email must be from champlain.edu or mymail.champlain.edu domain",
      );

      return false;
    }

    setError("");
    return true;
  };

  // Validate password match.
  const validatePasswordMatch = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }

    // Check if password is at least 8 characters long.
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validate email before processing login.
    if (validateEmail(email, setEmailError)) {
      // TODO: Process login.
      console.log("[LOGIN]: Login form submitted with valid data");
    }
  };

  const handleSignUpSubmit = (e: FormEvent) => {
    e.preventDefault();

    const isEmailValid = validateEmail(signUpEmail, setSignUpEmailError);
    const isPasswordValid = validatePasswordMatch();

    // Check if email and password are valid before processing sign up.
    if (isEmailValid && isPasswordValid) {
      // TODO: Process sign up.
      console.log("[SIGNUP]: Sign up form submitted with valid data");
    }
  };

  // Renders the login tab content.
  const renderLoginTab = () => (
    <form className="flex flex-col gap-4" onSubmit={handleLoginSubmit}>
      <Input
        isRequired
        label="Email"
        placeholder="Enter your email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => validateEmail(email, setEmailError)}
        errorMessage={emailError}
        isInvalid={!!emailError}
        description="Must use champlain.edu or mymail.champlain.edu domain"
      />
      <Input
        isRequired
        label="Password"
        placeholder="Enter your password"
        type="password"
      />
      <p className="text-center text-small">
        Need to create an account?{" "}
        <Link size="sm" onPress={() => setSelected("sign-up")}>
          Sign up
        </Link>
      </p>
      <Button fullWidth color="primary" type="submit">
        Login
      </Button>
    </form>
  );

  // Renders the sign-up tab content.
  const renderSignUpTab = () => (
    <form className="flex flex-col gap-4" onSubmit={handleSignUpSubmit}>
      <Input
        isRequired
        label="Name"
        placeholder="Enter your name"
        type="text"
      />
      <Input
        isRequired
        label="Email"
        placeholder="Enter your email"
        type="email"
        value={signUpEmail}
        onChange={(e) => setSignUpEmail(e.target.value)}
        onBlur={() => validateEmail(signUpEmail, setSignUpEmailError)}
        errorMessage={signUpEmailError}
        isInvalid={!!signUpEmailError}
        description="Must use champlain.edu or mymail.champlain.edu domain"
      />
      <Input
        isRequired
        label="Password"
        placeholder="Enter your password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        description="Must be at least 8 characters"
      />
      <Input
        isRequired
        label="Confirm Password"
        placeholder="Confirm your password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onBlur={validatePasswordMatch}
        errorMessage={passwordError}
        isInvalid={!!passwordError}
      />
      <p className="text-center text-small">
        Already have an account?{" "}
        <Link size="sm" onPress={() => setSelected("login")}>
          Login
        </Link>
      </p>
      <Button fullWidth color="primary" type="submit">
        Sign up
      </Button>
    </form>
  );

  return (
    <Modal
      backdrop="opaque"
      className="py-5 rounded-lg"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      size="sm"
    >
      <ModalContent>
        {() => (
          <>
            <ModalBody>
              <Card className="border-none shadow-none">
                <CardBody className="overflow-hidden p-0">
                  <Tabs
                    fullWidth
                    selectedKey={selected}
                    onSelectionChange={(key) => setSelected(key as "login" | "sign-up")}
                    size="md"
                  >
                    <Tab key="login" title="Login">
                      {renderLoginTab()}
                    </Tab>
                    <Tab key="sign-up" title="Sign up">
                      {renderSignUpTab()}
                    </Tab>
                  </Tabs>
                </CardBody>
              </Card>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default LoginModal;
