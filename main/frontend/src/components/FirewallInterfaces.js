import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FirewallInterfaces = () => {
  const [interfaces, setInterfaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {

    axios.get('/api/firewalls/interfaces')
      .then(res => {
        setInterfaces(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load interfaces');
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading interfaces...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Firewall Interfaces</h2>
      <table>
        <thead>
          <tr>
            <th>Interface</th>
            <th>IP Address</th>
            <th>Status</th>
            <th>MAC Address</th>
          </tr>
        </thead>
        <tbody>
          {interfaces.map((iface, i) => (
            <tr key={i}>
              <td>{iface.name}</td>
              <td>{iface.ip}</td>
              <td>{iface.status}</td>
              <td>{iface.mac}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FirewallInterfaces;
