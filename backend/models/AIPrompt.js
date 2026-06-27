const mongoose = require("mongoose");

const aiPromptSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["summary", "conversation"],
      default: "summary",
    },
    promptText: {
      type: String,
      required: [true, "Please provide the system prompt text"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("AIPrompt", aiPromptSchema);
