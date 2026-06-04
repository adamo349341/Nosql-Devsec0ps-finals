import express from "express";
import SecurityLog from "../models/SecurityLog.js";
import Incident from "../models/Incident.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/stats", protect, async (req, res) => {
  try {
    const totalLogs = await SecurityLog.countDocuments();
    const totalIncidents = await Incident.countDocuments();

    const criticalLogs = await SecurityLog.countDocuments({
      severity: "critical",
    });

    const highIncidents = await Incident.countDocuments({
      severity: "high",
    });

    const incidentsByStatus = await Incident.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const logsBySeverity = await SecurityLog.aggregate([
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const topSourceIps = await SecurityLog.aggregate([
      {
        $group: {
          _id: "$src_ip",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    res.json({
      totalLogs,
      totalIncidents,
      criticalLogs,
      highIncidents,
      incidentsByStatus,
      logsBySeverity,
      topSourceIps,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;