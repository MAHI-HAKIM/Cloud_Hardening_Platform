import React, { useState } from 'react';
import axios from 'axios';

function DisplayInterfaces() {
  const [output, setOutput] = useState('');

  const fetchInterfaces = async () => {
    try {
      const response = await axios.post('/api/run-playbook', {
        host: 'your-ubuntu-vm-ip',
        username: 'your-username',
        passwordOrKey: 'your-password-or-key',
        authMethod: 'password',
      });
      setOutput(response.data.output);
    } catch (error) {
      console.error('Error fetching interfaces:', error);
    }
  };

  return (
    <div>
      <button onClick={fetchInterfaces}>Fetch Interfaces</button>
      <pre>{output}</pre>
    </div>
  );
}

export default DisplayInterfaces;
