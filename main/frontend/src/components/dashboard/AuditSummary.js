import React from "react";
import { FaClipboardCheck } from "react-icons/fa";

function AuditSummary({ lastAudit }) {
  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <FaClipboardCheck className="panel-icon" />
        <h2>Last Audit Summary</h2>
      </div>

      <div className="panel-content">
        {lastAudit ? (
          <div className="audit-details">
            <div className="audit-info">
              <span className="label">Date:</span>
              <span className="value">{lastAudit.date}</span>
            </div>

            <div className="audit-info">
              <span className="label">Compliance:</span>
              <div className="compliance-meter">
                <div
                  className="compliance-fill"
                  style={{ width: `${lastAudit.compliance}%` }}
                >
                  {lastAudit.compliance}%
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="empty-message">No audit records found yet.</p>
        )}
      </div>
    </section>
  );
}

export default AuditSummary;
