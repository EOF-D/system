import { IndexPage } from "@/client/pages/IndexPage";
import { ProfilePage } from "@/client/pages/ProfilePage";
import { Route, Routes } from "react-router-dom";

/**
 * The main application component that sets up the routing for the application.
 * @returns {JSX.Element} The App component.
 */
export function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<ProfilePage />} path="/profile" />
    </Routes>
  );
}
