import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      roles: user.roles
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username, is_active: true });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.last_login = new Date();
    await user.save();

    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        roles: user.roles,
        team: user.team
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;