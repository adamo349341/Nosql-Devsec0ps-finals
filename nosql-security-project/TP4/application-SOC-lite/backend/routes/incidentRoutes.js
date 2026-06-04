import express from "express";
import Incident from "../models/Incident.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// GET all incidents
router.get("/", protect, async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ created_at: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET one incident by incident_id, not Mongo _id
router.get("/:id", protect, async (req, res) => {
  try {
    const incident = await Incident.findOne({
      incident_id: req.params.id,
    }).populate("related_log_ids");

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // Hide raw_log for lower-privileged roles
    if (
      !(
        req.user.roles.includes("admin") ||
        req.user.roles.includes("analyst") ||
        req.user.roles.includes("senior_analyst") ||
        req.user.roles.includes("incident_manager")
      )
    ) {
      const safeIncident = incident.toObject();

      safeIncident.related_log_ids = (safeIncident.related_log_ids || []).map(
        (log) => {
          const { raw_log, ...rest } = log;
          return rest;
        }
      );

      return res.json(safeIncident);
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE incident
router.post(
  "/",
  protect,
  authorizeRoles("admin", "analyst", "senior_analyst"),
  async (req, res) => {
    try {
      const incident = await Incident.create(req.body);
      res.status(201).json(incident);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// UPDATE incident status by incident_id
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin", "analyst", "senior_analyst", "incident_manager"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const incident = await Incident.findOneAndUpdate(
        { incident_id: req.params.id },
        { status, updated_at: new Date() },
        { new: true }
      );

      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      res.json(incident);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ADD comment by incident_id
router.patch(
  "/:id/comment",
  protect,
  authorizeRoles("admin", "analyst", "senior_analyst", "viewer", "incident_manager"),
  async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ message: "Comment text is required" });
      }

      const incident = await Incident.findOneAndUpdate(
        { incident_id: req.params.id },
        {
          $push: {
            comments: {
              author: req.user.username,
              text: text.trim(),
              timestamp: new Date(),
            },
          },
          $set: { updated_at: new Date() },
        },
        { new: true }
      );

      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      res.json(incident);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;