import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import Settings from "./pages/Settings/Settings";
import SharedChat from "./pages/SharedChat/SharedChat";

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
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/shared/:shareId" element={<SharedChat />} />

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
            </TransitionProvider>
          </PromptProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;