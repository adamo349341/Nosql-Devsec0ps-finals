import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import SecurityLog from "../models/SecurityLog.js";
import Incident from "../models/Incident.js";

dotenv.config();
await connectDB();

try {
  await User.deleteMany();
  await SecurityLog.deleteMany();
  await Incident.deleteMany();

  const password = await bcrypt.hash("123456", 10);

  const users = await User.insertMany([
    {
      username: "alice_analyst",
      full_name: "Alice Dupont",
      email: "alice@soc.local",
      password_hash: password,
      roles: ["analyst"],
      team: "Blue Team"
    },
    {
      username: "bob_senior",
      full_name: "Bob Martin",
      email: "bob@soc.local",
      password_hash: password,
      roles: ["senior_analyst", "incident_manager"],
      team: "Blue Team"
    },
    {
      username: "charlie_admin",
      full_name: "Charlie Leroy",
      email: "charlie@soc.local",
      password_hash: password,
      roles: ["admin"],
      team: "SOC Management"
    },
    {
      username: "diana_junior",
      full_name: "Diana Nour",
      email: "diana@soc.local",
      password_hash: password,
      roles: ["viewer"],
      team: "Blue Team"
    }
  ]);

  const logs = await SecurityLog.insertMany([
    {
      timestamp: new Date("2025-03-03T10:05:22Z"),
      event_type: "login_failed",
      src_ip: "192.168.1.105",
      dst_ip: "10.0.0.2",
      src_port: 44821,
      dst_port: 22,
      protocol: "SSH",
      user_attempted: "root",
      device_id: "srv-web-01",
      severity: "medium",
      raw_log: "Failed password for root from 192.168.1.105 port 44821 ssh2"
    },
    {
      timestamp: new Date("2025-03-03T10:05:23Z"),
      event_type: "login_failed",
      src_ip: "192.168.1.105",
      dst_ip: "10.0.0.2",
      src_port: 44822,
      dst_port: 22,
      protocol: "SSH",
      user_attempted: "root",
      device_id: "srv-web-01",
      severity: "medium",
      raw_log: "Failed password for root from 192.168.1.105 port 44822 ssh2"
    },
    {
      timestamp: new Date("2025-03-03T14:22:10Z"),
      event_type: "malware_detected",
      src_ip: "192.168.2.30",
      dst_ip: "10.0.0.10",
      src_port: 80,
      dst_port: 8080,
      protocol: "HTTP",
      user_attempted: null,
      device_id: "endpoint-pc-042",
      severity: "critical",
      raw_log: "Trojan.GenericKD detected in /tmp/update.exe"
    },
    {
      timestamp: new Date("2025-03-03T16:45:00Z"),
      event_type: "data_exfiltration_suspect",
      src_ip: "10.0.0.10",
      dst_ip: "203.0.113.50",
      src_port: 443,
      dst_port: 443,
      protocol: "HTTPS",
      user_attempted: null,
      device_id: "firewall-main",
      severity: "critical",
      raw_log: "Unusual outbound transfer 2.3GB to 203.0.113.50"
    }
  ]);

  await Incident.insertMany([
    {
      incident_id: "INC-2025-001",
      title: "Brute force SSH sur srv-web-01",
      description: "Multiples tentatives SSH échouées depuis 192.168.1.105",
      severity: "high",
      status: "investigating",
      assigned_to: users[0].username,
      tags: ["brute-force", "ssh"],
      related_log_ids: [logs[0]._id, logs[1]._id],
      comments: [
        {
          author: "alice_analyst",
          text: "Pattern brute-force confirmé.",
          timestamp: new Date("2025-03-03T10:35:00Z")
        }
      ],
      mitre_tactics: ["TA0006"],
      mitre_techniques: ["T1110.001"]
    },
    {
      incident_id: "INC-2025-002",
      title: "Malware détecté sur endpoint-pc-042",
      description: "Trojan détecté avec suspicion d’exfiltration",
      severity: "critical",
      status: "active",
      assigned_to: users[1].username,
      tags: ["malware", "exfiltration"],
      related_log_ids: [logs[2]._id, logs[3]._id],
      comments: [
        {
          author: "bob_senior",
          text: "Isolement réseau effectué.",
          timestamp: new Date("2025-03-03T14:45:00Z")
        }
      ],
      mitre_tactics: ["TA0010", "TA0011"],
      mitre_techniques: ["T1041", "T1071.001"]
    }
  ]);

  console.log("Seed completed");
  process.exit();
} catch (error) {
  console.error("Seed failed:", error);
  process.exit(1);
}