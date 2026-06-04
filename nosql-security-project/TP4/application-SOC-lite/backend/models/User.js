import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    full_name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password_hash: {
      type: String,
      required: true
    },
    roles: {
      type: [String],
      default: ["viewer"]
    },
    team: {
      type: String,
      default: "Blue Team"
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    last_login: {
      type: Date,
      default: null
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  { versionKey: false }
);

const User = mongoose.model("User", userSchema);
export default User;