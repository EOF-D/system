import { useAuth } from "@/client/context/auth";
import Layout from "@/client/layouts/default";
import {
  Button,
  Calendar,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Input,
  Tab,
  Tabs,
  User,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { IconPencil } from "@tabler/icons-react";
import { useState } from "react";

/**
 * The profile page for the application.
 */
function ProfilePage() {
  // Get the auth context to check if the user is logged in.
  const { user, isLoggedIn } = useAuth();

  // State to manage editing the profile.
  const [isEditing, setIsEditing] = useState(false);

  // Handles save button.
  const handleSave = () => {
    // TODO: Implement save functionality.

    setIsEditing(false);
  };

  // Function to handle date parsing.
  const handleDate = (date: string) => {
    if (!date) return null;

    const [datePart, _] = date.split(" ");
    return parseDate(datePart);
  };

  // Early return if user is not logged in.
  if (!isLoggedIn) {
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
                      onPress={() => setIsEditing(!isEditing)}
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
                        onPress={() => setIsEditing(!isEditing)}
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
                    defaultValue={!isEditing ? user!.name : ""}
                    placeholder="New name"
                    isReadOnly={!isEditing}
                    variant="underlined"
                  />
                  <Input
                    label="Email"
                    defaultValue={!isEditing ? user!.email : ""}
                    placeholder="New email"
                    isReadOnly={!isEditing}
                    variant="underlined"
                  />
                  <Input
                    label="Password"
                    type="password"
                    defaultValue={!isEditing ? "********" : ""}
                    placeholder="New password"
                    isReadOnly={!isEditing}
                    variant="underlined"
                  />
                </div>
              </CardBody>
            </Card>
          </div>
          <div>
            <Tabs>
              <Tab key="created_at" title="Created at">
                <Card>
                  <CardBody>
                    <Calendar value={handleDate(user!.created_at)} />
                  </CardBody>
                </Card>
              </Tab>
              <Tab key="updated_at" title="Updated at">
                <Card>
                  <CardBody>
                    <Calendar value={handleDate(user!.updated_at)} />
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ProfilePage;
