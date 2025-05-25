#!/bin/bash
# =============================================================================
# Server Hardening Script for Network Security Demonstration
# 
# This script automates security hardening for Ubuntu servers with:
# - UFW firewall configuration
# - SSH hardening
# - Non-root user creation with SSH key access
# - Fail2Ban installation and configuration
# - Automatic security updates
# - System auditing tools
# 
# Usage: sudo bash server_hardening.sh
# =============================================================================

# Exit on any error
set -e

# Function to print section headers
print_section() {
    echo "===================================================="
    echo "  $1"
    echo "===================================================="
}

# Function to check if script is run as root
check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        echo "This script must be run as root" >&2
        exit 1
    fi
}

# Function to update system packages
update_system() {
    print_section "Updating System Packages"
    apt update
    apt upgrade -y
}

# Function to install essential security packages
install_security_packages() {
    print_section "Installing Security Packages"
    apt install -y ufw fail2ban unattended-upgrades apt-listchanges apticron auditd lynis
}

# Function to configure firewall (UFW)
configure_firewall() {
    print_section "Configuring Firewall (UFW)"
    
    # Check if UFW is already enabled
    if ufw status | grep -q "Status: active"; then
        echo "UFW is already enabled. Reconfiguring..."
        ufw disable
    fi
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow essential services
    ufw allow ssh
    ufw allow http
    ufw allow https
    
    # Enable logging
    ufw logging on
    
    # Enable the firewall (non-interactive)
    echo "y" | ufw enable
    
    echo "UFW firewall configured and enabled"
    ufw status verbose
}

# Function to create non-root user with sudo privileges
create_admin_user() {
    print_section "Creating Non-Root User"
    
    # Prompt for username
    read -p "Enter username for new admin user: " USERNAME
    
    # Check if user already exists
    if id "$USERNAME" &>/dev/null; then
        echo "User $USERNAME already exists. Skipping user creation."
    else
        # Create user
        adduser --gecos "" $USERNAME
        
        # Add to sudo group
        usermod -aG sudo $USERNAME
        
        echo "User $USERNAME created and added to sudo group"
    fi
    
    # Set up SSH key authentication
    mkdir -p /home/$USERNAME/.ssh
    touch /home/$USERNAME/.ssh/authorized_keys
    
    echo "Paste your public SSH key and press Ctrl+D when done:"
    cat > /home/$USERNAME/.ssh/authorized_keys
    
    # Set proper permissions
    chown -R $USERNAME:$USERNAME /home/$USERNAME/.ssh
    chmod 700 /home/$USERNAME/.ssh
    chmod 600 /home/$USERNAME/.ssh/authorized_keys
    
    echo "SSH key authentication configured for user $USERNAME"
}

# Function to harden SSH configuration
harden_ssh() {
    print_section "Hardening SSH Configuration"
    
    # Backup original configuration
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
    
    # Apply security configurations
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
    sed -i 's/#PermitEmptyPasswords no/PermitEmptyPasswords no/' /etc/ssh/sshd_config
    sed -i 's/#ClientAliveInterval 0/ClientAliveInterval 300/' /etc/ssh/sshd_config
    sed -i 's/#ClientAliveCountMax 3/ClientAliveCountMax 2/' /etc/ssh/sshd_config
    
    # Restart SSH service
    systemctl restart sshd
    
    echo "SSH hardened: root login disabled, password auth disabled, key auth enabled"
}

# Function to configure Fail2Ban
configure_fail2ban() {
    print_section "Configuring Fail2Ban"
    
    # Create custom configuration
    cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
    
    # Configure SSH jail
    cat > /etc/fail2ban/jail.d/custom.conf << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600

[sshd-aggressive]
enabled = true
port = ssh
filter = sshd-aggressive
logpath = /var/log/auth.log
maxretry = 5
bantime = 86400
findtime = 3600

[http-auth]
enabled = true
port = http,https
filter = apache-auth
logpath = /var/log/apache2/error.log
maxretry = 3
bantime = 3600

[http-badbots]
enabled = true
port = http,https
filter = apache-badbots
logpath = /var/log/apache2/access.log
maxretry = 2
bantime = 86400
EOF
    
    # Enable and restart Fail2Ban
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    echo "Fail2Ban configured with SSH and HTTP protection"
    fail2ban-client status
}

