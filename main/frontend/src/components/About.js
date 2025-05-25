import React from "react";
import { motion } from "framer-motion";
import { FaShieldAlt, FaServer, FaLock, FaChartLine } from "react-icons/fa";
import Navbar from "./Navbar";
import Footer from "./Footer";

const About = () => {
  const features = [
    {
      icon: <FaShieldAlt />,
      title: "Advanced Security",
      description:
        "State-of-the-art firewall protection and threat detection systems.",
    },
    {
      icon: <FaServer />,
      title: "Cloud Integration",
      description:
        "Seamless integration with major cloud platforms and services.",
    },
    {
      icon: <FaLock />,
      title: "Compliance",
      description:
        "Meet industry standards and regulatory requirements with ease.",
    },
    {
      icon: <FaChartLine />,
      title: "Analytics",
      description:
        "Real-time monitoring and advanced analytics for security insights.",
    },
  ];

  return (
    <div className="about-container">
      <Navbar />

      <section className="about-hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="about-content"
        >
          <h1>About CyberShield</h1>
          <p className="about-subtitle">Protecting Your Digital Frontier</p>
          <div className="about-description">
            <p>
              CyberShield is a cutting-edge cybersecurity platform designed to
              protect your digital assets with advanced firewall hardening and
              cloud security solutions. Our mission is to provide
              enterprise-grade security tools that are accessible, efficient,
              and easy to implement.
            </p>
          </div>
        </motion.div>
      </section>

      <section className="about-features">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="section-title"
        >
          Our Core Features
        </motion.h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="about-mission">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mission-content"
        >
          <h2>Our Mission</h2>
          <p>
            We're committed to making enterprise-grade security accessible to
            organizations of all sizes. By combining cutting-edge technology
            with user-friendly interfaces, we're revolutionizing how businesses
            protect their digital assets.
          </p>
        </motion.div>
      </section>

      <section className="about-team">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="section-title"
        >
          Our Team
        </motion.h2>
        <div className="team-grid">
          {[
            {
              name: "Alex Chen",
              role: "Security Architect",
              description: "10+ years of experience in cybersecurity",
            },
            {
              name: "Sarah Miller",
              role: "Cloud Security Expert",
              description: "Specialized in cloud infrastructure security",
            },
            {
              name: "David Park",
              role: "Lead Developer",
              description: "Expert in security automation and AI",
            },
          ].map((member, index) => (
            <motion.div
              key={index}
              className="team-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <h3>{member.name}</h3>
              <p className="role">{member.role}</p>
              <p className="description">{member.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
