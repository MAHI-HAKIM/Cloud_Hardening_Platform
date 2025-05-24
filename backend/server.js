// Combined and enhanced server.js for your Cloud Security Project

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { exec, execSync } = require('child_process');
const admin = require('./firebaseAdmin');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/**
 * 1. STREAM SSH CONNECTION TEST (Interactive logs)
 */
app.get('/api/ssh/stream-connect', (req, res) => {
  const { host, port, username, authMethod, passwordOrKey } = req.query;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (msg) => res.write(`data: ${msg}\n\n`);

  try {
    const sshCheckCmd = process.platform === 'win32' ? 'where ssh' : 'which ssh';
    const sshPath = execSync(sshCheckCmd, { encoding: 'utf-8' }).trim();
    send(`✅ SSH is installed at: ${sshPath}`);

    // Check for sshpass if using password authentication
    if (authMethod === 'password') {
      try {
        const sshpassCheckCmd = process.platform === 'win32' ? 'where sshpass' : 'which sshpass';
        const sshpassPath = execSync(sshpassCheckCmd, { encoding: 'utf-8' }).trim();
        send(`✅ sshpass is installed at: ${sshpassPath}`);
      } catch (err) {
        send(`❌ sshpass not found. Please install it first:\nFor Ubuntu/Debian: sudo apt-get install sshpass\nFor CentOS/RHEL: sudo yum install sshpass\nFor macOS: brew install hudochenkov/sshpass/sshpass`);
        res.write("event: end\n");
        res.write("data: done\n\n");
        return res.end();
      }
    }
  } catch (err) {
    send(`❌ SSH not found.\n${err.message}`);
    res.write("event: end\n");
    res.write("data: done\n\n");
    return res.end();
  }

  try {
    const status = execSync('systemctl is-active ssh', { encoding: 'utf-8' }).trim();
    send(status === 'active' ? '✅ SSH service is running.' : `⚠️ SSH service status: ${status}`);
  } catch {
    send('⚠️ Could not check SSH service status.');
  }

  send('🔄 Attempting SSH connection...');

  const sshArgs = ['-p', port || '22', '-o', 'StrictHostKeyChecking=no'];
  let tempKeyPath;
  let command;
  const sshTarget = `${username}@${host}`;
  const remoteCommand = 'echo "✅ Connected to remote device!"';

  if (authMethod === 'key') {
    tempKeyPath = path.join(__dirname, `temp_ssh_key_${Date.now()}.pem`);
    fs.writeFileSync(tempKeyPath, passwordOrKey, { mode: 0o600 });
    sshArgs.push('-i', tempKeyPath);
    command = `ssh ${sshArgs.join(' ')} ${sshTarget} '${remoteCommand}'`;
  } else {
    // Use sshpass for password authentication
    command = `sshpass -p "${passwordOrKey}" ssh ${sshArgs.join(' ')} ${sshTarget} '${remoteCommand}'`;
  }

  const ssh = exec(command);

  ssh.stdout?.on('data', (data) => send(`📤 ${data.toString().trim()}`));
  ssh.stderr?.on('data', (data) => send(`⚠️ ${data.toString().trim()}`));

  ssh.on('close', (code) => {
    if (tempKeyPath) fs.unlinkSync(tempKeyPath);

    send(code === 0
      ? '✅ SSH connection succeeded.'
      : `❌ SSH connection failed with exit code ${code}`);

    res.write("event: end\n");
    res.write("data: done\n\n");
    res.end();
  });

  ssh.on('error', (err) => {
    send(`❌ Error: ${err.message}`);
    res.write("event: end\n");
    res.write("data: done\n\n");
    res.end();
  });
});

/**
 * 2. INSTALL ANSIBLE
 */
app.post('/api/ansible/install', (req, res) => {
  exec('sudo apt update && sudo apt install -y ansible', (error, stdout, stderr) => {
    if (error) return res.status(500).json({ success: false, error: stderr });
    res.json({ success: true, message: "Ansible installed successfully." });
  });
});

/**
 * 3. GET AVAILABLE PLAYBOOKS
 */
app.get('/api/getplaybooks/available', (req, res) => {
  const baseDir = path.join(__dirname, 'ansible');
  fs.readdir(baseDir, (err, vendors) => {
    if (err) return res.status(500).json({ error: 'Error reading playbook folders.' });
    const playbooks = [];
    vendors.forEach((vendor) => {
      const vendorDir = path.join(baseDir, vendor);
      fs.readdirSync(vendorDir).forEach((file) => {
        if (file.endsWith('.yml') || file.endsWith('.yaml')) {
          playbooks.push({
            name: file,
            fullPath: path.join(vendorDir, file),
            category: vendor,
          });
        }
      });
    });
    res.json(playbooks);
  });
});
/**
 * 4. RUN PLAYBOOK ON TARGET
 */
