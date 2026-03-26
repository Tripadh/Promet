import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import Dashboard from "./pages/Dashboard/Dashboard";
import Settings from "./pages/Settings/Settings";
import SharedChat from "./pages/SharedChat/SharedChat";
import Home from "./pages/Home/Home";
import Admin from "./pages/Admin/Admin";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminLogs from "./pages/Admin/AdminLogs";

import Terms from "./pages/Terms/Terms";
import Privacy from "./pages/Privacy/Privacy";
import AcceptableUse from "./pages/AcceptableUse/AcceptableUse";

import PrivateRoute from "./utils/PrivateRoute";

import { AuthProvider } from "./context/AuthContext";
import { PromptProvider } from "./context/PromptContext";
import { ThemeProvider } from "./context/ThemeContext";
import { TransitionOverlay, TransitionProvider, useTransitionLoader } from "./context/TransitionContext";

function AppRoutes() {
  const location = useLocation();
  const isFirstRender = useRef(true);
  const { showFor } = useTransitionLoader();

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    showFor(260);
  }, [location.pathname, showFor]);

  return (
    <>
      <TransitionOverlay />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/shared/:shareId" element={<SharedChat />} />

        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/acceptable-use" element={<AcceptableUse />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={<Admin />}
        />
        <Route
          path="/admin/users"
          element={<AdminUsers />}
        />
        <Route
          path="/admin/logs"
          element={<AdminLogs />}
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PromptProvider>
            <TransitionProvider>
              <AppRoutes />
              <Analytics />
            </TransitionProvider>
          </PromptProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;