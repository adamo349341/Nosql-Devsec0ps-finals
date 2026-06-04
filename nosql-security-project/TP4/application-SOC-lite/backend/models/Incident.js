import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const incidentSchema = new mongoose.Schema(
  {
    incident_id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true
    },
    status: {
      type: String,
      enum: ["new", "active", "investigating", "resolved", "closed"],
      default: "new",
      index: true
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    assigned_to: {
      type: String,
      default: null,
      index: true
    },
    tags: {
      type: [String],
      default: []
    },
    related_log_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SecurityLog"
      }
    ],
    comments: {
      type: [commentSchema],
      default: []
    },
    mitre_tactics: {
      type: [String],
      default: []
    },
    mitre_techniques: {
      type: [String],
      default: []
    }
  },
  { versionKey: false }
);

const Incident = mongoose.model("Incident", incidentSchema);
export default Incident;