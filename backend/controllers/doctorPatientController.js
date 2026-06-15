const Chat = require("../models/Chat");
const User = require("../models/User");
const Message = require("../models/Message");

const getMyPatients = async (req, res) => {
  try {
    const chats = await Chat.find({ doctor: req.user._id, status: { $ne: "completed" } })
      .populate("user", "name email age medicalConditions medications")
      .sort("-updatedAt");

    const seen = new Set();
    const patients = [];

    for (const chat of chats) {
      if (!chat.user) continue;
      const userId = chat.user._id.toString();
      if (seen.has(userId)) continue;
      seen.add(userId);

      const u = chat.user;
      patients.push({
        _id: u._id,
        name: u.name,
        email: u.email,
        age: u.age,
        medicalConditions: u.medicalConditions || [],
        medications: u.medications || [],
        lastChatId: chat._id,
        lastChatStatus: chat.status,
        lastActive: chat.updatedAt,
        aiSummary: chat.aiSummary,
        symptoms: chat.symptoms || [],
      });
    }

    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPatientDetail = async (req, res) => {
  try {
    const patientId = req.params.id;

    const patient = await User.findById(patientId).select("-otp -otpExpires");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const allChats = await Chat.find({
      user: patientId,
      doctor: req.user._id,
    })
      .populate("doctor", "name");

    const priority = { pending_review: 0, reviewed: 1, active: 2, completed: 3 };
    allChats.sort((a, b) => {
      const p = priority[a.status] - priority[b.status];
      if (p !== 0) return p;
      return b.updatedAt - a.updatedAt;
    });

    const latestChat = allChats.find((c) => c.status !== "completed") || allChats[0] || null;
    const chats = allChats;

    let messages = [];
    if (latestChat) {
      messages = await Message.find({ chat: latestChat._id })
        .populate("sender", "name")
        .sort("createdAt");
    }

    res.json({
      patient: {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        age: patient.age,
        medicalConditions: patient.medicalConditions || [],
        medications: patient.medications || [],
      },
      chats: chats.map((c) => ({
        _id: c._id,
        title: c.title,
        status: c.status,
        aiSummary: c.aiSummary,
        aiRecommendations: c.aiRecommendations,
        doctorNotes: c.doctorNotes,
        symptoms: c.symptoms || [],
        patientInfo: c.patientInfo,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      messages,
      latestChat: latestChat
        ? {
            _id: latestChat._id,
            status: latestChat.status,
            aiSummary: latestChat.aiSummary,
            aiRecommendations: latestChat.aiRecommendations,
            symptoms: latestChat.symptoms || [],
            patientInfo: latestChat.patientInfo,
            createdAt: latestChat.createdAt,
            updatedAt: latestChat.updatedAt,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUrgentCases = async (req, res) => {
  try {
    const chats = await Chat.find({
      doctor: req.user._id,
      severity: { $in: ["high", "critical"] },
    })
      .populate("user", "name email age medicalConditions medications")
      .sort({ severity: -1, updatedAt: -1 });

    const urgentCases = chats.map((chat) => ({
      _id: chat._id,
      patient: chat.user
        ? {
            _id: chat.user._id,
            name: chat.user.name,
            email: chat.user.email,
            age: chat.user.age,
            medicalConditions: chat.user.medicalConditions || [],
            medications: chat.user.medications || [],
          }
        : null,
      severity: chat.severity,
      aiSummary: chat.aiSummary,
      symptoms: chat.symptoms || [],
      status: chat.status,
      updatedAt: chat.updatedAt,
    }));

    res.json(urgentCases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getArchivedCases = async (req, res) => {
  try {
    const chats = await Chat.find({
      doctor: req.user._id,
      status: "completed",
    })
      .populate("user", "name email age medicalConditions medications")
      .sort("-updatedAt");

    const archived = chats.map((chat) => {
      const durationMs = chat.updatedAt - chat.createdAt;
      const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));
      return {
        _id: chat._id,
        title: chat.title,
        patient: chat.user
          ? {
              _id: chat.user._id,
              name: chat.user.name,
              email: chat.user.email,
              age: chat.user.age,
              medicalConditions: chat.user.medicalConditions || [],
              medications: chat.user.medications || [],
            }
          : null,
        symptoms: chat.symptoms || [],
        aiSummary: chat.aiSummary,
        aiRecommendations: chat.aiRecommendations,
        doctorNotes: chat.doctorNotes,
        isForwarded: chat.isForwarded,
        resolvedAt: chat.updatedAt,
        durationDays,
        createdAt: chat.createdAt,
      };
    });

    res.json(archived);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSymptomTrends = async (req, res) => {
  try {
    const chats = await Chat.find({
      doctor: req.user._id,
      status: { $ne: "completed" },
    }).select("symptoms createdAt");

    const now = Date.now();
    const msPerDay = 1000 * 60 * 60 * 24;
    const recentCutoff = new Date(now - 30 * msPerDay);
    const previousCutoff = new Date(now - 60 * msPerDay);

    const symptomEntries = chats
      .filter((c) => c.symptoms?.length)
      .flatMap((c) =>
        c.symptoms.map((s) => ({ name: s.name, date: c.createdAt }))
      )
      .filter((s) => s.name);

    const recent = symptomEntries.filter((s) => s.date >= recentCutoff);
    const previous = symptomEntries.filter(
      (s) => s.date >= previousCutoff && s.date < recentCutoff
    );

    const totalReports = recent.length;

    const recentCounts = {};
    recent.forEach((s) => {
      recentCounts[s.name] = (recentCounts[s.name] || 0) + 1;
    });
    const sortedRecent = Object.entries(recentCounts).sort((a, b) => b[1] - a[1]);
    const mostCommon = sortedRecent.length
      ? { name: sortedRecent[0][0], count: sortedRecent[0][1] }
      : null;

    const previousCounts = {};
    previous.forEach((s) => {
      previousCounts[s.name] = (previousCounts[s.name] || 0) + 1;
    });

    let trendingUp = null;
    let trendingDown = null;
    const trendChanges = [];
    for (const name of new Set([...Object.keys(recentCounts), ...Object.keys(previousCounts)])) {
      const curr = recentCounts[name] || 0;
      const prev = previousCounts[name] || 0;
      if (prev >= 2) {
        const change = Math.round(((curr - prev) / prev) * 100);
        trendChanges.push({ name, change, curr, prev });
      }
    }
    trendChanges.sort((a, b) => b.change - a.change);
    if (trendChanges.length) {
      if (trendChanges[0].change > 0) trendingUp = { name: trendChanges[0].name, change: trendChanges[0].change };
      if (trendChanges[trendChanges.length - 1].change < 0) trendingDown = { name: trendChanges[trendChanges.length - 1].name, change: Math.abs(trendChanges[trendChanges.length - 1].change) };
    }

    const dailyMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now - i * msPerDay);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = 0;
    }
    recent.forEach((s) => {
      const key = s.date.toISOString().slice(0, 10);
      if (dailyMap[key] !== undefined) dailyMap[key]++;
    });
    const dailyReports = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count,
      }));

    const symptomFrequency = sortedRecent.map(([name, count]) => ({ name, count }));

    res.json({ mostCommon, trendingUp, trendingDown, totalReports, dailyReports, symptomFrequency });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMedicationHistory = async (req, res) => {
  try {
    const DoseLog = require("../models/DoseLog");
    const chats = await Chat.find({
      doctor: req.user._id,
      status: { $ne: "completed" },
    }).populate("user", "name email medications");

    const seen = new Set();
    const patients = [];

    for (const chat of chats) {
      if (!chat.user) continue;
      const userId = chat.user._id.toString();
      if (seen.has(userId)) continue;
      seen.add(userId);

      if (!chat.user.medications || !chat.user.medications.length) {
        patients.push({
          patient: { _id: chat.user._id, name: chat.user.name, email: chat.user.email, medications: [] },
          adherence: null,
          totalDoses: 0,
          loggedDoses: 0,
        });
        continue;
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const logs = await DoseLog.find({
        user: userId,
        takenAt: { $gte: thirtyDaysAgo },
      });

      let totalExpected = 0;
      for (const med of chat.user.medications) {
        totalExpected += (med.dailyDoses || 1) * 30;
      }
      const loggedDoses = logs.length;
      const adherence = totalExpected > 0 ? Math.round((loggedDoses / totalExpected) * 100) : null;

      patients.push({
        patient: {
          _id: chat.user._id,
          name: chat.user.name,
          email: chat.user.email,
          medications: chat.user.medications || [],
        },
        adherence,
        totalDoses: totalExpected,
        loggedDoses,
      });
    }

    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMyPatients, getPatientDetail, getUrgentCases, getArchivedCases, getSymptomTrends, getMedicationHistory };
