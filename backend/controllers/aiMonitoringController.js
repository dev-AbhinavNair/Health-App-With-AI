const FlaggedRecommendation = require("../models/FlaggedRecommendation");
const Chat = require("../models/Chat");
const User = require("../models/User");

const getMetrics = async (req, res) => {
  try {
    const totalFlagged = await FlaggedRecommendation.countDocuments();
    const totalChats = await Chat.countDocuments();
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalDoctors = await User.countDocuments({ role: "doctor" });

    const avgResult = await FlaggedRecommendation.aggregate([
      { $group: { _id: null, avgConfidence: { $avg: "$confidence" } } },
    ]);
    const avgConfidenceScore = avgResult.length > 0 ? Math.round(avgResult[0].avgConfidence * 10) / 10 : null;

    const metrics = {
      totalRecommendations: {
        value: totalChats,
        trend: 8.4,
        direction: "up",
        status: "healthy",
      },
      flaggedCases: {
        value: totalFlagged,
        trend: 3.2,
        direction: "down",
        status: totalFlagged > 10 ? "warning" : "healthy",
      },
      avgConfidenceScore: {
        value: avgConfidenceScore ?? 0,
        trend: 1.8,
        direction: "up",
        status: avgConfidenceScore !== null && avgConfidenceScore >= 70 ? "healthy" : "warning",
      },
      activePatients: {
        value: totalUsers,
        trend: 5.2,
        direction: "up",
        status: "healthy",
      },
      totalDoctors: {
        value: totalDoctors,
        trend: 2.1,
        direction: "up",
        status: "healthy",
      },
      totalChats: {
        value: totalChats,
        trend: 12.3,
        direction: "up",
        status: "healthy",
      },
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFlagged = async (req, res) => {
  try {
    const { search, severity, status } = req.query;
    const filter = {};

    if (severity && severity !== "all") filter.severity = severity;
    if (status && status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { caseId: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
        { assignedDoctor: { $regex: search, $options: "i" } },
      ];
    }

    const flagged = await FlaggedRecommendation.find(filter).sort("-createdAt");
    res.json(flagged);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFlaggedStatus = async (req, res) => {
  try {
    const { action } = req.body;
    const flagged = await FlaggedRecommendation.findById(req.params.id);

    if (!flagged) {
      return res
        .status(404)
        .json({ message: "Flagged recommendation not found" });
    }

    flagged.actionTaken = action;
    flagged.reviewedBy = req.user._id;

    if (action === "marked-safe") flagged.status = "resolved";
    if (action === "rejected") flagged.status = "rejected";

    flagged.investigationHistory.push({
      action: `${action === "marked-safe" ? "Marked as Safe" : action === "escalated" ? "Escalated for Medical Review" : action === "rejected" ? "Rejected" : "Sent to Investigation Queue"} by ${req.user.name}`,
      performedBy: req.user.name,
      timestamp: new Date(),
    });

    await flagged.save();
    res.json(flagged);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMetrics, getFlagged, updateFlaggedStatus };
