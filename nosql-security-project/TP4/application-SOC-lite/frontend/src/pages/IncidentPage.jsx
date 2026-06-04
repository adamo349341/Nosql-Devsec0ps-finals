import { useEffect, useState } from "react";
import api from "../api/axios";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);

  const fetchIncidents = async () => {
    try {
      const res = await api.get("/incidents");
      setIncidents(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Error fetching incidents");
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  return (
    <div>
      <h1>Incidents</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Incident ID</th>
            <th>Title</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Assigned To</th>
          </tr>
        </thead>

        <tbody>
          {incidents.map((incident) => (
            <tr key={incident._id}>
              <td>
                <a href={`/incidents/${incident.incident_id}`}>
                 {incident.incident_id}
                 </a>
               </td>
              <td>{incident.title}</td>
              <td>{incident.severity}</td>
              <td>{incident.status}</td>
              <td>{incident.assigned_to || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}