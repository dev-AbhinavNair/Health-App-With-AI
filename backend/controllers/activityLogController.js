const ActivityLog = require("../models/ActivityLog");

const getLogs = async (req, res) => {
  try {
    const { search, category, severity, fromDate, toDate, limit } = req.query;
    const filter = {};

    if (category && category !== "All Categories") filter.category = category;
    if (severity && severity !== "All Severities") filter.severity = severity;

    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: "i" } },
        { "actor.name": { $regex: search, $options: "i" } },
        { "target.name": { $regex: search, $options: "i" } },
      ];
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate + "T23:59:59.999Z");
    }

    let query = ActivityLog.find(filter).sort("-createdAt");
    if (limit) query = query.limit(Number(limit));
    const logs = await query;
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportLogs = async (req, res) => {
  try {
    const { search, category, severity, fromDate, toDate } = req.query;
    const filter = {};

    if (category && category !== "All Categories") filter.category = category;
    if (severity && severity !== "All Severities") filter.severity = severity;

    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: "i" } },
        { "actor.name": { $regex: search, $options: "i" } },
        { "target.name": { $regex: search, $options: "i" } },
      ];
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate + "T23:59:59.999Z");
    }

    const logs = await ActivityLog.find(filter).sort("-createdAt");
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLogs, exportLogs };
