import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaShieldAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import Footer from "./Footer";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard", { state: { email } });
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="auth-page">
        <div className="auth-background">
          <div className="cyber-grid"></div>
          <div className="floating-particles">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="auth-particle"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                  x: [0, Math.random() * 100 - 50],
                  y: [0, Math.random() * 100 - 50],
                }}
                transition={{
                  duration: 5 + Math.random() * 5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>

        <motion.div
          className="auth-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-logo">
            <FaShieldAlt />
            <h1>CyberShield</h1>
          </div>

          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Access your secure dashboard</p>

          {error && (
            <motion.div
              className="auth-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
            </div>

            <motion.button
              type="submit"
              className="auth-button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </motion.button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account?</p>
            <Link to="/signup" className="auth-link">
              Create Account
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}

export default Login;
