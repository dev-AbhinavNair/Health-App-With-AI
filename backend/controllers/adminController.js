const User = require("../models/User");
const Chat = require("../models/Chat");
const { logActivity } = require("../utils/activityLogger");

const getUsers = async (req, res) => {
  try {
    const filter = req.query.role ? { role: req.query.role } : {};

    const users = await User.find(filter).select("-otp -otpExpires");

    if (req.query.role === "doctor") {
      const usersWithCounts = await Promise.all(
        users.map(async (user) => {
          const chats = await Chat.find({ doctor: user._id });
          const distinctPatients = new Set(
            chats.map((c) => c.user?.toString()).filter(Boolean),
          );
          return {
            ...user.toObject(),
            patientCount: distinctPatients.size,
          };
        }),
      );
      return res.status(200).json(usersWithCounts);
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleBanStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wasBanned = user.isBanned;
    user.isBanned = !user.isBanned;
    await user.save();

    logActivity({
      action: user.isBanned ? "Doctor suspended" : "Doctor unsuspended",
      category: "Doctor Management",
      severity: user.isBanned ? "high" : "info",
      actor: { name: req.user.name, id: req.user._id },
      target: { name: user.name, id: user._id },
      ipAddress: req.ip,
      details: { email: user.email, previousStatus: wasBanned ? "suspended" : "active" },
    });

    res.status(200).json({
      message: `User successfully ${user.isBanned ? "suspended" : "unsuspended"}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    logActivity({
      action: "Doctor removed",
      category: "Doctor Management",
      severity: "high",
      actor: { name: req.user.name, id: req.user._id },
      target: { name: user.name, id: user._id },
      ipAddress: req.ip,
      details: { email: user.email, role: user.role },
    });

    res.status(200).json({ message: "User permanently removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  toggleBanStatus,
  deleteUser,
};
