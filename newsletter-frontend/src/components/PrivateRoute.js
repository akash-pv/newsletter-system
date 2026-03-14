import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ element: Component, roles }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(userRole)) {
    return (
      <div className="flex items-center justify-center h-screen text-xl text-red-600">
        Unauthorized Access
      </div>
    );
  }

  return <Component />;
};

export default PrivateRoute;
