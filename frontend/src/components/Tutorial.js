import React from 'react';
import '../index.css';
import { FaSignInAlt, FaServer, FaCode, FaPlayCircle, FaChartBar, FaSignOutAlt, FaShieldAlt } from 'react-icons/fa'; // Example icons

function Tutorial() {
    return (
        <section className="tutorial-section">
            <h2 className="tutorial-title">Getting Started Guide</h2>
            <ol className="tutorial-steps">
                <li><FaSignInAlt className="tutorial-icon" /> Sign up or log in to your account.</li>
                <li><FaServer className="tutorial-icon" /> Register your firewall device in the dashboard.</li>
                <li><FaCode className="tutorial-icon" /> Establish an SSH connection to your web server through the firewall.</li>
                <li><FaCode className="tutorial-icon" /> Navigate to the playbook selection and choose an appropriate playbook.</li>
                <li><FaPlayCircle className="tutorial-icon" /> Execute the playbook to apply firewall configurations.</li>
                <li><FaShieldAlt className="tutorial-icon" /> Audit the security hardening of the firewall.</li>
                <li><FaChartBar className="tutorial-icon" /> Review logs and reports for execution status and refinement.</li>
                <li><FaSignOutAlt className="tutorial-icon" /> Log out securely.</li>
            </ol>
            <p className="tutorial-footer">For more details, check the documentation or contact support.</p>
        </section>
    );
}

export default Tutorial;