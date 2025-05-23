import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import DashboardLayout from "./DashboardLayout";
import { FaClipboardCheck, FaChartBar } from "react-icons/fa";

const Audit = () => {
  const [standard, setStandard] = useState("");
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [threshold, setThreshold] = useState(80);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState({});

  const handleAudit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !selectedDevices.length || !standard) {
      alert("Please select at least one cloud device and a security standard.");
      return;
    }

    setIsAuditing(true);
    setAuditResults({}); // Clear previous results

    for (const deviceId of selectedDevices) {
      const device = deviceOptions.find((d) => d.id === deviceId);
      if (!device) continue;

      const requestData = {
        host: device.ip,
        port: device.port,
        username: device.username,
        sshKey: device.sshKey,
        deviceId,
        userEmail: user.email,
        cloudProvider: device.cloudProvider,
        standard,
        threshold,
      };

      try {
        const response = await fetch("http://localhost:5000/api/run-audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });
        const result = await response.json();
        setAuditResults((prev) => ({
          ...prev,
          [deviceId]: result,
        }));
      } catch (err) {
        setAuditResults((prev) => ({
          ...prev,
          [deviceId]: { error: err.message },
        }));
      }
    }

    setIsAuditing(false);
  };

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        try {
          const q = query(
            collection(db, "devices"),
            where("email", "==", user.email)
          );
          const querySnapshot = await getDocs(q);
          const results = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setDeviceOptions(results);
        } catch (err) {
          console.error("Failed to fetch devices:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDevices();
  }, []);

  return (
    <DashboardLayout activePage="audit">
      <header className="dashboard-header">
        <h1>Cloud Security Audit</h1>
      </header>

      <div className="dashboard-content-wrapper">
        <div className="form-panel">
          <div className="panel-header">
            <FaClipboardCheck className="panel-icon" />
            <h2>Configure Cloud Audit</h2>
          </div>

          <form className="audit-form" onSubmit={handleAudit}>
            <div className="form-group">
              <label>Cloud Security Standard:</label>
              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="form-input"
                required
              >
                <option value="">Select a standard</option>
                <option value="AWS_CIS">AWS CIS Benchmarks</option>
                <option value="AZURE_CIS">Azure CIS Benchmarks</option>
                <option value="GCP_CIS">GCP CIS Benchmarks</option>
                <option value="CSA_CCM">Cloud Security Alliance CCM</option>
                <option value="ISO_CLOUD">ISO 27017 Cloud Security</option>
              </select>
            </div>

            <div className="form-group">
              <label>Target Cloud Devices:</label>
              <select
                multiple
                value={selectedDevices}
                onChange={(e) =>
                  setSelectedDevices(
                    Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    )
                  )
                }
                className="form-input device-selector"
                required
              >
                {loading ? (
                  <option disabled>Loading cloud devices...</option>
                ) : deviceOptions.length > 0 ? (
                  deviceOptions.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.deviceName} ({device.cloudProvider})
                    </option>
                  ))
                ) : (
                  <option disabled>No cloud devices available</option>
                )}
              </select>
              <small className="form-help">
                Hold Ctrl/Cmd to select multiple devices
              </small>
            </div>

            <div className="form-group">
              <label>Compliance Threshold (%):</label>
              <div className="range-input-container">
                <input
                  type="range"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  min="0"
                  max="100"
                  step="5"
                  className="range-input"
                />
                <div className="range-value">{threshold}%</div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={isAuditing || !deviceOptions.length}
              >
                <FaClipboardCheck className="button-icon" />
                {isAuditing ? "Running Cloud Audit..." : "Run Cloud Audit"}
              </button>
            </div>
          </form>
        </div>

        {selectedDevices.length > 0 && (
          <div className="audit-results">
            <h3>Audit Results</h3>
            {selectedDevices.map((deviceId) => {
              const device = deviceOptions.find((d) => d.id === deviceId);
              const result = auditResults[deviceId];
              return (
                <div key={deviceId} className="audit-result-panel">
                  <h4>
                    {device?.deviceName} ({device?.cloudProvider})
                  </h4>
                  {result ? (
                    result.error ? (
                      <div style={{ color: "red" }}>Error: {result.error}</div>
                    ) : (
                      <div>
                        <pre style={{ maxHeight: 200, overflow: "auto" }}>
                          {result.output}
                        </pre>
                        {result.compliance && (
                          <div>
                            <strong>Compliance Summary:</strong>
                            <pre>{JSON.stringify(result.compliance, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div>Waiting for result...</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="dashboard-panel info-panel">
          <div className="panel-header">
            <FaChartBar className="panel-icon" />
            <h2>Cloud Audit Information</h2>
          </div>

          <div className="info-content">
            <p>
              The cloud security audit tool evaluates your cloud infrastructure
              against industry-standard security benchmarks and best practices
              to identify potential vulnerabilities and compliance issues.
            </p>

            <h3>Available Cloud Standards:</h3>
            <ul>
              <li>
                <strong>AWS CIS Benchmarks</strong> - Security configuration
                standards for Amazon Web Services
              </li>
              <li>
                <strong>Azure CIS Benchmarks</strong> - Security configuration
                standards for Microsoft Azure
              </li>
              <li>
                <strong>GCP CIS Benchmarks</strong> - Security configuration
                standards for Google Cloud Platform
              </li>
              <li>
                <strong>Cloud Security Alliance CCM</strong> - Cloud Controls
                Matrix framework
              </li>
              <li>
                <strong>ISO 27017</strong> - Cloud-specific security controls
              </li>
            </ul>

            <h3>Audit Process:</h3>
            <ol>
              <li>Select the cloud security standard for your assessment</li>
              <li>Choose one or more cloud devices to audit</li>
              <li>Set your minimum compliance threshold</li>
              <li>Run the audit and review cloud security results</li>
            </ol>

            <div className="info-note">
              The cloud security audit process evaluates your infrastructure
              against cloud-specific security controls and compliance
              requirements. Results will be stored for future reference.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Audit;
