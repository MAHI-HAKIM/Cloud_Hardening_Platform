import React from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaListAlt, FaPlus } from "react-icons/fa";

function QuickActions() {
  const navigate = useNavigate();

  return (
    <section className="dashboard-panel actions-panel">
      <h2>Quick Actions</h2>
      <div className="actions-grid">
        <button
          onClick={() => navigate("/deviceRegistration")}
          className="action-button device-btn"
        >
          <FaPlus className="action-icon" />
          <span>Register Device</span>
        </button>

        <button
          onClick={() => navigate("/hardening")}
          className="action-button hardening-btn"
        >
          <FaShieldAlt className="action-icon" />
          <span>Start Hardening</span>
        </button>

        <button
          onClick={() => navigate("/audit")}
          className="action-button audit-btn"
        >
          <FaListAlt className="action-icon" />
          <span>View Audits</span>
        </button>
      </div>
    </section>
  );
}

export default QuickActions;
