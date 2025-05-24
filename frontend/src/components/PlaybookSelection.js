import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import DashboardLayout from "./DashboardLayout";
import { FaPlay, FaTerminal } from "react-icons/fa";

const PlaybookSelection = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [devicePassword, setDevicePassword] = useState("");
  const [playbooks, setPlaybooks] = useState([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Not Started");
  const logRef = useRef(null);

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
        const res = await fetch(
          "http://localhost:5000/api/getplaybooks/available"
        );
        const data = await res.json();
        setPlaybooks(data);
      } catch {
        setPlaybooks([]);
      }
    };
    fetchPlaybooks();
  }, []);

  // Scroll to bottom of logs when logs change
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const handleRunPlaybook = (e) => {
    e.preventDefault();
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
    setConnectionStatus("Connecting...");
    setLogs([]);

    const url = new URL("http://localhost:5000/api/ssh/stream-playbook");
    url.searchParams.set("host", device.ip);
    url.searchParams.set("port", device.port || "22");
    url.searchParams.set("username", device.username);
    url.searchParams.set("password", devicePassword);
    url.searchParams.set("playbookPath", selectedPlaybook.fullPath);

    const eventSource = new EventSource(url.toString());

    eventSource.onmessage = (event) => {
      const line = event.data;
      setLogs((prev) => [...prev, line]);

      if (line.includes("Playbook execution started")) {
        setConnectionStatus("Running Hardening...");
      }
      if (line.includes("Playbook execution completed")) {
        setConnectionStatus("Hardening Completed");
        eventSource.close();
        setIsRunning(false);
      }
      if (line.includes("Playbook execution failed")) {
        setConnectionStatus("Hardening Failed");
        eventSource.close();
        setIsRunning(false);
      }
    };

    eventSource.onerror = (err) => {
      console.error("❌ SSE error:", err);
      eventSource.close();
      setConnectionStatus("Connection Failed");
      setIsRunning(false);
    };
  };

  return (
    <DashboardLayout activePage="hardening">
      <header className="dashboard-header">
        <h1>Cloud Hardening Playbooks</h1>
      </header>

      <div className="dashboard-content-wrapper playbooks-container">
        <div className="form-panel device-selector-panel">
          <div className="panel-header">
            <div
              className={`connection-indicator ${connectionStatus
                .toLowerCase()
                .replace(" ", "-")}`}
            ></div>
            <h2>Establish Hardening Playbook</h2>
          </div>

          <div className="status-display">
            <span className="status-label">Status:</span>
            <span
              className={`status-value ${connectionStatus
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              {connectionStatus}
            </span>
          </div>

          <form onSubmit={handleRunPlaybook} className="ssh-form">
            <div className="form-group">
              <label>Target Cloud Device:</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="form-input"
                required
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
              <label>Enter Device Password:</label>
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
                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={!selectedDevice || !devicePassword || isRunning}
                  >
                    <FaPlay className="button-icon" />
                    {isRunning ? "Running Hardening..." : "Start Hardening"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="dashboard-panel info-panel">
          <h3>Hardening Interaction Logs:</h3>
          <div
            ref={logRef}
            style={{
              backgroundColor: "#111",
              padding: "10px",
              height: "300px",
              overflowY: "auto",
              border: "1px solid #333",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              fontSize: "0.9em",
            }}
          >
            {logs.length > 0 ? (
              logs.map((line, idx) => <div key={idx}>{line}</div>)
            ) : (
              <div style={{ color: "#666", textAlign: "center" }}>
                {loading
                  ? "Loading playbooks..."
                  : "No logs yet. Start hardening to see logs."}
              </div>
            )}
          </div>

          {!isRunning && (
            <div className="dashboard-panel">
              <h2>Cloud Hardening Playbooks</h2>
              <ul className="playbook-list">
                {playbooks.map((playbook, idx) => (
                  <li key={playbook.fullPath || idx} className="playbook-item">
                    <div className="playbook-info">
                      <span className="playbook-name">{playbook.name}</span>
                      <span className="playbook-category">
                        {playbook.category}
                      </span>
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
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PlaybookSelection;
