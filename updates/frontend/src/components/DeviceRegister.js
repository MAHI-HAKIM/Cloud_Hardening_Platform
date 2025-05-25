import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import DashboardLayout from "./DashboardLayout";

const DeviceRegister = () => {
  const navigate = useNavigate();
  const [cloudProvider, setCloudProvider] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");
  const [username, setUsername] = useState("");
  const [sshKey, setSshKey] = useState("");
  const [authMethod, setAuthMethod] = useState("sshKey");
  const [password, setPassword] = useState("");
  const [devices, setDevices] = useState([]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user) {
      alert("No user is logged in. Please log in first.");
      navigate("/login");
      return;
    }

    if (!ip || !deviceName || !cloudProvider || !username || !port) {
      alert("All fields except SSH Key/Password are required.");
      return;
    }

    // Ensure port is stored as a number
    const portNumber = Number(port);
    if (isNaN(portNumber) || portNumber <= 0) {
      alert("Port must be a valid positive number.");
      return;
    }

    try {
      await addDoc(collection(db, "devices"), {
        cloudProvider,
        deviceName,
        ip,
        port: portNumber,
        username,
        sshKey:
          authMethod === "sshKey"
            ? sshKey.trim() === ""
              ? null
              : sshKey
            : null,
        password:
          authMethod === "password"
            ? password.trim() === ""
              ? null
              : password
            : null,
        email: user.email,
        registeredDate: new Date(),
        lastUpdated: new Date(),
      });
      alert("Device registered successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error registering device:", error);
      alert("Failed to register the device. Please try again.");
    }
  };

  return (
    <DashboardLayout activePage="deviceRegistration">
      <header className="dashboard-header">
        <h1>Cloud Device Registration</h1>
      </header>

      <div className="dashboard-content-wrapper">
        <div className="form-panel">
          <h2>Register a New Cloud Device</h2>
          <form onSubmit={handleSubmit} className="device-form">
            <div className="form-group">
              <label>Cloud Provider:</label>
              <select
                value={cloudProvider}
                onChange={(e) => setCloudProvider(e.target.value)}
                className="form-input"
                required
              >
                <option value="">Select a Cloud Provider</option>
                <option value="AWS">AWS</option>
                <option value="Azure">Azure</option>
                <option value="GCP">GCP</option>
                <option value="DigitalOcean">DigitalOcean</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Device Name:</label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Enter device name"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>IP Address:</label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="Enter IP address"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Port:</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="Enter port number"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g., ubuntu)"
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
                required
              >
                <option value="sshKey">SSH Key</option>
                <option value="password">Password</option>
              </select>
            </div>

            {authMethod === "sshKey" ? (
              <div className="form-group">
                <label>SSH Key:</label>
                <textarea
                  value={sshKey}
                  onChange={(e) => setSshKey(e.target.value)}
                  placeholder="Paste your SSH key here"
                  className="form-textarea"
                  required={authMethod === "sshKey"}
                ></textarea>
              </div>
            ) : (
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your SSH password"
                  className="form-input"
                  required={authMethod === "password"}
                />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="primary-button">
                Register Device
              </button>
            </div>
          </form>
        </div>

        <div className="dashboard-panel">
          <h2>Your Registered Cloud Devices</h2>
          {devices.length > 0 ? (
            <div className="table-container">
              <table className="device-list">
                <thead>
                  <tr>
                    <th>Device Name</th>
                    <th>Cloud Provider</th>
                    <th>IP Address</th>
                    <th>Username</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id}>
                      <td>{device.deviceName}</td>
                      <td>{device.cloudProvider}</td>
                      <td>{device.ip}</td>
                      <td>{device.username}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-message">No devices registered yet.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DeviceRegister;
