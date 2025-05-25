import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaPlus,
  FaServer,
  FaShieldAlt,
  FaListAlt,
  FaSignOutAlt,
  FaCog,
  FaChartLine,
} from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Sidebar({ username, activePage }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <FaUser className="user-icon" />
        <span>{username}</span>
      </div>

      <nav className="sidebar-nav">
        <button
          onClick={() => navigate("/dashboard")}
          className={activePage === "dashboard" ? "active" : ""}
        >
          <FaChartLine /> Dashboard
        </button>
        <button
          onClick={() => navigate("/deviceRegistration")}
          className={activePage === "deviceRegistration" ? "active" : ""}
        >
          <FaPlus /> Device Registration
        </button>

        <button
          onClick={() => navigate("/sshConnection")}
          className={activePage === "sshConnection" ? "active" : ""}
        >
          <FaServer /> SSH Connection
        </button>

        <button
          onClick={() => navigate("/hardening")}
          className={activePage === "hardening" ? "active" : ""}
        >
          <FaShieldAlt /> Hardening
        </button>

        <button
          onClick={() => navigate("/audit")}
          className={activePage === "audit" ? "active" : ""}
        >
          <FaListAlt /> Results/Audits
        </button>
      </nav>

      <button onClick={handleLogout} className="logout-button">
        <FaSignOutAlt /> Logout
      </button>
    </aside>
  );
}

export default Sidebar;
