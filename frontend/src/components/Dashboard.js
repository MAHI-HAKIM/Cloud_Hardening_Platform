import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

// Import components
import DashboardLayout from "./DashboardLayout";
import DeviceList from "./dashboard/DeviceList";
import AuditSummary from "./dashboard/AuditSummary";
import QuickActions from "./dashboard/QuickActions";
import StatusCard from "./dashboard/StatusCard";

function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [lastAudit, setLastAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch registered devices from Firestore
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
          setDevices(results);
        } catch (err) {
          console.error("Error fetching devices:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDevices();
  }, []);

  // Fetch last audit info
  useEffect(() => {
    const fetchAudits = async () => {
      const user = auth.currentUser;
      if (user && devices.length > 0) {
        try {
          const q = query(
            collection(db, "audits"),
            where("email", "==", user.email),
            orderBy("date", "desc"),
            limit(1)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const audit = snapshot.docs[0].data();
            setLastAudit(audit);
          } else {
            setLastAudit(null);
          }
        } catch (err) {
          console.error("Failed to fetch audits:", err);
        }
      } else {
        setLastAudit(null);
      }
    };

    fetchAudits();
  }, [devices]); // Run after devices are loaded

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <DashboardLayout activePage="dashboard">
      <header className="dashboard-header">
        <h1>Cloud Hardening Dashboard</h1>
      </header>

      <div className="dashboard-grid">
        <DeviceList devices={devices} />
        <QuickActions />
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
