import { Route, Routes } from "react-router-dom";
import IndexPage from "@/pages/index";

/**
 * The main application component that sets up the routing for the application.
 */
function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
    </Routes>
  );
}

export default App;
