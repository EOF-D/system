import { User } from "@heroui/react";
import { Card, CardHeader, CardBody, CardFooter, Divider } from "@heroui/react";

import Layout from "@/client/layouts/default";
import { useAuth } from "@/client/context/auth";

/**
 * The profile page for the application.
 */
function ProfilePage() {
  // Get the auth context to check if the user is logged in.
  const { user, isLoggedIn } = useAuth();
  console.log(user);

  return (
    <Layout page="Home">
      <div className="flex flex-col items-center">
        {isLoggedIn ? (
          <Card className="w-full max-w-sm p-4 ">
            <CardHeader>
              <User description={user?.email} name={user?.name} />
            </CardHeader>
            <Divider />
            <CardBody>Role: {user?.role}</CardBody>
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
