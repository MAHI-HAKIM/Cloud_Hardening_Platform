import React from "react";
import { FaInfoCircle } from "react-icons/fa";

function StatusCard({ lastAudit }) {
  const getStatusMessage = () => {
    if (lastAudit) {
      return {
        text: "Last hardening action was successful.",
        type: "success",
      };
    } else {
      return {
        text: "No actions have been performed yet.",
        type: "info",
      };
    }
  };

  const status = getStatusMessage();

  return (
    <section className="dashboard-panel status-panel">
      <div className="panel-header">
        <FaInfoCircle className="panel-icon" />
        <h2>System Status</h2>
      </div>
      <div className={`status-message ${status.type}`}>{status.text}</div>
    </section>
  );
}

export default StatusCard;
