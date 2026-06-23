const Chat = require("../models/Chat");
const DoseLog = require("../models/DoseLog");
const User = require("../models/User");

const getHistory = async (req, res) => {
  try {
    const { category = "all", search = "", page = 1, limit = 50 } = req.query;
    const userId = req.user._id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const entries = [];

    // ── 1. Symptom Logs & Doctor Summaries from Chats ──
    const chatFilter = {
      user: userId,
      status: { $in: ["reviewed", "completed"] },
    };
    const chats = await Chat.find(chatFilter)
      .populate("doctor", "name specialty")
      .sort({ updatedAt: -1 });

    for (const chat of chats) {
      // Doctor summary entry
      if (chat.aiSummary) {
        entries.push({
          type: "doctor_summary",
          id: `summary-${chat._id}`,
          title: chat.title || "Health Consultation",
          timestamp: chat.updatedAt || chat.createdAt,
          preview: chat.aiSummary.slice(0, 120) + (chat.aiSummary.length > 120 ? "..." : ""),
          severity: chat.severity,
          statusBadge: chat.doctor
            ? { label: `Reviewed by ${chat.doctor.name}${chat.doctor.specialty ? ` (${chat.doctor.specialty})` : ''}`, color: "blue" }
            : null,
          chatId: chat._id,
          summary: chat.aiSummary,
          recommendations: chat.aiRecommendations,
          doctorNotes: chat.doctorNotes,
          symptoms: chat.symptoms || [],
        });
      }

      // Symptom log entries from user messages
      if (chat.messages && chat.messages.length > 0) {
        const userMessages = chat.messages.filter((m) => !m.isFromAI);
        for (const msg of userMessages) {
          entries.push({
            type: "symptom_log",
            id: `symptom-${chat._id}-${msg._id || Date.now()}`,
            title: `Symptom Log - ${chat.title || "Health Consultation"}`,
            timestamp: msg.createdAt || chat.createdAt,
            preview: msg.content.slice(0, 100) + (msg.content.length > 100 ? "..." : ""),
            severity: chat.severity,
          doctorName: chat.doctor?.name || null,
          doctorSpecialty: chat.doctor?.specialty || null,
          chatId: chat._id,
            messageContent: msg.content,
          });
        }
      }
    }

    // ── 2. Missed Dose Events from DoseLog ──
    const user = await User.findById(userId).select("medications");
    const userMeds = user?.medications || [];

    if (userMeds.length > 0) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const logs = await DoseLog.find({
        user: userId,
        takenAt: { $gte: thirtyDaysAgo },
      });

      for (let d = 1; d <= 30; d++) {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        for (const med of userMeds) {
          const dailyDoses = med.dailyDoses || 1;
          const takenThatDay = logs.filter(
            (l) =>
              l.medicationName === med.name &&
              l.takenAt >= dayStart &&
              l.takenAt <= dayEnd,
          ).length;

          if (takenThatDay < dailyDoses) {
            entries.push({
              type: "medication_event",
              id: `missed-${med.name}-${dayStart.toISOString().slice(0, 10)}`,
              title: "Missed Dose Alert",
              timestamp: new Date(dayStart.getTime() + 12 * 60 * 60 * 1000),
              preview: "Scheduled dose not taken",
              medicationName: med.name,
              dosage: med.dosage || "",
              eventType: "missed_dose",
            });
          }
        }
      }
    }

    // ── Apply filters ──
    let filtered = entries;

    if (category !== "all") {
      filtered = filtered.filter((e) => e.type === category);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((e) => {
        const title = (e.title || "").toLowerCase();
        const preview = (e.preview || "").toLowerCase();
        const medName = (e.medicationName || "").toLowerCase();
        return title.includes(q) || preview.includes(q) || medName.includes(q);
      });
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + parseInt(limit));

    res.json({
      entries: paginated,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getHistory };
