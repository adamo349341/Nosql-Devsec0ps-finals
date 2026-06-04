import { useEffect, useState } from "react";
import api from "../api/axios";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
      alert("Error loading dashboard");
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (!stats) return <h2>Loading dashboard...</h2>;

  return (
    <div>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: "30px", marginBottom: "30px", flexWrap: "wrap" }}>
        <div>
          <h3>Total Logs</h3>
          <p>{stats.totalLogs}</p>
        </div>

        <div>
          <h3>Total Incidents</h3>
          <p>{stats.totalIncidents}</p>
        </div>

        <div>
          <h3>Critical Logs</h3>
          <p>{stats.criticalLogs}</p>
        </div>

        <div>
          <h3>High Incidents</h3>
          <p>{stats.highIncidents}</p>
        </div>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3>Incidents by Status</h3>
        <ul>
          {stats.incidentsByStatus.map((item, index) => (
            <li key={index}>
              {item._id}: {item.count}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3>Logs by Severity</h3>
        <ul>
          {stats.logsBySeverity.map((item, index) => (
            <li key={index}>
              {item._id}: {item.count}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Top Source IPs</h3>
        <ul>
          {stats.topSourceIps.map((item, index) => (
            <li key={index}>
              {item._id}: {item.count}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}