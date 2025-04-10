import { useAuth } from "@/client/context/auth";
import Layout from "@/client/layouts/default";
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
import { IconPencil } from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * The profile page for the application.
 */
function ProfilePage() {
  // Allowable majors for the user.
  const majors = [
    { label: "Computer Science", value: "computer_science" },
    { label: "Data Science", value: "data_science" },
    { label: "Psychology", value: "psychology" },
  ];

  // Get the auth context to check if the user is logged in.
  const { user, isLoggedIn, refreshUser, userFullName } = useAuth();

  // State to manage editing the profile.
  const [isEditing, setIsEditing] = useState(false);

  // State to manage form data.
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

  // Handle input changes for top-level fields.
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle input changes for profile fields.
  const handleProfileChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
  };

  // Handles save button.
  const handleSave = async () => {
    // Prepare update data
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

    // Update user data with the form data.
    const response = await updateUser(updateData);
    if (response.success) {
      // Refresh user data after successful update.
      await refreshUser();
    } else {
      console.error("Error updating user:", response.message);
    }

    setIsEditing(false);
  };

  // Function to handle date parsing.
  const handleDate = (date: string) => {
    if (!date) return null;
    const [datePart, _] = date.split(" ");

    return parseDate(datePart);
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
        <div className="flex flex-row items-start gap-3 max-w-3xl">
          <div className="w-96">
            <Card className="p-4 w-full">
              <CardHeader>
                <User description={user!.email} name={userFullName} />
                <div className="justify-end flex w-full">
                  {!isEditing ? (
                    <Button
                      size="sm"
                      isIconOnly
                      startContent={<IconPencil />}
                      onPress={() => setIsEditing(true)}
                    ></Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="solid"
                        color="primary"
                        onPress={handleSave}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="bordered"
                        color="danger"
                        onPress={() => {
                          // Reset form data when cancelling.
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
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
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
                      selectedKeys={[formData.profile.major]}
                      onChange={(e) =>
                        handleProfileChange("major", e.target.value)
                      }
                      variant="underlined"
                    >
                      {majors.map((major) => (
                        <SelectItem key={major.value}>{major.label}</SelectItem>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      label="Major"
                      value={
                        formData.profile.major
                          ? majors.find(
                              (m) => m.value === formData.profile.major
                            )?.label || formData.profile.major
                          : ""
                      }
                      placeholder="Your major"
                      isReadOnly
                      variant="underlined"
                    />
                  )}

                  <Input
                    label="Graduation Year"
                    value={formData.profile.graduation_year || undefined}
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
          <div>
            <Tabs>
              <Tab key="created_at" title="Created at">
                <Calendar value={handleDate(user!.created_at)} />
              </Tab>
              <Tab key="updated_at" title="Updated at">
                <Calendar value={handleDate(user!.updated_at)} />
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ProfilePage;
