import IndexPage from "@/client/pages/index";
import ProfilePage from "@/client/pages/profile";
import DashboardPage from "@/client/pages/dashboard";
import { Route, Routes } from "react-router-dom";

/**
 * The main application component that sets up the routing for the application.
 */
function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<ProfilePage />} path="/profile" />
      <Route element={<DashboardPage />} path="/dashboard" />
    </Routes>
  );
}

export default App;
