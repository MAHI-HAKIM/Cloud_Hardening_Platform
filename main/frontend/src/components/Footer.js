import React from "react";
import { FaGithub, FaLinkedin, FaTwitter, FaShieldAlt } from "react-icons/fa";
import "../index.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <FaShieldAlt className="footer-logo" />
          <span>CyberShield</span>
        </div>

        <div className="footer-links">
          <div className="footer-section">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#documentation">Documentation</a>
          </div>

          <div className="footer-section">
            <h4>Company</h4>
            <a href="#about">About</a>
            <a href="#careers">Careers</a>
            <a href="#contact">Contact</a>
          </div>

          <div className="footer-section">
            <h4>Resources</h4>
            <a href="#blog">Blog</a>
            <a href="#support">Support</a>
            <a href="#privacy">Privacy Policy</a>
          </div>
        </div>

        <div className="footer-social">
          <a href="#" className="social-link">
            <FaGithub />
          </a>
          <a href="#" className="social-link">
            <FaLinkedin />
          </a>
          <a href="#" className="social-link">
            <FaTwitter />
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2024 CyberShield. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
