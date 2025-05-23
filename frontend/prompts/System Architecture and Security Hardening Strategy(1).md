# System Architecture and Security Hardening Strategy

## Overview

This document outlines the detailed system architecture and security hardening strategy for the Network Security Research Demonstration Project. It provides a comprehensive view of the system components, their interactions, security measures, and implementation considerations.

## System Architecture

### High-Level Architecture

The system follows a three-tier architecture consisting of:

1. **Frontend Tier**: React-based web application hosted on a static hosting service
2. **API Tier**: Node.js/Express REST API running on the hardened cloud server
3. **Infrastructure Tier**: Hardened Oracle Cloud VM with security configurations

```
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│                         │      │                         │      │                         │
│    React Frontend       │      │    REST API Server      │      │    Hardened Cloud VM    │
│    (Vercel/Netlify)     │◄────►│    (Node.js/Express)    │◄────►│    (Oracle Cloud)       │
│                         │      │                         │      │                         │
└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

### Detailed Component Architecture

#### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       React Frontend                            │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │             │    │             │    │                     │  │
│  │  Auth       │    │  Dashboard  │    │  Security Status    │  │
│  │  Components │    │  Components │    │  Components         │  │
│  │             │    │             │    │                     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                  API Service Layer                      │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
                     ┌───────────────────┐
                     │                   │
                     │   REST API        │
                     │                   │
                     └───────────────────┘
```

#### API Server Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       REST API Server                           │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │             │    │             │    │                     │  │
│  │  Auth       │    │  System     │    │  Security           │  │
│  │  Endpoints  │    │  Endpoints  │    │  Endpoints          │  │
│  │             │    │             │    │                     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                  Middleware Layer                       │   │
│  │  (Authentication, Rate Limiting, Validation, Logging)   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                  Service Layer                          │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
                     ┌───────────────────┐
                     │                   │
                     │   System APIs     │
                     │                   │
                     └───────────────────┘
```

#### Cloud VM Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Hardened Cloud VM                         │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │             │    │             │    │                     │  │
│  │  UFW        │    │  SSH        │    │  Fail2Ban           │  │
│  │  Firewall   │    │  Server     │    │                     │  │
│  │             │    │             │    │                     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │             │    │             │    │                     │  │
│  │  Node.js    │    │  System     │    │  Security           │  │
│  │  API Server │    │  Monitoring │    │  Auditing (Lynis)   │  │
│  │             │    │             │    │                     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│           │     │           │     │           │     │           │
│  User     │────►│  Frontend │────►│  API      │────►│  System   │
│  Browser  │     │  App      │     │  Server   │     │  Services │
│           │◄────│           │◄────│           │◄────│           │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
                       │                 ▲                  │
                       │                 │                  │
                       ▼                 │                  ▼
                  ┌───────────┐     ┌───────────┐     ┌───────────┐
                  │           │     │           │     │           │
                  │  Auth     │────►│  Security │◄────│  System   │
                  │  Service  │     │  Services │     │  Metrics  │
                  │           │     │           │     │           │
                  └───────────┘     └───────────┘     └───────────┘
```

## Security Hardening Strategy

### Network Security Layer

#### Firewall Configuration (UFW)

The Uncomplicated Firewall (UFW) will be configured to:

1. **Default Policies**:
   - Deny all incoming traffic by default
   - Allow all outgoing traffic by default

2. **Allowed Services**:
   - SSH (Port 22) - For secure administration
   - HTTP (Port 80) - For web traffic, will redirect to HTTPS
   - HTTPS (Port 443) - For secure web traffic

3. **Implementation Strategy**:
   ```bash
   # Enable UFW with default policies
   ufw default deny incoming
   ufw default allow outgoing
   
   # Allow essential services
   ufw allow ssh
   ufw allow http
   ufw allow https
   
   # Enable logging
   ufw logging on
   
   # Enable the firewall
   ufw enable
   ```

#### SSH Hardening

SSH will be hardened with the following configurations:

1. **Authentication**:
   - Disable root login
   - Disable password authentication
   - Enable public key authentication only

2. **Session Security**:
   - Set idle timeout (ClientAliveInterval)
   - Limit authentication attempts

3. **Implementation Strategy**:
   ```bash
   # Backup original configuration
   cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
   
   # Apply security configurations
   sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
   sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
   sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
   sed -i 's/#PermitEmptyPasswords no/PermitEmptyPasswords no/' /etc/ssh/sshd_config
   sed -i 's/#ClientAliveInterval 0/ClientAliveInterval 300/' /etc/ssh/sshd_config
   sed -i 's/#ClientAliveCountMax 3/ClientAliveCountMax 2/' /etc/ssh/sshd_config
   
   # Restart SSH service
   systemctl restart sshd
   ```

### System Security Layer

#### User Management

Secure user management will be implemented with:

1. **Non-Root User**:
   - Create a dedicated non-root user with sudo privileges
   - Configure SSH key authentication for this user

2. **Password Policies**:
   - Set strong password requirements
   - Configure password aging

3. **Implementation Strategy**:
   ```bash
   # Create non-root user
   adduser --gecos "" $USERNAME
   usermod -aG sudo $USERNAME
   
   # Set up SSH key authentication
   mkdir -p /home/$USERNAME/.ssh
   touch /home/$USERNAME/.ssh/authorized_keys
   # Add public key to authorized_keys
   chown -R $USERNAME:$USERNAME /home/$USERNAME/.ssh
   chmod 700 /home/$USERNAME/.ssh
   chmod 600 /home/$USERNAME/.ssh/authorized_keys
   ```

#### Fail2Ban Configuration

Fail2Ban will be configured to protect against brute force attacks:

