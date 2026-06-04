import express from "express";
import SecurityLog from "../models/SecurityLog.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const { severity, event_type, src_ip, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (severity) filter.severity = severity;
    if (event_type) filter.event_type = event_type;
    if (src_ip) filter.src_ip = src_ip;

    const skip = (Number(page) - 1) * Number(limit);

    const projection =
      req.user.roles.includes("admin") || req.user.roles.includes("analyst") || req.user.roles.includes("senior_analyst")
        ? {}
        : {
            raw_log: 0
          };

    const logs = await SecurityLog.find(filter, projection)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await SecurityLog.countDocuments(filter);

    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      logs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, authorizeRoles("admin", "analyst", "senior_analyst"), async (req, res) => {
  try {
    const log = await SecurityLog.create(req.body);
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/stats/severity", protect, async (req, res) => {
  try {
    const stats = await SecurityLog.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/stats/top-src-ip", protect, async (req, res) => {
  try {
    const stats = await SecurityLog.aggregate([
      { $group: { _id: "$src_ip", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;