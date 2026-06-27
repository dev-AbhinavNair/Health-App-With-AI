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
      enum: ["user", "doctor", "admin", "super_admin", "pending_doctor"],
      default: "user",
    },
    specialty: {
      type: String,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
    },
    profilePicturePublicId: {
      type: String,
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
        purpose: { type: String },
        refillDate: { type: Date },
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
