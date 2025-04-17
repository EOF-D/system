import { IndexPage } from "@/client/pages/IndexPage";
import { ProfilePage } from "@/client/pages/ProfilePage";
import { DashboardPage } from "@/client/pages/DashboardPage";
import { CoursePage } from "@/client/pages/CoursePage";
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
      <Route element={<DashboardPage />} path="/dashboard" />
      <Route element={<CoursePage />} path="/courses/:id" />
    </Routes>
  );
}
