import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ allowedRole, children }) {
  const location = useLocation();
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");
  const role = localStorage.getItem("userRole");

  useEffect(() => {
    const handlePageShow = () => {
      const currentToken = localStorage.getItem("authToken") || localStorage.getItem("token");
      const currentRole = localStorage.getItem("userRole");
      if (!currentToken || !currentRole || (allowedRole && currentRole !== allowedRole)) {
        window.location.replace("/login");
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [allowedRole]);

  if (!token || !role) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={`/${role}`} replace />;
  }

  return children;
}
