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
  const lines = output.split('\n');
  const tasks = [];
  let currentTask = null;
  let capturingMsg = false;

  lines.forEach((line) => {
    const taskMatch = line.match(/TASK \[(.*?)\]/);
    if (taskMatch) {
      // Start a new task
      currentTask = { name: taskMatch[1], status: 'pending' };
      tasks.push(currentTask);
      capturingMsg = true; // prepare to capture msg for this task
    }

    if (capturingMsg) {
      const msgMatch = line.match(/"msg":\s*"?(PASS|FAIL)"?/);
      if (msgMatch && currentTask) {
        currentTask.status = msgMatch[1].toLowerCase(); // 'pass' or 'fail'
        capturingMsg = false;
      }
    }
  });

  return tasks;
};


  const handleRunAudit = async () => {
    setRunResult(null);
    setTaskProgress([]);
    const device = devices.find((d) => d.id === selectedDevice);
    if (!device || !selectedPlaybook) {
      alert("Please select both a device and a playbook.");
      return;
    }
    if (!devicePassword.trim()) {
      alert("Please enter the password for the selected device.");
      return;
    }

    setIsRunning(true);
    const payload = {
      host: device.ip,
      port: device.port || 22,
      username: device.username,
      password: devicePassword.trim(),
      playbookPath: selectedPlaybook.fullPath,
    };

    try {
      const response = await fetch("http://localhost:5000/api/ssh/run-playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      setRunResult(result);

      if (result.success) {
        alert(`\u2705 Audit completed on ${device.deviceName}`);
      } else {
        alert(`\u274C Failed: ${result.error || "Unknown error"}`);
      }

      if (result.output) {
        setTaskProgress(parseAnsibleOutput(result.output));
      }
    } catch (err) {
      alert("\u274C Request failed: " + err.message);
      setRunResult({ success: false, error: err.message });
    } finally {
      setIsRunning(false);
      setDevicePassword("");
    }
  };

  return (
    <DashboardLayout activePage="audit">
      <header className="dashboard-header">
        <h1>Firewall Audit</h1>
      </header>

      <div className="dashboard-content-wrapper" style={{ display: 'flex' }}>
        {!playbookSelected && (
          <div className="form-panel device-selector-panel" style={{ width: "40%" }}>
            <h2>Select Device and Audit Playbook</h2>

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

            <div className="form-group">
              <label>Device Password:</label>
              <input
                type="password"
                value={devicePassword}
                onChange={(e) => setDevicePassword(e.target.value)}
                className="form-input"
                placeholder="Enter device password"
                disabled={!selectedDevice}
              />
            </div>
          </div>
        )}

        <div className="dashboard-panel" style={{ width: playbookSelected ? "100%" : "60%" }}>
          {playbookSelected ? (
            <div>
              <h2>Selected Audit Playbook</h2>
              <div className="playbook-badge">{selectedPlaybook.name}</div>
              <p>{selectedPlaybook.fullPath}</p>
              <button
                onClick={handleRunAudit}
                className="primary-button run-button"
                disabled={!selectedDevice || !devicePassword || isRunning}
              >
                <FaPlay className="button-icon" />
                {isRunning ? "Running Audit..." : "Run Audit"}
              </button>

              {taskProgress.length > 0 && (
                <div className="playbook-progress-section" style={{ marginTop: 16 }}>
                  <h3>Audit Results</h3>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {taskProgress.map((task, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        {task.status === 'pass' ? (
                          <span style={{ color: 'green', marginRight: 8 }}>✔️</span>
                        ) : task.status === 'fail' ? (
                          <span style={{ color: 'red', marginRight: 8 }}>❌</span>
                        ) : (
                          <span style={{ color: 'gray', marginRight: 8 }}>⏳</span>
                        )}
                        <span>{task.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {taskProgress.length > 0 && (
                <div className="compliance-score" style={{ marginTop: '16px' }}>
                  <h3>Compliance Score</h3>
                  <p style={{ fontSize: '1.2em' }}>
                    {
                      (() => {
                        const total = taskProgress.length;
                        const passed = taskProgress.filter(t => t.status === 'pass').length;
                        const score = Math.round((passed / total) * 100);
                        return `✅ ${passed}/${total} checks passed (${score}%)`;
                      })()
                    }
                  </p>
                </div>
              )}

              <button
                onClick={() => navigate('/hardening')}
                className="primary-button"
                style={{ marginTop: 20 }}
              >
                Proceed to Hardening
              </button>

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
              <h2>Available Audit Playbooks</h2>
              {loading ? (
                <div className="loading-indicator">Loading playbooks...</div>
              ) : (
                <ul className="playbook-list">
                  {playbooks.map((playbook, idx) => (
                    <li key={playbook.fullPath || idx} className="playbook-item">
                      <div className="playbook-info">
                        <span className="playbook-name">{playbook.name}</span>
                        <span className="playbook-category">{playbook.category}</span>
                        <p className="playbook-description">{playbook.fullPath}</p>
                      </div>
                      <div className="playbook-actions">
                        <button
                          onClick={() => {
                            setSelectedPlaybook(playbook);
                            setPlaybookSelected(true);
                          }}
                          className="action-btn select-btn"
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
