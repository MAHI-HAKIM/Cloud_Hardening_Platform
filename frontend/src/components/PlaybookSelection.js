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

  // Fetch user devices from Firestore
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

  // Fetch playbooks from backend
  useEffect(() => {
    const fetchPlaybooks = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/getplaybooks/available"
        );
        const data = await res.json();
        setPlaybooks(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching playbooks:", err);
        setPlaybooks([]);
        setLoading(false);
      }
    };
    fetchPlaybooks();
  }, []);

  const handleRunPlaybook = async () => {
    setRunResult(null);
    const user = auth.currentUser;
    const device = devices.find((d) => d.id === selectedDevice);
    if (!device || !selectedPlaybook) {
      alert("Please select both a device and a playbook.");
      return;
    }
    setIsRunning(true);
    const payload = {
      host: device.ip,
      username: device.username,
      password: device.sshKey || device.password, // Use either sshKey or password
      port: device.port,
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
      setRunResult(result);
      if (result.success) {
        alert(
          `✅ Successfully executed ${
            selectedPlaybook.name || selectedPlaybook.fullPath
          } on ${device.deviceName}`
        );
      } else {
        alert(`❌ Failed: ${result.error || "Unknown error"}`);
      }
    } catch (err) {
      setRunResult({ success: false, error: err.message });
      alert("Failed to run hardening playbook");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <DashboardLayout activePage="hardening">
      <header className="dashboard-header">
        <h1>Cloud Hardening Playbooks</h1>
      </header>
      {console.log("Playbooks", playbooks)}

      <div className="dashboard-content-wrapper">
        <div className="form-panel device-selector-panel">
          <h2>Select Cloud Device</h2>
          <div className="form-group device-select-container">
            <label>Target Cloud Device:</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="form-input device-dropdown"
            >
              <option value="">Select a cloud device</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.deviceName} ({device.cloudProvider})
                </option>
              ))}
            </select>
          </div>

          {selectedPlaybook && (
            <div className="selected-playbook">
              <h3>Selected Hardening Playbook:</h3>
              <div className="playbook-badge">
                {selectedPlaybook.name ||
                  selectedPlaybook.fullPath.split("/").pop()}
              </div>
              <p className="playbook-description">
                {selectedPlaybook.description || "No description available"}
              </p>
              <button
                onClick={handleRunPlaybook}
                className="primary-button run-button"
                disabled={!selectedDevice || isRunning}
              >
                <FaPlay className="button-icon" />
                {isRunning ? "Running Hardening..." : "Run Hardening"}
              </button>
              {runResult && (
                <div className="playbook-run-result" style={{ marginTop: 16 }}>
                  {runResult.success ? (
                    <pre
                      style={{
                        color: "green",
                        maxHeight: 200,
                        overflow: "auto",
                      }}
                    >
                      {runResult.output}
                    </pre>
                  ) : (
                    <pre
                      style={{ color: "red", maxHeight: 200, overflow: "auto" }}
                    >
                      {runResult.error || "Unknown error"}
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
                    <div className="playbook-header">
                      <span className="playbook-name">
                        {playbook.name || playbook.fullPath.split("/").pop()}
                      </span>
                      <span className="playbook-category">
                        {playbook.category || "Uncategorized"}
                      </span>
                    </div>
                    <p className="playbook-description">
                      {playbook.description || "No description available"}
                    </p>
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
