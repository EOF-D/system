import { SiteConfig } from "@/client/config/config";
import { useAuth } from "@/client/context/auth";
import { Layout } from "@/client/layouts/default";
import { updateUser } from "@/client/services/authService";
import {
  Button,
  Calendar,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Select,
  SelectItem,
  Tab,
  Tabs,
  User,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { IconCheckbox, IconPencil, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * ProfilePage component that displays the user's profile information and allows editing.
 * @returns {JSX.Element} The ProfilePage component.
 */
export function ProfilePage(): JSX.Element {
  const { user, isLoggedIn, refreshUser, userFullName } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    profile: {
      first_name: "",
      last_name: "",
      major: "",
      graduation_year: "",
    },
    email: "",
    password: "",
    role: "user",
  });

  // Set initial form data when the user is logged in.
  useEffect(() => {
    if (user && isLoggedIn) {
      setFormData({
        profile: {
          first_name: user.first_name,
          last_name: user.last_name,
          major: user.major || "",
          graduation_year: user.graduation_year
            ? user.graduation_year.toString()
            : "",
        },
        email: user.email,
        password: "********", // Placeholder.
        role: user.role || "user",
      });
    }
  }, [user, isLoggedIn]);

  // Handle input changes for form fields
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle input changes for profile fields
  const handleProfileChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
  };

  // Get major label from value
  const getMajorLabel = (majorValue: string) => {
    if (!majorValue) return "";
    return (
      SiteConfig.majors.find((m) => m.value === majorValue)?.label || majorValue
    );
  };

  // Handles save button.
  const handleSave = async () => {
    setIsLoading(true);

    const updateData = {
      email: formData.email,

      // Only include password if it's been changed.
      password:
        formData.password !== "********" ? formData.password : undefined,

      profile: {
        first_name: formData.profile.first_name,
        last_name: formData.profile.last_name,
        major: formData.profile.major || undefined,
        graduation_year: formData.profile.graduation_year
          ? parseInt(formData.profile.graduation_year)
          : undefined,
      },
    };

    try {
      // Update user data with the form data.
      const response = await updateUser(updateData);
      if (response.success) {
        await refreshUser();
        setIsEditing(false);
      } else {
        console.error(`Error updating user: ${response.message}`);
      }
    } catch (error) {
      console.error(`Failed to update profile: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle date parsing.
  const handleDate = (date: string) => {
    if (!date) return null;
    const [datePart, _] = date.split(" ");
    return parseDate(datePart);
  };

  // Reset form data to original user data.
  const resetForm = () => {
    if (user) {
      setFormData({
        profile: {
          first_name: user.first_name,
          last_name: user.last_name,
          major: user.major || "",
          graduation_year: user.graduation_year
            ? user.graduation_year.toString()
            : "",
        },
        email: user.email,
        password: "********",
        role: user.role || "user",
      });
    }
    setIsEditing(false);
  };

  // Early return if user is not logged in.
  if (!isLoggedIn && !user) {
    return (
      <Layout page="Home">
        <div className="flex justify-center items-center w-full h-64">
          <p className="text-sm text-default-500">
            Please log in to view your profile.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout page="Home">
      <div className="flex justify-center items-center w-full">
        <div className="flex flex-row items-start gap-4 max-w-3xl">
          <div className="w-96">
            <Card className="w-full shadow-sm border border-default-200">
              <CardHeader className="flex justify-between items-center">
                <User
                  description={user!.email}
                  name={userFullName}
                  avatarProps={{ color: "primary" }}
                />
                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button
                      size="sm"
                      isIconOnly
                      variant="light"
                      startContent={<IconPencil size={18} />}
                      onPress={() => setIsEditing(true)}
                    />
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="solid"
                        color="primary"
                        startContent={<IconCheckbox size={18} />}
                        onPress={handleSave}
                        isLoading={isLoading}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        startContent={<IconX size={18} />}
                        onPress={resetForm}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <Input
                      label="First Name"
                      value={formData.profile.first_name}
                      placeholder="First name"
                      isReadOnly={!isEditing}
                      variant="underlined"
                      onValueChange={(value) =>
                        handleProfileChange("first_name", value)
                      }
                    />
                    <Input
                      label="Last Name"
                      value={formData.profile.last_name}
                      placeholder="Last name"
                      isReadOnly={!isEditing}
                      variant="underlined"
                      onValueChange={(value) =>
                        handleProfileChange("last_name", value)
                      }
                    />
                  </div>

                  <Input
                    label="Email"
                    value={formData.email}
                    placeholder="Email"
                    isReadOnly={!isEditing}
                    variant="underlined"
                    onValueChange={(value) => handleInputChange("email", value)}
                  />

                  {isEditing ? (
                    <Select
                      label="Major"
                      placeholder="Select your major"
                      selectedKeys={
                        formData.profile.major ? [formData.profile.major] : []
                      }
                      onChange={(e) =>
                        handleProfileChange("major", e.target.value)
                      }
                      variant="underlined"
                    >
                      {SiteConfig.majors.map((major) => (
                        <SelectItem key={major.value}>{major.label}</SelectItem>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      label="Major"
                      value={getMajorLabel(formData.profile.major)}
                      placeholder="Your major"
                      isReadOnly
                      variant="underlined"
                    />
                  )}

                  <Input
                    label="Graduation Year"
                    value={formData.profile.graduation_year || ""}
                    placeholder="Your graduation year"
                    isReadOnly={!isEditing}
                    variant="underlined"
                    onValueChange={(value) =>
                      handleProfileChange("graduation_year", value)
                    }
                  />

                  <Input
                    label="Password"
                    type="password"
                    value={formData.password}
                    placeholder="New password"
                    isReadOnly={!isEditing}
                    variant="underlined"
                    onValueChange={(value) =>
                      handleInputChange("password", value)
                    }
                    description={
                      isEditing
                        ? "Leave as is to keep current password"
                        : undefined
                    }
                  />
                </div>
              </CardBody>
            </Card>
          </div>
          <Card className="shadow-md border border-default-200">
            <Tabs
              className="bg-default-200 dark:bg-default-100 p-1"
              fullWidth
              color="primary"
              variant="solid"
            >
              <Tab key="created_at" title="Created At">
                <Calendar value={handleDate(user!.created_at)} />
              </Tab>
              <Tab key="updated_at" title="Updated At">
                <Calendar value={handleDate(user!.updated_at)} />
              </Tab>
            </Tabs>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
