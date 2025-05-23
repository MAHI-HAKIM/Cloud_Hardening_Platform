import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./components/Home.js";
import Login from "./components/Login.js";
import Signup from "./components/Signup.js";
import Dashboard from "./components/Dashboard.js";
import ProtectedRoute from "./ProtectedRoute.js";
import DeviceRegister from "./components/DeviceRegister.js";
import PlaybookSelection from "./components/PlaybookSelection.js";
import SshConnection from "./components/SshConnection.js";
import Audit from "./components/Audit.js";
import ForgotPassword from "./components/ForgotPassword.js";
import About from "./components/About.js";
import Contact from "./components/Contact.js";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/deviceRegistration" element={<DeviceRegister />} />
      <Route path="/hardening" element={<PlaybookSelection />} />
      <Route path="/sshConnection" element={<SshConnection />} />
      <Route path="/audit" element={<Audit />} />
      <Route path="/forgetPass" element={<ForgotPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
