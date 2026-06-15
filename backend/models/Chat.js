const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      default: "Health Consultation",
    },
    status: {
      type: String,
      enum: ["active", "pending_review", "reviewed", "completed"],
      default: "active",
    },
    aiStatus: {
      type: String,
      enum: ["idle", "collecting", "ready"],
      default: "idle",
    },
    aiSummary: {
      type: String,
    },
    aiRecommendations: {
      type: String,
    },
    doctorNotes: {
      type: String,
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    symptoms: [
      {
        name: { type: String },
        duration: { type: String },
        severity: { type: String },
      },
    ],
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    patientInfo: {
      age: { type: Number },
      conditions: { type: [String] },
      medications: [
        {
          name: { type: String },
          dosage: { type: String },
          frequency: { type: String },
        },
      ],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Chat", chatSchema);
