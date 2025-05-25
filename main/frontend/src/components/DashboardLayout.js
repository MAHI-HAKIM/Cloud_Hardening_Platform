import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import Sidebar from "./Sidebar";

function DashboardLayout({ children, activePage }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  // Check authentication and get username
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        setUsername(user.displayName || user.email);
        setLoading(false);
      } else {
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar username={username} activePage={activePage} />
      <main className="dashboard-content">{children}</main>
    </div>
  );
}

export default DashboardLayout;
