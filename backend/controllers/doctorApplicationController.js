const DoctorApplication = require("../models/DoctorApplication");
const User = require("../models/User");
const { logActivity } = require("../utils/activityLogger");

const getApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const applications = await DoctorApplication.find(filter)
      .populate("reviewedBy", "name")
      .sort("-createdAt");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveApplication = async (req, res) => {
  try {
    const application = await DoctorApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Application already ${application.status}` });
    }

    const existingUser = await User.findOne({ email: application.email });

    if (existingUser) {
      existingUser.role = "doctor";
      existingUser.specialty = application.specialty;
      await existingUser.save();
    } else {
      await User.create({
        name: application.name,
        email: application.email,
        role: "doctor",
        specialty: application.specialty,
      });
    }

    application.status = "approved";
    application.reviewedBy = req.user._id;
    await application.save();

    logActivity({
      action: "Doctor application approved",
      category: "Doctor Management",
      severity: "info",
      actor: { name: req.user.name, id: req.user._id },
      target: { name: application.name, id: application._id },
      ipAddress: req.ip,
      details: { specialty: application.specialty, licenseNumber: application.licenseNumber },
    });

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectApplication = async (req, res) => {
  try {
    const application = await DoctorApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Application already ${application.status}` });
    }

    application.status = "rejected";
    application.reviewedBy = req.user._id;
    await application.save();

    logActivity({
      action: "Doctor application rejected",
      category: "Doctor Management",
      severity: "warning",
      actor: { name: req.user.name, id: req.user._id },
      target: { name: application.name, id: application._id },
      ipAddress: req.ip,
      details: { specialty: application.specialty, licenseNumber: application.licenseNumber },
    });

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveAdminNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const application = await DoctorApplication.findByIdAndUpdate(
      req.params.id,
      { adminNotes: notes },
      { returnDocument: "after" },
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getApplications,
  approveApplication,
  rejectApplication,
  saveAdminNotes,
};
