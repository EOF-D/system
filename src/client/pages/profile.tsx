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
  // Get the auth context to check if the user is logged in.
  const { user, isLoggedIn, refreshUser } = useAuth();

  // State to manage editing the profile.
  const [isEditing, setIsEditing] = useState(false);

  // State to manage form data.
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  // Set initial form data when the user is logged in.
  useEffect(() => {
    if (user && isLoggedIn) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "********", // Placeholder.
        role: user.role || "user",
      });
    }
  }, [user, isLoggedIn]);

  // Handle input changes.
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handles save button.
  const handleSave = async () => {
    // Update user data with the form data.
    const response = await updateUser(formData);
    if (response.success) {
      // Refresh user data after successful update.
      refreshUser();
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
                <User description={user!.email} name={user!.name} />
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
                              name: user.name || "",
                              email: user.email || "",
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
                  <Input
                    label="Name"
                    value={formData.name}
                    placeholder="New name"
                    isReadOnly={!isEditing}
                    variant="underlined"
                    onValueChange={(value) => handleInputChange("name", value)}
                  />
                  <Input
                    label="Email"
                    value={formData.email}
                    placeholder="New email"
                    isReadOnly={!isEditing}
                    variant="underlined"
                    onValueChange={(value) => handleInputChange("email", value)}
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
