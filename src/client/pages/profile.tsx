import { useAuth } from "@/client/context/auth";
import Layout from "@/client/layouts/default";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Input,
  User,
} from "@heroui/react";
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

  return (
    <Layout page="Home">
      <div className="flex flex-col items-center">
        {isLoggedIn ? (
          <Card className="w-full max-w-sm p-4 ">
            <CardHeader>
              <User description={user?.email} name={user?.name} />
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
                  defaultValue={!isEditing ? user?.name : ""}
                  placeholder="New name"
                  isReadOnly={!isEditing}
                  variant="underlined"
                />
                <Input
                  label="Email"
                  defaultValue={!isEditing ? user?.email : ""}
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
            <Divider />
            <CardFooter>
              Created at: {user?.created_at}
              <br />
              Updated at: {user?.updated_at}
            </CardFooter>
          </Card>
        ) : (
          <p className="text-sm text-default-500">
            Please log in to view your profile.
          </p>
        )}
      </div>
    </Layout>
  );
}

export default ProfilePage;
