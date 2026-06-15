const Report = require("../models/Report");

const getReports = async (req, res) => {
  try {
    const { status, severity, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const reports = await Report.find(filter)
      .populate("reporter", "name email")
      .populate("resolvedBy", "name")
      .sort("-createdAt");
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReport = async (req, res) => {
  try {
    const { status } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (status) report.status = status;
    if (status === "resolved") report.resolvedBy = req.user._id;
    await report.save();

    const populated = await Report.findById(report._id)
      .populate("reporter", "name email")
      .populate("resolvedBy", "name");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReport = async (req, res) => {
  try {
    const { title, description, severity, type, relatedEntity } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Please add title and description" });
    }

    const report = await Report.create({
      title,
      description,
      severity: severity || "medium",
      type: type || "doctor-report",
      relatedEntity,
      reporter: req.user._id,
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getReports, updateReport, createReport };