app.post('/api/ssh/run-playbook', async (req, res) => {
  const { host, username, password, sshKey, port = 22, playbookPath } = req.body;

  if (!password && !sshKey) {
    return res.status(400).json({ success: false, error: 'No password or SSH key provided.' });
  }

  if (!playbookPath || !fs.existsSync(playbookPath)) {
    return res.status(400).json({ success: false, error: 'Playbook path is invalid or missing.' });
  }

  try {
    execSync('which ansible-playbook');

    let sshCommand;
    let ansibleCommand;
    let tempKeyPath;

    if (password) {
      sshCommand = `sshpass -p "${password}" ssh -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "echo Connected"`;
    } else {
      tempKeyPath = path.join(__dirname, `id_rsa_${Date.now()}`);
      fs.writeFileSync(tempKeyPath, sshKey, { mode: 0o600 });
      sshCommand = `ssh -i "${tempKeyPath}" -o StrictHostKeyChecking=no -p ${port} ${username}@${host} "echo Connected"`;
    }

    console.log("🧪 Testing SSH connection:", sshCommand);
    const sshOutput = execSync(sshCommand, { encoding: 'utf-8' }).trim();

    if (!sshOutput.includes("Connected")) {
      if (tempKeyPath) fs.unlinkSync(tempKeyPath);
      return res.status(500).json({ success: false, error: 'SSH test failed. Cannot proceed with playbook.' });
    }

    if (password) {
      ansibleCommand = `ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook "${playbookPath}" -i "${host}," -u "${username}" --extra-vars "ansible_ssh_pass=${password}" -c ssh`;
    } else {
      ansibleCommand = `ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook "${playbookPath}" -i "${host}," -u "${username}" --private-key "${tempKeyPath}"`;
    }

    console.log("▶️ Running playbook:", ansibleCommand);

    exec(ansibleCommand, (error, stdout, stderr) => {
      if (tempKeyPath) fs.unlinkSync(tempKeyPath);

      if (error) {
        console.error("❌ Playbook failed:", stderr || error.message);
        return res.status(500).json({ success: false, error: stderr || error.message });
      }

      res.json({ success: true, output: stdout });
    });

  } catch (err) {
    console.error("❌ General error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});


/**
 * 5. GET AUDIT LOGS
 */
app.get('/api/audit', (req, res) => {
  const logDir = path.join(__dirname, 'logs');
  fs.readdir(logDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Could not read audit logs." });
    const logs = files.map(file => {
      const content = fs.readFileSync(path.join(logDir, file), 'utf-8');
      return JSON.parse(content);
    });
    res.json({ logs });
  });
});

/**
 * 6. GENERATE SSH KEY PAIR
 */
app.post('/api/ssh/generate-keypair', (req, res) => {
  const userId = crypto.randomUUID();
  const keyDir = path.join(os.tmpdir(), `ssh-key-${userId}`);
  const privateKeyPath = path.join(keyDir, 'id_rsa');
  const publicKeyPath = path.join(keyDir, 'id_rsa.pub');

  fs.mkdirSync(keyDir, { recursive: true });

  exec(`ssh-keygen -t rsa -b 2048 -f "${privateKeyPath}" -N ""`, (error) => {
    if (error) return res.status(500).json({ success: false, error: 'SSH key generation failed' });
    try {
      const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
      const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');
      fs.rmSync(keyDir, { recursive: true, force: true });
      res.json({ success: true, privateKey, publicKey, info: "Add this public key to your firewall's ~/.ssh/authorized_keys" });
    } catch {
      res.status(500).json({ success: false, error: 'Could not read generated keys' });
    }
  });
});

/**
 * 7. RUN AUDIT (API for frontend integration)
 */
app.post('/api/run-audit', async (req, res) => {
  // Expected: host, port, username, sshKey, standard, threshold, deviceId, userEmail, cloudProvider
  const { host, port = 22, username, sshKey, standard, threshold, deviceId, userEmail, cloudProvider } = req.body;
  try {
    // Map standard to playbook path (adjust as needed)
    const playbookMap = {
      AWS_CIS: 'ansible/AWS/hardenfullcisbased.yml',
      AZURE_CIS: 'ansible/Azure/hardenfullcisbased.yml',
      GCP_CIS: 'ansible/GCP/hardenfullcisbased.yml',
      CSA_CCM: 'ansible/General/ccm_audit.yml',
      ISO_CLOUD: 'ansible/General/iso27017_audit.yml',
    };
    const playbookPath = playbookMap[standard];
    if (!playbookPath || !fs.existsSync(path.join(__dirname, playbookPath))) {
      return res.status(400).json({ success: false, error: 'Playbook for selected standard not found.' });
    }

    // Write SSH key to temp file
    const tempKeyPath = path.join(__dirname, `id_rsa_audit_${Date.now()}`);
    fs.writeFileSync(tempKeyPath, sshKey, { mode: 0o600 });

    // Build ansible-playbook command
    const command = `ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook "${path.join(__dirname, playbookPath)}" -i "${host}," -u "${username}" --private-key "${tempKeyPath}"`;

    exec(command, (error, stdout, stderr) => {
      fs.unlinkSync(tempKeyPath);
      if (error) {
        return res.status(500).json({ success: false, error: stderr || error.message });
      }
      // Optionally, parse stdout for compliance info
      // Example: look for 'ok=' and 'changed=' lines
      let compliance = null;
      const okMatch = stdout.match(/ok=(\d+)/);
      const changedMatch = stdout.match(/changed=(\d+)/);
      if (okMatch && changedMatch) {
        compliance = { ok: Number(okMatch[1]), changed: Number(changedMatch[1]) };
      }
      res.json({ success: true, output: stdout, compliance });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * START SERVER
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
