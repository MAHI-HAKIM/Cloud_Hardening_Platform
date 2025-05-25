import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const SSHConnection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [host, setHost] = useState("");
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState("");
  const [authMethod, setAuthMethod] = useState("password");
  const [passwordOrKey, setPasswordOrKey] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [isConnecting, setIsConnecting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [sshCommand, setSshCommand] = useState("");
  const logRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchDevices = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(
          collection(db, "devices"),
          where("email", "==", user.email)
        );
        const querySnapshot = await getDocs(q);
        setDevices(
          querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    };
    fetchDevices();
  }, []);

  const handleHostChange = (e) => {
    const value = e.target.value;
    setHost(value);
    if (value.length > 0) {
      const filtered = devices.filter(
        (d) =>
          d.ip &&
          (d.ip.toLowerCase().includes(value.toLowerCase()) ||
            (d.deviceName &&
              d.deviceName.toLowerCase().includes(value.toLowerCase())))
      );
      setFilteredDevices(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleHostFocus = () => {
    if (host.length > 0 || filteredDevices.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleDeviceSelect = (device) => {
    setHost(device.ip);
    setPort(device.port || 22);
    setUsername(device.username || "");
    setShowDropdown(false);
  };

  const handleConnect = (e) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectionStatus("Connecting...");
    setLogs([]);

    const url = new URL("http://localhost:5000/api/ssh/stream-connect");
    url.searchParams.set("host", host);
    url.searchParams.set("port", port);
    url.searchParams.set("username", username);
    url.searchParams.set("authMethod", authMethod);
    url.searchParams.set("passwordOrKey", passwordOrKey);

    const eventSource = new EventSource(url.toString());

    eventSource.onmessage = (event) => {
      const line = event.data;
      setLogs((prev) => [...prev, line]);
      if (line.includes("SSH connection succeeded")) {
        setConnectionStatus("Connected");
      }
      if (line.includes("SSH connection failed")) {
        setConnectionStatus("Connection Failed");
      }
    };

    eventSource.onerror = (err) => {
      console.error("❌ SSE error:", err);
      eventSource.close();
      setConnectionStatus("Connection Failed");
      setIsConnecting(false);
    };

    eventSource.addEventListener("end", () => {
      eventSource.close();
      setIsConnecting(false);
    });
  };

  return (
    <DashboardLayout activePage="sshConnection">
      <header className="dashboard-header">
        <h1>SSH Connection</h1>
      </header>

      <div className="dashboard-content-wrapper">
        <div className="form-panel">
          <div className="panel-header">
            <div
              className={`connection-indicator ${connectionStatus
                .toLowerCase()
                .replace(" ", "-")}`}
            ></div>
            <h2>Establish SSH Connection</h2>
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

          <form onSubmit={handleConnect} className="ssh-form">
            <div className="form-group" style={{ position: "relative" }}>
              <label>Host/IP Address:</label>
              <input
                type="text"
                placeholder="Enter host or IP address"
                value={host}
                onChange={handleHostChange}
                onFocus={handleHostFocus}
                className="form-input"
                required
              />
              {showDropdown && (
                <div
                  className="device-dropdown"
                  style={{
                    border: "1px solid #ccc",
                    background: "#fff",
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    maxHeight: "200px",
                    overflowY: "auto",
                    borderRadius: "4px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  {filteredDevices.length > 0 ? (
                    filteredDevices.map((device) => (
                      <div
                        key={device.id}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                          display: "flex",
                          justifyContent: "space-between",
                          backgroundColor: "#f4f4f4",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#e0e0e0";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#f4f4f4";
                        }}
                        onClick={() => handleDeviceSelect(device)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div>
                          <span
                            style={{
                              fontWeight: "bold",
                              color: "#333",
                              marginRight: "10px",
                            }}
                          >
                            {device.deviceName || "Unnamed Device"}
                          </span>
                          <span
                            style={{
                              color: "#0066cc",
                              fontFamily: "monospace",
                              backgroundColor: "#f0f0f0",
                              padding: "2px 4px",
                              borderRadius: "3px",
                            }}
                          >
                            {device.ip}
                          </span>
                        </div>
                        {device.port && (
                          <span
                            style={{
                              color: "#666",
                              fontSize: "0.8em",
                              backgroundColor: "#e6e6e6",
                              padding: "2px 4px",
                              borderRadius: "3px",
                            }}
                          >
                            Port: {device.port}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "8px",
                        color: "#666",
                        textAlign: "center",
                        fontStyle: "italic",
                      }}
                    >
                      No matching devices found
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Port:</label>
              <input
                type="number"
                placeholder="SSH port (default: 22)"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                placeholder="SSH username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Authentication Method:</label>
              <select
                value={authMethod}
                onChange={(e) => setAuthMethod(e.target.value)}
                className="form-input"
              >
                <option value="password">Password</option>
                <option value="key">SSH Key</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                {authMethod === "password" ? "Password:" : "SSH Key:"}
              </label>
              {authMethod === "password" ? (
                <input
                  type="password"
                  placeholder="Enter password"
                  value={passwordOrKey}
                  onChange={(e) => setPasswordOrKey(e.target.value)}
                  className="form-input"
                  required
                />
              ) : (
                <textarea
                  placeholder="Paste SSH key"
                  value={passwordOrKey}
                  onChange={(e) => setPasswordOrKey(e.target.value)}
                  className="form-textarea"
                  required
                ></textarea>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </button>
            </div>
          </form>
        </div>

        <div className="dashboard-panel info-panel">
          <h3>SSH Interaction Logs:</h3>
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
            {logs.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
          {sshCommand && (
            <div className="ssh-command-display">
              <h3>SSH Command:</h3>
              <pre
                style={{
                  backgroundColor: "#222",
                  padding: "10px",
                  borderRadius: "4px",
                  color: "#fff",
                }}
              >
                {sshCommand}
              </pre>
            </div>
          )}
          <h2>SSH Connection Information</h2>
          <div className="info-content">
            <p>
              Establish a secure SSH connection to your network devices for
              configuration management and hardening.
            </p>
            <h3>Connection Tips:</h3>
            <ul>
              <li>Ensure the device is reachable from your current network</li>
              <li>Verify SSH service is running on the target device</li>
              <li>Double-check your credentials before connecting</li>
              <li>Use SSH keys for more secure authentication when possible</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SSHConnection;
