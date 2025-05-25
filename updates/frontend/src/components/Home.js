import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaShieldAlt,
  FaServer,
  FaLock,
  FaChartLine,
  FaArrowRight,
  FaChevronDown,
} from "react-icons/fa";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      title: "Advanced Firewall Hardening",
      description:
        "Protect your network with state-of-the-art firewall configurations and security protocols.",
      icon: <FaShieldAlt />,
      color: "#00ff9f",
    },
    {
      title: "Cloud Security Solutions",
      description:
        "Secure your cloud infrastructure with our comprehensive security suite.",
      icon: <FaServer />,
      color: "#00b8ff",
    },
    {
      title: "Compliance & Standards",
      description:
        "Meet industry standards and regulatory requirements with our security solutions.",
      icon: <FaLock />,
      color: "#ff00ff",
    },
  ];

  const faqs = [
    {
      question: "What is Firewall Hardening?",
      answer:
        "Firewall hardening is the process of securing a firewall by reducing its attack surface and removing unnecessary services. It involves configuring the firewall to only allow necessary traffic and implementing strict security policies.",
      category: "Firewall Hardening",
    },
    {
      question: "How does Cloud Hardening work?",
      answer:
        "Cloud hardening involves implementing security measures to protect cloud infrastructure, including access control, encryption, network security, and monitoring. It helps prevent unauthorized access and data breaches.",
      category: "Cloud Security",
    },
    {
      question: "What security standards do you support?",
      answer:
        "We support various security standards including ISO 27001, NIST, CIS, and PCI DSS. Our solutions help organizations meet compliance requirements while maintaining robust security.",
      category: "Compliance",
    },
    {
      question: "How do you handle zero-day vulnerabilities?",
      answer:
        "We employ advanced threat detection systems and maintain a rapid response protocol for zero-day vulnerabilities. Our team continuously monitors for new threats and provides immediate updates and patches.",
      category: "Security",
    },
    {
      question: "What is the deployment process?",
      answer:
        "Our deployment process is streamlined and secure. We begin with a security assessment, followed by a customized implementation plan, and provide ongoing support and monitoring.",
      category: "Deployment",
    },
  ];

  const blogPosts = [
    {
      title: "The Future of Network Security",
      excerpt:
        "Exploring emerging trends and technologies in network security...",
      date: "March 15, 2024",
      category: "Network Security",
    },
    {
      title: "Cloud Security Best Practices",
      excerpt: "Essential strategies for securing your cloud infrastructure...",
      date: "March 10, 2024",
      category: "Cloud Security",
    },
    {
      title: "Understanding Firewall Rules",
      excerpt: "A comprehensive guide to effective firewall configuration...",
      date: "March 5, 2024",
      category: "Firewall",
    },
  ];

  // Automatic slide functionality
  useEffect(() => {
    if (isPaused) return;

    const slideInterval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 5000);

    return () => clearInterval(slideInterval);
  }, [isPaused, slides.length]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
    // Pause auto-sliding briefly when user manually selects a slide
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 8000);
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />

      <section className="hero-section">
        <div className="hero-background">
          <div className="neon-grid"></div>

          <div className="floating-shapes">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="floating-shape"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.3, 1],
                  x: Math.random() * 200 - 100,
                  y: Math.random() * 200 - 100,
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: `radial-gradient(circle, 
                    rgba(${Math.random() * 255}, ${Math.random() * 255}, ${
                    Math.random() * 255
                  }, 0.3) 0%,
                    transparent 70%)`,
                }}
                whileHover={{
                  scale: 1.5,
                  opacity: 1,
                  transition: { duration: 0.3 },
                }}
              />
            ))}
          </div>

          <div className="cyber-particles">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="cyber-particle"
                initial={{
                  opacity: 0,
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                animate={{
                  opacity: [0, 0.8, 0],
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
                whileHover={{
                  scale: 2,
                  opacity: 1,
                  transition: { duration: 0.2 },
                }}
              />
            ))}
          </div>

          <div className="floating-cubes">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`cube-${i}`}
                className="cube"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  rotate: 360,
                  x: [0, Math.random() * 300 - 150],
                  y: [0, Math.random() * 300 - 150],
                  z: [0, Math.random() * 300 - 150],
                }}
                transition={{
                  duration: 20 + i * 2,
                  repeat: Infinity,
                  delay: i * 1.5,
                }}
                whileHover={{
                  scale: 1.5,
                  opacity: 1,
                  transition: { duration: 0.3 },
                }}
              >
                <div className="cube-face front"></div>
                <div className="cube-face back"></div>
                <div className="cube-face right"></div>
                <div className="cube-face left"></div>
                <div className="cube-face top"></div>
                <div className="cube-face bottom"></div>
              </motion.div>
            ))}
          </div>
        </div>

        <div
          className="hero-content"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="slide-content"
            >
              <motion.div
                className="slide-icon"
                style={{ color: slides[currentSlide].color }}
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {slides[currentSlide].icon}
              </motion.div>
              <motion.h1
                className="hero-title"
                initial={{
                  backgroundImage: `linear-gradient(135deg, ${slides[currentSlide].color}, #ffffff)`,
                }}
                animate={{
                  backgroundImage: `linear-gradient(135deg, ${slides[currentSlide].color}, #ffffff)`,
                }}
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: `0 0 15px ${slides[currentSlide].color}, 0 0 30px ${slides[currentSlide].color}`,
                }}
              >
                {slides[currentSlide].title}
              </motion.h1>
              <p className="hero-description">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.button
            className="get-started-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            style={{
              background: `linear-gradient(90deg, ${slides[currentSlide].color}, rgba(255,255,255,0.8))`,
            }}
          >
            Get Started
            <motion.div
              animate={{ x: isHovered ? 5 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FaArrowRight />
            </motion.div>
          </motion.button>

          <div className="slide-indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`slide-indicator ${
                  currentSlide === index ? "active" : ""
                }`}
                onClick={() => handleSlideChange(index)}
                style={{
                  backgroundColor:
                    currentSlide === index
                      ? slides[index].color
                      : "var(--text-secondary)",
                  boxShadow:
                    currentSlide === index
                      ? `0 0 10px ${slides[index].color}`
                      : "none",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-container">
          <motion.div
            className="stat-item"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3>99.9%</h3>
            <p>Uptime Guarantee</p>
          </motion.div>
          <motion.div
            className="stat-item"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3>24/7</h3>
            <p>Security Monitoring</p>
          </motion.div>
          <motion.div
            className="stat-item"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <h3>1000+</h3>
            <p>Protected Networks</p>
          </motion.div>
        </div>
      </section>

      <section className="features-section">
        <h2 className="features-title">Our Features</h2>
        <div className="features-container">
          {[
            {
              icon: <FaShieldAlt />,
              title: "Advanced Firewall",
              description:
                "State-of-the-art firewall protection with real-time threat detection.",
            },
            {
              icon: <FaServer />,
              title: "Cloud Security",
              description:
                "Comprehensive cloud security solutions for all major platforms.",
            },
            {
              icon: <FaChartLine />,
              title: "Analytics",
              description:
                "Real-time monitoring and advanced analytics for security insights.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="feature-item"
              whileHover={{ scale: 1.05 }}
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

      <section className="blog-section">
        <h2 className="section-title">Latest from Our Blog</h2>
        <div className="blog-grid">
          {blogPosts.map((post, index) => (
            <motion.article
              key={index}
              className="blog-card"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <span className="blog-category">{post.category}</span>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <span className="blog-date">{post.date}</span>
              <Link to="/blog" className="read-more">
                Read More <FaArrowRight />
              </Link>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="faq-item"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="faq-question" onClick={() => toggleFaq(index)}>
                <h3>{faq.question}</h3>
                <motion.div
                  animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaChevronDown />
                </motion.div>
              </div>
              <AnimatePresence>
                {expandedFaq === index && (
                  <motion.div
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{faq.answer}</p>
                    <span className="faq-category">{faq.category}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Secure Your Network?</h2>
        <motion.button
          className="cta-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Get Started Now
        </motion.button>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
