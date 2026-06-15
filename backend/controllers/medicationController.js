const DoseLog = require("../models/DoseLog");
const User = require("../models/User");

const logDose = async (req, res) => {
  try {
    const { medicationName } = req.body;
    if (!medicationName) {
      return res.status(400).json({ message: "medicationName is required" });
    }
    const log = await DoseLog.create({
      user: req.user._id,
      medicationName,
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTodayStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("medications");
    if (!user) return res.status(404).json({ message: "User not found" });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const logs = await DoseLog.find({
      user: req.user._id,
      takenAt: { $gte: todayStart, $lte: todayEnd },
    });

    const medicationStatus = (user.medications || []).map((med) => {
      const loggedToday = logs.filter(
        (l) => l.medicationName === med.name,
      ).length;
      return {
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        dailyDoses: med.dailyDoses || 1,
        takenToday: loggedToday,
        completed: loggedToday >= (med.dailyDoses || 1),
      };
    });

    res.json(medicationStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { logDose, getTodayStatus };
