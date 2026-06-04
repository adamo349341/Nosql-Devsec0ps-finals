import { useEffect, useState } from "react";
import api from "../api/axios";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    severity: "",
    src_ip: "",
    event_type: "",
  });

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();

      if (filters.severity) params.append("severity", filters.severity);
      if (filters.src_ip) params.append("src_ip", filters.src_ip);
      if (filters.event_type) params.append("event_type", filters.event_type);

      const res = await api.get(`/logs?${params.toString()}`);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
      alert("Error fetching logs");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div>
      <h1>Logs</h1>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          name="src_ip"
          placeholder="Source IP"
          value={filters.src_ip}
          onChange={handleChange}
        />

        <input
          type="text"
          name="event_type"
          placeholder="Event Type"
          value={filters.event_type}
          onChange={handleChange}
        />

        <select
          name="severity"
          value={filters.severity}
          onChange={handleChange}
        >
          <option value="">All Severities</option>
          <option value="info">info</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>

        <button onClick={fetchLogs}>Apply Filters</button>
      </div>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Event</th>
            <th>Severity</th>
            <th>Source IP</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log._id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.event_type}</td>
              <td>{log.severity}</td>
              <td>{log.src_ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}