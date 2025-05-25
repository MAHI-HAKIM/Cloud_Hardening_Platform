import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import DashboardLayout from "./DashboardLayout";
import { useNavigate } from "react-router-dom";
import { FaPlay } from "react-icons/fa";

const Audit = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [devicePassword, setDevicePassword] = useState("");
  const [playbooks, setPlaybooks] = useState([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [taskProgress, setTaskProgress] = useState([]);
  const [runResult, setRunResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playbookSelected, setPlaybookSelected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDevices = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const q = query(
            collection(db, "devices"),
            where("email", "==", user.email)
          );
          const querySnapshot = await getDocs(q);
          const devicesData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setDevices(devicesData);
        } catch (error) {
          console.error("Error fetching devices:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDevices();
  }, []);

  useEffect(() => {
    const fetchAuditPlaybooks = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/getplaybooks/audit");
        const data = await res.json();
        setPlaybooks(data);
      } catch {
        setPlaybooks([]);
      }
    };
    fetchAuditPlaybooks();
  }, []);

  const parseAnsibleOutput = (output) => {
    console.log("Raw Ansible Output:", output);

    const lines = output.split("\n");
    const tasks = [];
    const complianceResults = {
      passed: 0,
      failed: 0,
      changed: 0,
      skipped: 0,
    };

    // Tracking to prevent duplicate tasks
    const processedTasks = new Set();

    // Debugging function to log parsing details
    const logParsingDetails = (type, match, status) => {
      console.log(`Parsing ${type}:`, {
        match: match ? match[0] : "No match",
        status: status || "Unknown",
      });
    };

    // Function to create unique task identifier
    const createTaskIdentifier = (name, details) => {
      return `${name}:${details}`.toLowerCase().replace(/\s+/g, "_");
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Detect task execution
      const taskMatch = trimmedLine.match(/TASK \[(.*?)\]/);
      if (taskMatch) {
        const taskName = taskMatch[1];
        logParsingDetails("Task", taskMatch, "running");

        const taskId = createTaskIdentifier(taskName, "running");
        if (!processedTasks.has(taskId)) {
          tasks.push({
            name: taskName,
            status: "running",
            details: "",
          });
          processedTasks.add(taskId);
        }
        return;
      }

      // Detect CIS compliance messages
      const cisMatch = trimmedLine.match(
        /CIS (\d+\.\d+\.\d+) - (.*?): (✅ COMPLIANT|❌ NOT COMPLIANT|COMPLIANT|NOT COMPLIANT)/
      );
      if (cisMatch) {
        const [, cisNumber, cisDescription, complianceStatus] = cisMatch;
        logParsingDetails("CIS Compliance", cisMatch, complianceStatus);

        const taskId = createTaskIdentifier(`CIS ${cisNumber}`, cisDescription);
        if (!processedTasks.has(taskId)) {
          const task = {
            name: `CIS ${cisNumber}: ${cisDescription}`,
            status: complianceStatus.includes("COMPLIANT") ? "pass" : "fail",
            details: complianceStatus,
          };
          tasks.push(task);
          processedTasks.add(taskId);

          // Update compliance results
          if (task.status === "pass") complianceResults.passed++;
          else complianceResults.failed++;
        }
        return;
      }

      // Detect hardening results
      const hardeningMatch = trimmedLine.match(/^([^:]+):\s*(.+)$/);
      if (hardeningMatch) {
        const [, taskName, result] = hardeningMatch;
        logParsingDetails("Hardening Result", hardeningMatch, result);

        const taskId = createTaskIdentifier(taskName, result);
        if (!processedTasks.has(taskId)) {
          let status = "unknown";

          if (
            result.includes("APPLIED") ||
            result.includes("CREATED") ||
            result.includes("SECURED")
          ) {
            status = "changed";
            complianceResults.changed++;
          } else if (
            result.includes("ALREADY") ||
            result.includes("NO RESTART NEEDED")
          ) {
            status = "pass";
            complianceResults.passed++;
          } else if (result.includes("FAILED") || result.includes("ERROR")) {
            status = "fail";
            complianceResults.failed++;
          } else if (result.includes("SKIPPED")) {
            status = "skipped";
            complianceResults.skipped++;
          }

          tasks.push({
            name: taskName,
            status: status,
            details: result,
          });
          processedTasks.add(taskId);
        }
      }
    });

    // Fallback for empty tasks
    if (tasks.length === 0) {
      tasks.push({
        name: "Playbook Execution",
        status: output.toLowerCase().includes("error") ? "fail" : "pass",
        details: "No detailed tasks found. Check raw output.",
      });
    }

    console.log("Final Parsed Tasks:", tasks);
    console.log("Processed Task IDs:", Array.from(processedTasks));
    console.log("Compliance Results:", complianceResults);

    return { tasks, complianceResults };
  };

  const handleRunAudit = async () => {
    setRunResult(null);
    setTaskProgress([]);
    const device = devices.find((d) => d.id === selectedDevice);
    if (!device || !selectedPlaybook) {
      alert("Please select both a device and a playbook.");
      return;
    }

    setIsRunning(true);
    const payload = {
      host: device.ip,
      port: device.port || 22,
      username: device.username,
      password: device.password.trim(),
      playbookPath: selectedPlaybook.fullPath,
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/ssh/run-playbook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();

      // Enhanced logging
      console.log("=== FULL PLAYBOOK RESULT ===");
      console.log("Success:", result.success);
      console.log("Error:", result.error);
      console.log("Raw Output Length:", result.output?.length || 0);
      console.log("Playbook Stats:", result.stats);
      console.log("==============================");

      setRunResult(result);

      if (result.success) {
        alert(`✅ Operation completed on ${device.deviceName}`);
      } else {
        alert(`❌ Failed: ${result.error || "Unknown error"}`);
      }

      if (result.output) {
        const { tasks, complianceResults } = parseAnsibleOutput(result.output);
        console.log("Final Parsed Tasks:", tasks);
        console.log("Compliance Results:", complianceResults);
        setTaskProgress(tasks);
      } else {
        console.log("No output received from playbook");
        setTaskProgress([
          {
            name: "No Output Received",
            status: "unknown",
            details: "The playbook may have run but no output was captured",
          },
        ]);
      }
    } catch (err) {
      console.error("Request error:", err);
      alert("❌ Request failed: " + err.message);
      setRunResult({ success: false, error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pass":
        return <span style={{ color: "green", marginRight: 8 }}>✅</span>;
      case "changed":
        return <span style={{ color: "orange", marginRight: 8 }}>🔄</span>;
      case "fail":
        return <span style={{ color: "red", marginRight: 8 }}>❌</span>;
      case "skipped":
        return <span style={{ color: "gray", marginRight: 8 }}>⏭️</span>;
      case "running":
        return <span style={{ color: "blue", marginRight: 8 }}>🔄</span>;
      default:
        return <span style={{ color: "gray", marginRight: 8 }}>❓</span>;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pass":
        return "Passed";
      case "changed":
        return "Applied";
      case "fail":
        return "Failed";
      case "skipped":
        return "Skipped";
      case "running":
        return "Running";
      default:
        return "Unknown";
    }
  };

  return (
    <DashboardLayout activePage="audit">
      <header className="dashboard-header">
        <h1>Firewall Audit & Hardening</h1>
      </header>

      <div className="dashboard-content-wrapper" style={{ display: "flex" }}>
        {!playbookSelected && (
          <div
            className="form-panel device-selector-panel"
            style={{ width: "40%" }}
          >
            <h2>Select Device and Playbook</h2>

            <div className="form-group">
              <label>Target Device:</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="form-input"
              >
                <option value="">Select a device</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.deviceName} - {device.ip}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div
          className="dashboard-panel"
          style={{ width: playbookSelected ? "100%" : "60%" }}
        >
          {playbookSelected ? (
            <div>
              <h2>Selected Playbook</h2>
              <div className="playbook-badge">{selectedPlaybook.name}</div>
              <p>{selectedPlaybook.fullPath}</p>
              <button
                onClick={handleRunAudit}
                className="primary-button run-button"
                disabled={!selectedDevice || isRunning}
              >
                <FaPlay className="button-icon" />
                {isRunning ? "Running..." : "Run Playbook"}
              </button>

              {taskProgress.length > 0 && (
                <div
                  className="playbook-progress-section"
                  style={{ marginTop: 16 }}
                >
                  <h3>Execution Results</h3>
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {taskProgress.map((task, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          marginBottom: 12,
                          padding: 8,
                          backgroundColor: "#f5f5f5",
                          borderRadius: 4,
                          border: `1px solid ${
                            task.status === "pass"
                              ? "#4CAF50"
                              : task.status === "changed"
                              ? "#FF9800"
                              : task.status === "fail"
                              ? "#F44336"
                              : "#ccc"
                          }`,
                        }}
                      >
                        <div style={{ minWidth: "30px" }}>
                          {getStatusIcon(task.status)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                            {task.name}
                          </div>
                          <div style={{ fontSize: "0.9em", color: "#666" }}>
                            Status: {getStatusText(task.status)}
                          </div>
                          {task.details && (
                            <div
                              style={{
                                fontSize: "0.8em",
                                color: "#888",
                                marginTop: 4,
                              }}
                            >
                              {task.details}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {taskProgress.length > 0 && (
                <div className="compliance-score" style={{ marginTop: "16px" }}>
                  <h3>Execution Summary</h3>
                  <div
                    style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}
                  >
                    <p style={{ fontSize: "1.1em" }}>
                      ✅ Passed:{" "}
                      {taskProgress.filter((t) => t.status === "pass").length}
                    </p>
                    <p style={{ fontSize: "1.1em" }}>
                      🔄 Applied:{" "}
                      {
                        taskProgress.filter((t) => t.status === "changed")
                          .length
                      }
                    </p>
                    <p style={{ fontSize: "1.1em" }}>
                      ❌ Failed:{" "}
                      {taskProgress.filter((t) => t.status === "fail").length}
                    </p>
                    <p style={{ fontSize: "1.1em" }}>
                      ⏭️ Skipped:{" "}
                      {
                        taskProgress.filter((t) => t.status === "skipped")
                          .length
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Debug Section - Remove in production */}
              {runResult && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 10,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 4,
                  }}
                >
                  <h4>Debug Information:</h4>
                  <p>
                    <strong>Success:</strong> {runResult.success ? "Yes" : "No"}
                  </p>
                  {runResult.error && (
                    <p>
                      <strong>Error:</strong> {runResult.error}
                    </p>
                  )}
                  <details>
                    <summary>Raw Output (Click to expand)</summary>
                    <pre
                      style={{
                        maxHeight: "200px",
                        overflow: "auto",
                        fontSize: "0.8em",
                      }}
                    >
                      {runResult.output || "No output"}
                    </pre>
                  </details>
                </div>
              )}

              <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button
                  onClick={() => navigate("/hardening")}
                  className="primary-button"
                >
                  Proceed to Next Step
                </button>

                <button
                  onClick={() => {
                    setSelectedPlaybook(null);
                    setPlaybookSelected(false);
                    setTaskProgress([]);
                    setRunResult(null);
                  }}
                  className="back-button"
                >
                  ← Back to Selection
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2>Available Playbooks</h2>
              {loading ? (
                <div className="loading-indicator">Loading playbooks...</div>
              ) : (
                <ul className="playbook-list">
                  {playbooks.map((playbook, idx) => (
                    <li
                      key={playbook.fullPath || idx}
                      className="playbook-item"
                    >
                      <div className="playbook-info">
                        <span className="playbook-name">{playbook.name}</span>
                        <span className="playbook-category">
                          {playbook.category}
                        </span>
                      </div>
                      <div className="playbook-actions">
                        <button
                          onClick={() => {
                            setSelectedPlaybook(playbook);
                            setPlaybookSelected(true);
                          }}
                          className="action-btn select-btn"
                          disabled={!selectedDevice}
                        >
                          Select
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Audit;
