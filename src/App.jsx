import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import QuizSelection from "./pages/QuizSelection";
import Quiz from "./pages/Quiz";
import AdminPortal from "./pages/AdminPortal";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminAssessments from "./pages/AdminAssessments";
import AdminCareers from "./pages/AdminCareers";
import AdminScores from "./pages/AdminScores";
import AdminUsers from "./pages/AdminUsers";
import UserPortal from "./pages/UserPortal";
import Profile from "./pages/Profile";
import CareerExplorer from "./pages/CareerExplorer";
import MyResults from "./pages/MyResults";
import ProtectedRoute from "./components/ProtectedRoute";
import ThemeToggle from "./components/ThemeToggle";
import CustomCursor from "./components/CustomCursor";
import { applyTheme, getPreferredTheme } from "./services/theme";
import { applyMotion, getPreferredMotion } from "./services/motion";
import { resolveRuntimeBasePath } from "./services/basePath";

function AppRoutes() {
  const location = useLocation();
  const showGlobalThemeToggle = ["/", "/login", "/signup", "/quiz"].includes(location.pathname);

  return (
    <>
      {showGlobalThemeToggle ? (
        <div className="app-theme-toggle-global" aria-label="Theme switcher">
          <ThemeToggle />
        </div>
      ) : null}

      <Routes>
        <Route path="/adminDashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/adminDashboard/*" element={<Navigate to="/admin" replace />} />
        <Route path="/userDashboard" element={<Navigate to="/user" replace />} />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz-selection"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <QuizSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assessments"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminAssessments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/careers"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminCareers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/scores"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminScores />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <Quiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/careers"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <CareerExplorer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <MyResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  const routerBase = resolveRuntimeBasePath();

  useEffect(() => {
    applyTheme(getPreferredTheme());
    applyMotion(getPreferredMotion());
  }, []);

  return (
    <BrowserRouter basename={routerBase}>
      <CustomCursor />
      <AppRoutes />
    </BrowserRouter>
  );
}