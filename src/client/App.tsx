import IndexPage from "@/client/pages/index";
import ProfilePage from "@/client/pages/profile";
import { Route, Routes } from "react-router-dom";

/**
 * The main application component that sets up the routing for the application.
 */
function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<ProfilePage />} path="/profile" />
    </Routes>
  );
}

export default App;
