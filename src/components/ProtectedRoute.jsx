import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/api";
import { normalizeRole } from "../services/auth";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const rolesKey = useMemo(
    () => (Array.isArray(allowedRoles) ? allowedRoles.join("|") : ""),
    [allowedRoles]
  );

  const normalizedAllowedRoles = useMemo(
    () => (Array.isArray(allowedRoles) ? allowedRoles.map((role) => normalizeRole(role)) : []),
    [allowedRoles]
  );

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      setIsLoading(true);

      try {
        const user = await getCurrentUser();
        const roleFromAuthorities = Array.isArray(user?.authorities)
          ? user.authorities.find((item) => item?.authority || item)?.authority || user.authorities[0]
          : "";
        const role = normalizeRole(user?.role || user?.userRole || roleFromAuthorities);
        const allowed =
          normalizedAllowedRoles.length === 0 ||
          normalizedAllowedRoles.includes(role);

        if (!active) {
          return;
        }

        setIsAuthenticated(true);
        setIsAllowed(allowed);
      } catch {
        if (!active) {
          return;
        }

        setIsAuthenticated(false);
        setIsAllowed(false);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    checkAccess();

    return () => {
      active = false;
    };
  }, [rolesKey, normalizedAllowedRoles]);

  if (isLoading) {
    return <div style={{ padding: 24 }}>Checking access...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}