import { SiteConfig } from "@/client/config/config";
import { useAuth } from "@/client/context/auth";
import { login, signUp } from "@/client/services/authService";
import {
  Button,
  Card,
  CardBody,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalProps,
  Select,
  SelectItem,
  Tab,
  Tabs,
} from "@heroui/react";
import { FC, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * LoginModal component that handles user login and sign-up functionality.
 * @param {boolean} isOpen - Indicates if the modal is open or closed.
 * @param {function} onOpenChange - Callback function to handle modal open/close events.
 * @param {string} defaultTab - The default tab to display when the modal opens. Can be "login" or "sign-up".
 * @param {function} onSuccess - Callback function called after successful login/signup
 * @returns {JSX.Element} The LoginModal component.
 */
export const LoginModal: FC<{
  isOpen: boolean;
  onOpenChange: ModalProps["onOpenChange"];
  defaultTab?: "login" | "sign-up";
  onSuccess?: () => void;
}> = ({
  isOpen,
  onOpenChange,
  defaultTab = "login",
  onSuccess,
}): JSX.Element => {
  const [selected, setSelected] = useState(defaultTab);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpEmailError, setSignUpEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [major, setMajor] = useState("");
  const [graduationYear, setGraduationYear] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

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
      setFirstName("");
      setLastName("");
      setMajor("");
      setGraduationYear("");
      setServerError("");
    }
  }, [isOpen]);

  // Validate email domain.
  const validateEmail = (
    emailValue: string,
    setError: (error: string) => void
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
        "Email must be from champlain.edu or mymail.champlain.edu domain"
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

  // Handle login form submission.
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");

    // Validate email before processing login.
    if (validateEmail(email, setEmailError)) {
      try {
        setIsLoading(true);
        const response = await login({ email, password });

        if (response.success) {
          refreshUser();

          console.log(`Login successful, logged in as: ${response.data}`);
          if (onSuccess) onSuccess();

          navigate("/profile");
          onOpenChange!(false);
        } else {
          setServerError(response.message || "Login failed. Please try again.");
        }
      } catch (error) {
        console.error(`Login error: ${error}`);
        setServerError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle sign-up form submission.
  const handleSignUpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");

    const isEmailValid = validateEmail(signUpEmail, setSignUpEmailError);
    const isPasswordValid = validatePasswordMatch();
    const isProfessor = signUpEmail.endsWith("@champlain.edu");

    // Check if email and password are valid before processing sign up.
    if (isEmailValid && isPasswordValid) {
      try {
        setIsLoading(true);

        // Convert graduation year to number if provided.
        const gradYear = graduationYear ? parseInt(graduationYear) : undefined;

        const response = await signUp({
          profile: {
            first_name: firstName,
            last_name: lastName,
            major: major || undefined,
            graduation_year: gradYear,
          },
          email: signUpEmail,
          role: isProfessor ? "professor" : "user",
          password,
        });

        if (response.success) {
          console.log("Sign up successful");
          if (onSuccess) onSuccess();

          setSelected("login");
        } else {
          setServerError(
            response.message || "Sign up failed. Please try again."
          );
        }
      } catch (error) {
        console.error(`Sign up error: ${error}`);
        setServerError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Renders the login tab content.
  const renderLoginTab = () => (
    <form className="flex flex-col gap-4" onSubmit={handleLoginSubmit}>
      {serverError && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
          {serverError}
        </div>
      )}
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
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <p className="text-center text-small">
        Need to create an account?{" "}
        <Link size="sm" onPress={() => setSelected("sign-up")}>
          Sign up
        </Link>
      </p>
      <Button fullWidth color="primary" type="submit" isLoading={isLoading}>
        Login
      </Button>
    </form>
  );

  // Renders the sign-up tab content.
  const renderSignUpTab = () => (
    <form className="flex flex-col gap-4" onSubmit={handleSignUpSubmit}>
      {serverError && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
          {serverError}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          isRequired
          label="First Name"
          placeholder="Enter your first name"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          isRequired
          label="Last Name"
          placeholder="Enter your last name"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <Select
        label="Major"
        placeholder="Select your major"
        selectedKeys={[major]}
        onChange={(e) => setMajor(e.target.value)}
      >
        {SiteConfig.majors.map((major) => (
          <SelectItem key={major.value}>{major.label}</SelectItem>
        ))}
      </Select>
      <Input
        label="Graduation Year"
        placeholder="Enter your graduation year"
        type="number"
        value={graduationYear}
        onChange={(e) => setGraduationYear(e.target.value)}
        description="Optional for students, leave empty for professors"
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
      <Button fullWidth color="primary" type="submit" isLoading={isLoading}>
        Sign up
      </Button>
    </form>
  );

  return (
    <Modal
      classNames={{
        backdrop:
          "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
      }}
      className="rounded-lg"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      size="md"
    >
      <ModalContent>
        {() => (
          <>
            <ModalBody>
              <Card className="shadow-none" style={{ padding: "20px" }}>
                <CardBody className="overflow-hidden">
                  <Tabs
                    fullWidth
                    selectedKey={selected}
                    onSelectionChange={(key) =>
                      setSelected(key as "login" | "sign-up")
                    }
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
