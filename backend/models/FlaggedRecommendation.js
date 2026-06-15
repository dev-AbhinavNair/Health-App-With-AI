const mongoose = require("mongoose");

const flaggedRecommendationSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
    },
    recommendation: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    severity: {
      type: String,
      enum: ["medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["under-review", "resolved", "rejected"],
      default: "under-review",
    },
    patientId: {
      type: String,
      required: true,
    },
    patientCondition: {
      type: String,
    },
    assignedDoctor: {
      type: String,
    },
    flagReason: {
      type: String,
      required: true,
    },
    userFeedback: {
      type: String,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    actionTaken: {
      type: String,
      enum: ["marked-safe", "escalated", "rejected", "investigation"],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    investigationHistory: [
      {
        action: String,
        performedBy: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "FlaggedRecommendation",
  flaggedRecommendationSchema,
);
