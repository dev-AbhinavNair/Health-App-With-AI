const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, "Please add an action"],
    },
    category: {
      type: String,
      enum: [
        "Doctor Management",
        "AI Monitoring",
        "Reports Management",
        "User Management",
        "System Updates",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["info", "warning", "high", "critical"],
      default: "info",
    },
    actor: {
      name: String,
      id: String,
    },
    target: {
      name: String,
      id: String,
    },
    ipAddress: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
