import React from "react";
import { FaCheckCircle } from "react-icons/fa";

function DeviceList({ devices }) {
  if (!devices || devices.length === 0) {
    return (
      <section className="dashboard-panel">
        <h2>Your Registered Devices</h2>
        <p className="empty-message">No devices registered yet.</p>
      </section>
    );
  }

  return (
    <section className="dashboard-panel">
      <h2>Your Registered Devices</h2>
      <div className="table-container">
        <table className="device-list">
          <thead>
            <tr>
              <th>Device Name</th>
              <th>IP Address</th>
              <th>Firewall Brand</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td>{device.deviceName}</td>
                <td>{device.ip}</td>
                <td>{device.firewallBrand}</td>
                <td>
                  {device.status === "Active" ? (
                    <FaCheckCircle className="status-icon active" />
                  ) : (
                    <span className="status-text">
                      {device.status || "Unknown"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default DeviceList;
