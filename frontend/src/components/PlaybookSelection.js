import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import DashboardLayout from "./DashboardLayout";
import { FaPlay } from "react-icons/fa";

const PlaybookSelection = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [devicePassword, setDevicePassword] = useState("");
  const [playbooks, setPlaybooks] = useState([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

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
    const fetchPlaybooks = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/getplaybooks/available");
        const data = await res.json();
        setPlaybooks(data);
      } catch {
        setPlaybooks([]);
      }
    };
    fetchPlaybooks();
  }, []);

  const handleRunPlaybook = async () => {
    setRunResult(null);
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
        alert(`✅ Successfully executed ${selectedPlaybook.name} on ${device.deviceName}`);
      } else {
        alert(`❌ Failed: ${result.error || "Unknown error"}`);
      }
    } catch (err) {
      alert("❌ Request failed: " + err.message);
      setRunResult({ success: false, error: err.message });
    } finally {
      setIsRunning(false);
      setDevicePassword(""); // Clear password after use
    }
  };

  return (
    <DashboardLayout activePage="hardening">
      <header className="dashboard-header">
        <h1>Cloud Hardening Playbooks</h1>
      </header>

      <div className="dashboard-content-wrapper">
        <div className="form-panel device-selector-panel">
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

          <div className="form-group">
            <label>Enter Password to Confirm Selection:</label>
            <input
              type="password"
              value={devicePassword}
              onChange={(e) => setDevicePassword(e.target.value)}
              className="form-input"
              placeholder="Enter device password"
              disabled={!selectedDevice}
              required
            />
          </div>

          {selectedPlaybook && (
            <div className="selected-playbook">
              <h3>Selected Hardening Playbook:</h3>
              <div className="playbook-badge">
                {selectedPlaybook.name || selectedPlaybook.fullPath}
              </div>
              <p className="playbook-description">
                {selectedPlaybook.description || selectedPlaybook.fullPath}
              </p>
              <button
                onClick={handleRunPlaybook}
                className="primary-button run-button"
                disabled={!selectedDevice || !devicePassword || isRunning}
              >
                <FaPlay className="button-icon" />
                {isRunning ? "Running Hardening..." : "Run Hardening"}
              </button>
              {runResult && (
                <div className="playbook-run-result" style={{ marginTop: 16 }}>
                  {runResult.success ? (
                    <pre style={{ color: 'green', maxHeight: 200, overflow: 'auto' }}>
                      {runResult.output}
                    </pre>
                  ) : (
                    <pre style={{ color: 'red', maxHeight: 200, overflow: 'auto' }}>
                      {runResult.error || 'Unknown error'}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <h2>Cloud Hardening Playbooks</h2>
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
                      onClick={() => setSelectedPlaybook(playbook)}
                      className="action-btn select-btn"
                    >
                      Select
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PlaybookSelection;
