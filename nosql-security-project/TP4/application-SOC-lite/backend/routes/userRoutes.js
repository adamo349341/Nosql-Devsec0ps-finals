import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { protect, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, authorizeRoles("admin", "analyst", "viewer", "senior_analyst", "incident_manager"), async (req, res) => {
  try {
    const users = await User.find(
      {},
      {
        username: 1,
        full_name: 1,
        roles: 1,
        team: 1,
        is_active: 1,
        email: 1
      }
    );

    const safeUsers = users.map((u) => ({
      _id: u._id,
      username: u.username,
      full_name: u.full_name,
      roles: u.roles,
      team: u.team,
      is_active: u.is_active,
      email_masked: `${u.email[0]}***@${u.email.split("@")[1]}`
    }));

    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { username, full_name, email, password, roles, team } = req.body;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      full_name,
      email,
      password_hash,
      roles: roles || ["viewer"],
      team: team || "Blue Team"
    });

    res.status(201).json({
      message: "User created",
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        roles: user.roles
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;