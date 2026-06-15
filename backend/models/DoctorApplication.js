const mongoose = require("mongoose");

const doctorApplicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
    },
    specialty: {
      type: String,
      required: [true, "Please add a specialty"],
    },
    licenseNumber: {
      type: String,
      required: [true, "Please add a license number"],
    },
    experience: {
      type: String,
      required: [true, "Please add years of experience"],
    },
    licenseState: {
      type: String,
    },
    npiNumber: {
      type: String,
    },
    hospitalAffiliation: {
      type: String,
    },
    boardCertification: {
      type: String,
    },
    professionalBio: {
      type: String,
    },
    adminNotes: {
      type: String,
      default: "",
    },
    documents: [
      {
        url: String,
        publicId: String,
        documentType: {
          type: String,
          enum: [
            "medical_license",
            "board_certification",
            "education",
            "id_proof",
            "other",
          ],
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("DoctorApplication", doctorApplicationSchema);
