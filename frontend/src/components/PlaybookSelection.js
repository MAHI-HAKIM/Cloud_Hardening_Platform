import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import DashboardLayout from "./DashboardLayout";
import { FaPlay } from "react-icons/fa";

const PlaybookSelection = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [playbooks, setPlaybooks] = useState([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [taskProgress, setTaskProgress] = useState([]);
  const [playbookSelected, setPlaybookSelected] = useState(false);

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
          console.log("devicesData", devicesData);
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
    const fetchPlaybooks = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/getplaybooks/hardening"
        );
        const data = await res.json();
        setPlaybooks(data);
      } catch {
        setPlaybooks([]);
      }
    };
    fetchPlaybooks();
  }, []);

  const parseAnsibleOutput = (output) => {
    const lines = output.split("\n");
    const tasks = [];
    let currentTask = null;
    lines.forEach((line) => {
      const taskMatch = line.match(/TASK \[(.*?)\]/);
      if (taskMatch) {
        currentTask = { name: taskMatch[1], status: "pending" };
        tasks.push(currentTask);
      }
      if (line.includes("ok:") && currentTask) {
        currentTask.status = "success";
      }
      if (line.includes("failed=1") && currentTask) {
        currentTask.status = "failed";
      }
    });
    return tasks;
  };

  const handleRunPlaybook = async () => {
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

    console.log("payload", payload);
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
      setRunResult(result);

      if (result.success) {
        alert(
          `✅ Successfully executed ${selectedPlaybook.name} on ${device.deviceName}`
        );
      } else {
        alert(`❌ Failed: ${result.error || "Unknown error"}`);
      }

      if (result.output) {
        setTaskProgress(parseAnsibleOutput(result.output));
      }
    } catch (err) {
      alert("❌ Request failed: " + err.message);
      setRunResult({ success: false, error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <DashboardLayout activePage="hardening">
      <header className="dashboard-header">
        <h1>Cloud Hardening Playbooks</h1>
      </header>

      <div className="dashboard-content-wrapper" style={{ display: "flex" }}>
        {!playbookSelected && (
          <div
            className="form-panel device-selector-panel"
            style={{ width: "40%", transition: "width 0.5s ease" }}
          >
            <h2>Select Cloud Device</h2>

            <div className="form-group">
              <label>Target Cloud Device:</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="form-input"
              >
                <option value="">Select a cloud device</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.deviceName} ({device.cloudProvider})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div
          className="dashboard-panel"
          style={{
            width: playbookSelected ? "100%" : "60%",
            transition: "width 0.5s ease",
          }}
        >
          {playbookSelected ? (
            <div>
              <h2>Selected Hardening Playbook</h2>
              <div className="playbook-badge">{selectedPlaybook.name}</div>
              <p>{selectedPlaybook.fullPath}</p>
              <button
                onClick={handleRunPlaybook}
                className="primary-button run-button"
                disabled={!selectedDevice || isRunning}
              >
                <FaPlay className="button-icon" />
                {isRunning ? "Running Hardening..." : "Run Hardening"}
              </button>

              {taskProgress.length > 0 && (
                <div
                  className="playbook-progress-section"
                  style={{ marginTop: 16 }}
                >
                  <h3>Playbook Progress</h3>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {taskProgress.map((task, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        {task.status === "success" ? (
                          <span style={{ color: "green", marginRight: 8 }}>
                            ✔️
                          </span>
                        ) : task.status === "failed" ? (
                          <span style={{ color: "red", marginRight: 8 }}>
                            ❌
                          </span>
                        ) : (
                          <span style={{ color: "gray", marginRight: 8 }}>
                            ⏳
                          </span>
                        )}
                        <span>{task.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {runResult && (
                <div className="playbook-run-result" style={{ marginTop: 16 }}>
                  <pre
                    style={{
                      color: runResult.success ? "green" : "red",
                      maxHeight: 200,
                      overflow: "auto",
                    }}
                  >
                    {runResult.success
                      ? runResult.output
                      : runResult.error || "Unknown error"}
                  </pre>
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedPlaybook(null);
                  setPlaybookSelected(false);
                }}
                className="back-button"
              >
                ← Back to Selection
              </button>
            </div>
          ) : (
            <>
              <h2>Cloud Hardening Playbooks</h2>
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

export default PlaybookSelection;