# Function to configure automatic security updates
configure_auto_updates() {
    print_section "Configuring Automatic Updates"
    
    # Configure automatic updates
    cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF
    
    # Configure security updates only
    cat > /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}";
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::Package-Blacklist {
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::InstallOnShutdown "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
    
    echo "Automatic security updates configured"
}

# Function to configure system auditing
configure_auditing() {
    print_section "Configuring System Auditing"
    
    # Enable auditing
    auditctl -e 1
    
    # Configure audit rules
    cat > /etc/audit/rules.d/audit.rules << EOF
# Monitor file system mounts
-a always,exit -F arch=b64 -S mount -S umount2 -k mount

# Monitor changes to authentication configuration files
-w /etc/pam.d/ -p wa -k auth_config
-w /etc/nsswitch.conf -p wa -k auth_config
-w /etc/ssh/sshd_config -p wa -k auth_config

# Monitor user and group management
-w /usr/sbin/useradd -p x -k user_modification
-w /usr/sbin/userdel -p x -k user_modification
-w /usr/sbin/usermod -p x -k user_modification
-w /usr/sbin/groupadd -p x -k group_modification
-w /usr/sbin/groupdel -p x -k group_modification
-w /usr/sbin/groupmod -p x -k group_modification

# Monitor network configuration changes
-w /etc/network/ -p wa -k network_modifications
-w /etc/sysconfig/network -p wa -k network_modifications

# Monitor changes to system logs
-w /var/log/auth.log -p wa -k log_tampering
-w /var/log/syslog -p wa -k log_tampering
-w /var/log/fail2ban.log -p wa -k log_tampering
EOF
    
    # Restart auditd
    systemctl restart auditd
    
    echo "System auditing configured"
}

# Function to run Lynis security audit
run_security_audit() {
    print_section "Running Lynis Security Audit"
    
    # Run Lynis audit
    lynis audit system --quick
    
    echo "Security audit completed"
}

# Function to verify hardening
verify_hardening() {
    print_section "Verifying Hardening Measures"
    
    # Check UFW status
    echo "UFW Status:"
    ufw status
    
    # Check SSH configuration
    echo -e "\nSSH Configuration:"
    grep "PermitRootLogin" /etc/ssh/sshd_config
    grep "PasswordAuthentication" /etc/ssh/sshd_config
    
    # Check Fail2Ban status
    echo -e "\nFail2Ban Status:"
    fail2ban-client status
    
    # Check automatic updates
    echo -e "\nAutomatic Updates Configuration:"
    cat /etc/apt/apt.conf.d/20auto-upgrades
    
    echo -e "\nHardening verification completed"
}

# Main function
main() {
    # Check if running as root
    check_root
    
    # Update system
    update_system
    
    # Install security packages
    install_security_packages
    
    # Configure firewall
    configure_firewall
    
    # Create admin user
    create_admin_user
    
    # Harden SSH
    harden_ssh
    
    # Configure Fail2Ban
    configure_fail2ban
    
    # Configure automatic updates
    configure_auto_updates
    
    # Configure system auditing
    configure_auditing
    
    # Run security audit
    run_security_audit
    
    # Verify hardening
    verify_hardening
    
    # Final message
    print_section "Server Hardening Complete"
    echo "Your server has been hardened with the following measures:"
    echo "✓ System packages updated"
    echo "✓ Firewall (UFW) configured"
    echo "✓ Non-root user created with sudo privileges"
    echo "✓ SSH hardened (root login disabled, password auth disabled)"
    echo "✓ Fail2Ban installed and configured"
    echo "✓ Automatic security updates enabled"
    echo "✓ System auditing configured"
    echo "✓ Security audit completed"
    echo ""
    echo "IMPORTANT: Please test SSH access with your new user before logging out!"
    echo "           ssh -i /path/to/key $USERNAME@<server-ip>"
}

# Run main function
main
