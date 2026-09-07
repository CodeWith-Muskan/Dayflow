import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Categories from "./pages/Categories";
import Schedule from "./pages/Schedule";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";

const ProtectedPage = ({ children }) => {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedPage>
            <Dashboard />
          </ProtectedPage>
        }
      />

      <Route
        path="/tasks"
        element={
          <ProtectedPage>
            <Tasks />
          </ProtectedPage>
        }
      />

      <Route
        path="/categories"
        element={
          <ProtectedPage>
            <Categories />
          </ProtectedPage>
        }
      />

      <Route
        path="/schedule"
        element={
          <ProtectedPage>
            <Schedule />
          </ProtectedPage>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedPage>
            <Analytics />
          </ProtectedPage>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedPage>
            <History />
          </ProtectedPage>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedPage>
            <Settings />
          </ProtectedPage>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;