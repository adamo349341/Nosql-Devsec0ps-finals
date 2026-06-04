import mongoose from "mongoose";

const securityLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    event_type: {
      type: String,
      required: true
    },
    src_ip: {
      type: String,
      required: true,
      index: true
    },
    dst_ip: {
      type: String,
      required: true
    },
    src_port: {
      type: Number,
      default: null
    },
    dst_port: {
      type: Number,
      default: null
    },
    protocol: {
      type: String,
      required: true
    },
    user_attempted: {
      type: String,
      default: null
    },
    device_id: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ["info", "low", "medium", "high", "critical"],
      required: true
    },
    raw_log: {
      type: String,
      required: true
    }
  },
  { versionKey: false }
);

securityLogSchema.index({ timestamp: 1, src_ip: 1 });
securityLogSchema.index({ event_type: 1, timestamp: 1 });

const SecurityLog = mongoose.model("SecurityLog", securityLogSchema);
export default SecurityLog;