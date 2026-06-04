import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function IncidentDetailPage() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [comment, setComment] = useState("");

  const fetchIncident = async () => {
    try {
      const res = await api.get(`/incidents/${id}`);
      setIncident(res.data);
    } catch (err) {
      console.error(err);
      alert("Error fetching incident");
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.patch(`/incidents/${incident.incident_id}/status`, {
        status: newStatus,
      });
      setIncident(res.data);
    } catch (err) {
      console.error(err);
      alert("Status update failed");
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      alert("Comment cannot be empty");
      return;
    }

    try {
      const res = await api.patch(`/incidents/${incident.incident_id}/comment`, {
        text: comment,
      });
      setIncident(res.data);
      setComment("");
    } catch (err) {
      console.error(err);
      alert("Comment failed");
    }
  };

  if (!incident) return <h2>Loading...</h2>;

  return (
    <div>
      <h1>Incident Detail</h1>

      <p>
        <strong>Incident ID:</strong> {incident.incident_id}
      </p>
      <p>
        <strong>Title:</strong> {incident.title}
      </p>
      <p>
        <strong>Description:</strong> {incident.description}
      </p>
      <p>
        <strong>Severity:</strong> {incident.severity}
      </p>
      <p>
        <strong>Status:</strong> {incident.status}
      </p>
      <p>
        <strong>Assigned To:</strong> {incident.assigned_to || "-"}
      </p>

      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <h3>Update Status</h3>
        <select
          value={incident.status}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="new">new</option>
          <option value="active">active</option>
          <option value="investigating">investigating</option>
          <option value="resolved">resolved</option>
          <option value="closed">closed</option>
        </select>
      </div>

      <h2>Related Logs</h2>
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
          {(incident.related_log_ids || []).map((log) => (
            <tr key={log._id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.event_type}</td>
              <td>{log.severity}</td>
              <td>{log.src_ip}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "30px" }}>
        <h3>Add Comment</h3>
        <textarea
          rows="4"
          cols="50"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write comment..."
        />
        <br />
        <button onClick={handleAddComment}>Add</button>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Comments</h3>
        <ul>
          {(incident.comments || []).map((c, i) => (
            <li key={i}>
              <strong>{c.author}</strong> —{" "}
              {new Date(c.timestamp).toLocaleString()}
              <br />
              {c.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}