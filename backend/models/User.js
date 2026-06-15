const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "doctor", "admin", "pending_doctor"],
      default: "user",
    },
    specialty: {
      type: String,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    age: {
      type: Number,
    },
    medicalConditions: {
      type: [String],
      default: [],
    },
    medications: [
      {
        name: { type: String },
        dosage: { type: String },
        frequency: { type: String },
        dailyDoses: { type: Number, default: 1 },
      },
    ],
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