1. **SSH Protection**:
   - Monitor SSH login attempts
   - Ban IPs after multiple failed attempts

2. **Web Application Protection**:
   - Monitor HTTP/HTTPS requests
   - Ban IPs attempting to exploit common vulnerabilities

3. **Implementation Strategy**:
   ```bash
   # Install Fail2Ban
   apt install -y fail2ban
   
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
   EOF
   
   # Enable and start Fail2Ban
   systemctl enable fail2ban
   systemctl restart fail2ban
   ```

#### Automatic Security Updates

Automatic security updates will be configured to ensure the system stays patched:

1. **Unattended Upgrades**:
   - Install security updates automatically
   - Configure notification emails

2. **Implementation Strategy**:
   ```bash
   # Install unattended-upgrades
   apt install -y unattended-upgrades apt-listchanges
   
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
   EOF
   ```

### Application Security Layer

#### API Security

The REST API will be secured with:

1. **Authentication**:
   - JWT-based authentication
   - Token expiration and refresh mechanism

2. **Authorization**:
   - Role-based access control
   - Endpoint-specific permissions

3. **Input Validation**:
   - Validate all request parameters
   - Sanitize user inputs

4. **Rate Limiting**:
   - Implement request rate limiting
   - Prevent DoS attacks

5. **Implementation Strategy**:
   ```javascript
   // Authentication middleware
   const authMiddleware = (req, res, next) => {
     try {
       const token = req.headers.authorization.split(' ')[1];
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoded;
       next();
     } catch (error) {
       return res.status(401).json({ message: 'Authentication failed' });
     }
   };
   
   // Rate limiting middleware
   const rateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: 'Too many requests, please try again later'
   });
   
   // Apply middleware to routes
   app.use('/api/v1/auth', rateLimiter);
   app.use('/api/v1/system', authMiddleware);
   app.use('/api/v1/security', authMiddleware);
   ```

#### Frontend Security

The React frontend will be secured with:

1. **Authentication**:
   - Secure login form
   - Token storage in HttpOnly cookies
   - Automatic token refresh

2. **XSS Prevention**:
   - Content Security Policy
   - Input sanitization

3. **CSRF Protection**:
   - Anti-CSRF tokens
   - Same-origin policy enforcement

4. **Implementation Strategy**:
   ```javascript
   // Secure token storage
   const setAuthToken = (token) => {
     if (token) {
       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
       localStorage.setItem('token', token);
     } else {
       delete axios.defaults.headers.common['Authorization'];
       localStorage.removeItem('token');
     }
   };
   
   // Protected route component
   const ProtectedRoute = ({ component: Component, ...rest }) => (
     <Route
       {...rest}
       render={props =>
         isAuthenticated() ? (
           <Component {...props} />
         ) : (
           <Redirect to="/login" />
         )
       }
     />
   );
   ```

## Security Monitoring and Auditing

### System Monitoring

1. **Resource Monitoring**:
   - CPU usage tracking
   - Memory usage tracking
   - Disk usage monitoring

2. **Implementation Strategy**:
   ```javascript
   // System monitoring service
   const getSystemStatus = async () => {
     const cpuUsage = await cpu.usage();
     const memInfo = await mem.info();
     
     return {
       cpu: {
         usage: cpuUsage,
         cores: os.cpus().length,
         model: os.cpus()[0].model
       },
       memory: {
         total: memInfo.totalMemMb,
         used: memInfo.usedMemMb,
         free: memInfo.freeMemMb
       },
       uptime: os.uptime(),
       loadAverage: os.loadavg(),
       timestamp: new Date().toISOString()
     };
   };
   ```

### Security Auditing

1. **Lynis Security Audit**:
   - Regular automated security audits
   - Hardening index tracking

2. **Log Monitoring**:
   - Centralized logging
   - Log analysis for security events

3. **Implementation Strategy**:
   ```javascript
   // Security audit service
   const getHardeningStatus = async () => {
     try {
       // Run Lynis audit
       await execPromise('lynis audit system --quick --no-colors');
       const { stdout } = await execPromise('cat /var/log/lynis-report.dat');
       
       const lines = stdout.split('\n');
       const hardening_index = lines.find(line => line.startsWith('hardening_index='));
       const score = hardening_index ? parseInt(hardening_index.split('=')[1]) : 0;
       
       // Process results
       return {
         overall: {
           score,
           maxScore: 100,
           percentage: score
         },
         // Additional details...
       };
     } catch (error) {
       console.error('Error getting hardening status:', error);
       return { error: error.message };
     }
   };
   ```

## Implementation Considerations

### Deployment Strategy

1. **Server Provisioning**:
   - Use Oracle Cloud Free Tier
   - Select appropriate VM shape (VM.Standard.E2.1.Micro)
   - Configure networking and security groups

2. **Automation**:
   - Use shell script for initial hardening
   - Consider Ansible for more complex deployments

3. **CI/CD**:
   - Implement GitHub Actions for frontend deployment
   - Use manual deployment for API initially

### Maintenance Strategy

1. **Updates and Patches**:
   - Automatic security updates
   - Regular manual review of system

2. **Monitoring**:
   - Regular review of logs
   - Alerts for suspicious activities

3. **Backup**:
   - Regular configuration backups
   - Document recovery procedures

## Conclusion

This system architecture and security hardening strategy provides a comprehensive approach to creating a secure, educational demonstration of network security best practices. By implementing these measures, the system will showcase industry-standard security configurations while providing valuable monitoring and visualization capabilities.

The design prioritizes:
- Defense in depth with multiple security layers
- Automation of security configurations
- Visibility into system status and security events
- Educational value for cybersecurity students

This architecture serves as the blueprint for the implementation phase, where these designs will be translated into working code and configurations.
