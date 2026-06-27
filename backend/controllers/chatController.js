const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");
const FlaggedRecommendation = require("../models/FlaggedRecommendation");
const { logActivity } = require("../utils/activityLogger");
const { generateSummary, generateConversationResponse } = require("../services/aiService");

const createChat = async (req, res) => {
  try {
    const { title } = req.body;

    const chat = await Chat.create({
      user: req.user._id,
      title: title || "Health Consultation",
    });

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserChats = async (req, res) => {
  try {
    let chats;

    if (req.user.role === "user") {
      chats = await Chat.find({ user: req.user._id })
        .populate("user", "name")
        .populate("doctor", "name specialty")
        .sort("-updatedAt");
    } else {
      const { doctorId, status } = req.query;
      let filter = {};

      if (doctorId) filter.doctor = doctorId;
      if (status) filter.status = status;

      chats = await Chat.find(filter)
        .populate("user", "name")
        .populate("doctor", "name specialty")
        .sort("-updatedAt");
    }

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate("user", "name")
      .populate("doctor", "name specialty");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (
      req.user.role === "user" &&
      chat.user._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this chat" });
    }

    const messages = await Message.find({ chat: chat._id })
      .populate("sender", "name")
      .sort("createdAt");

    res.json({
      ...chat._doc,
      messages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Please add message content" });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (
      req.user.role === "user" &&
      chat.user.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this chat" });
    }

    const message = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      content,
      isFromAI: false,
    });

    chat.updatedAt = Date.now();
    await chat.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateAISummary = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (
      req.user.role === "user" &&
      chat.user.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this chat" });
    }

    if (chat.status !== "active") {
      return res
        .status(400)
        .json({ message: "AI summary can only be generated for active chats" });
    }

    const messages = await Message.find({ chat: chat._id })
      .populate("sender", "name")
      .sort("createdAt");

    const conversation = messages.map((msg) => ({
      sender: msg.sender ? msg.sender.name : "Unknown",
      content: msg.content,
      isFromAI: msg.isFromAI,
    }));

    const aiResult = await generateSummary(conversation);
    const aiSummary = aiResult.summary;
    const aiRecommendations = aiResult.recommendations;
    const symptoms = aiResult.symptoms || [];

    const patientUser = await User.findById(chat.user);
    const patientInfo = patientUser
      ? {
          age: patientUser.age,
          conditions: patientUser.medicalConditions || [],
          medications: patientUser.medications || [],
        }
      : undefined;

    chat.aiSummary = aiSummary;
    chat.aiRecommendations = aiRecommendations;
    chat.symptoms = symptoms;
    chat.severity = aiResult.severity || "medium";
    chat.possibleCondition = aiResult.possibleCondition || null;
    chat.possibleConditionConfidence = aiResult.possibleConditionConfidence || null;
    if (patientInfo) chat.patientInfo = patientInfo;
    chat.status = "pending_review";

    if (!chat.doctor) {
      let doctors = await User.find({ role: "doctor", isBanned: false });
      if (aiResult.specialty) {
        const matched = doctors.filter((d) => d.specialty === aiResult.specialty);
        if (matched.length > 0) doctors = matched;
      }
      if (doctors.length > 0) {
        chat.doctor = doctors[Math.floor(Math.random() * doctors.length)]._id;
      }
    }

    await chat.save();

    res.json({
      summary: aiSummary,
      recommendations: aiRecommendations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const doctorReview = async (req, res) => {
  try {
    const { aiSummary, aiRecommendations, doctorNotes } = req.body;

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (req.user.role !== "doctor" && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to review this chat" });
    }

    if (aiSummary !== undefined) chat.aiSummary = aiSummary;
    if (aiRecommendations !== undefined)
      chat.aiRecommendations = aiRecommendations;
    if (doctorNotes !== undefined) chat.doctorNotes = doctorNotes;
    chat.status = "reviewed";
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const forwardChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.status !== "reviewed") {
      return res
        .status(400)
        .json({ message: "Chat must be reviewed before forwarding" });
    }

    chat.isForwarded = true;
    chat.status = "completed";
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!doctorId) {
      const doctors = await User.find({ role: "doctor", isBanned: false });
      if (doctors.length === 0) {
        return res
          .status(400)
          .json({ message: "No doctors available for assignment" });
      }
      const randomIndex = Math.floor(Math.random() * doctors.length);
      chat.doctor = doctors[randomIndex]._id;
    } else {
      const doctor = await User.findById(doctorId);
      if (!doctor || doctor.role !== "doctor") {
        return res.status(400).json({ message: "Invalid doctor ID" });
      }
      chat.doctor = doctorId;
    }

    await chat.save();

    const populatedChat = await Chat.findById(chat._id)
      .populate("user", "name")
      .populate("doctor", "name specialty");

    res.json(populatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const aiRespondLocks = {};

const aiRespond = async (req, res) => {
  if (aiRespondLocks[req.params.id]) {
    return res.json({ type: "in_progress" });
  }
  aiRespondLocks[req.params.id] = true;
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    if (chat.status !== "active") return res.status(400).json({ message: "Chat is no longer active" });

    if (!chat.aiStatus || chat.aiStatus === "idle") {
      chat.aiStatus = "collecting";
      await chat.save();
    }

    if (chat.aiStatus !== "collecting") {
      return res.status(400).json({ message: "AI has already completed data collection" });
    }

    const messages = await Message.find({ chat: chat._id })
      .populate("sender", "name")
      .sort("createdAt");

    const conversation = messages.map((msg) => ({
      sender: msg.sender ? msg.sender.name : "Unknown",
      content: msg.content,
      isFromAI: msg.isFromAI,
    }));

    const patientUser = await User.findById(chat.user);
    const patientContext = patientUser
      ? {
          age: patientUser.age,
          conditions: patientUser.medicalConditions || [],
          medications: patientUser.medications || [],
        }
      : null;

    const aiResult = await generateConversationResponse(conversation, patientContext);

    if (aiResult.type === "question") {
      await Message.create({
        chat: chat._id,
        sender: chat.doctor || chat.user,
        content: aiResult.message,
        isFromAI: true,
      });
      chat.updatedAt = Date.now();
      await chat.save();
      return res.json({ type: "question", message: aiResult.message });
    }

    if (aiResult.type === "unavailable") {
      await Message.create({
        chat: chat._id,
        sender: chat.doctor || chat.user,
        content: aiResult.message,
        isFromAI: true,
      });
      chat.status = "completed";
      chat.aiStatus = "ready";
      await chat.save();
      return res.json({ type: "unavailable", message: aiResult.message });
    }

    if (aiResult.type === "error") {
      await Message.create({
        chat: chat._id,
        sender: chat.doctor || chat.user,
        content: aiResult.message,
        isFromAI: true,
      });
      chat.updatedAt = Date.now();
      await chat.save();
      return res.json({ type: "error", message: aiResult.message });
    }

    if (aiResult.type === "ready") {
      const closingMsg = await Message.create({
        chat: chat._id,
        sender: chat.doctor || chat.user,
        content: aiResult.message || "I've gathered enough information to prepare a summary.",
        isFromAI: true,
      });

      chat.aiSummary = aiResult.summary;
      chat.aiRecommendations = Array.isArray(aiResult.recommendations) && aiResult.recommendations.length > 0
        ? aiResult.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
        : (aiResult.recommendations || "Please consult with a healthcare provider.");
      chat.symptoms = (aiResult.symptoms || []).map((s) => ({
        name: s.name || "",
        duration: s.duration || "",
        severity: String(s.severity || ""),
      }));
      chat.severity = aiResult.severity || "medium";
      chat.possibleCondition = aiResult.possibleCondition || null;
      chat.possibleConditionConfidence = aiResult.possibleConditionConfidence || null;
      if (patientContext) chat.patientInfo = patientContext;

      if (!chat.doctor) {
        let doctors = await User.find({ role: "doctor", isBanned: false });
        if (aiResult.specialty) {
          const matched = doctors.filter((d) => d.specialty === aiResult.specialty);
          if (matched.length > 0) doctors = matched;
        }
        if (doctors.length > 0) {
          chat.doctor = doctors[Math.floor(Math.random() * doctors.length)]._id;
        }
      }

      chat.aiStatus = "ready";
      chat.status = "pending_review";
      chat.updatedAt = Date.now();
      await chat.save();

      return res.json({
        type: "ready",
        message: closingMsg.content,
        summary: aiResult.summary,
        recommendations: aiResult.recommendations,
        possibleCondition: aiResult.possibleCondition || null,
        confidence: aiResult.possibleConditionConfidence || null,
      });
    }

    res.status(500).json({ message: "Unexpected AI response" });
  } catch (error) {
    console.error("aiRespond error:", error.message);
    res.status(500).json({ message: error.message });
  } finally {
    delete aiRespondLocks[req.params.id];
  }
};

const flagRecommendation = async (req, res) => {
  try {
    const { reason } = req.body;
    const chat = await Chat.findById(req.params.id)
      .populate("user", "name email");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Please provide a reason for flagging" });
    }

    const flagged = await FlaggedRecommendation.create({
      caseId: chat._id.toString(),
      recommendation: chat.aiRecommendations || "",
      patientId: chat.user?._id?.toString() || "unknown",
      patientCondition: chat.patientInfo?.conditions?.join(", ") || "",
      flagReason: reason,
      severity: "medium",
      status: "under-review",
      assignedDoctor: req.user.name,
    });

    logActivity({
      action: "AI recommendation flagged",
      category: "AI Monitoring",
      severity: "warning",
      actor: { name: req.user.name, id: req.user._id },
      target: { name: chat.user?.name || "Unknown", id: chat.user?._id },
      ipAddress: req.ip,
      details: { chatId: chat._id, flagId: flagged._id, reason },
    });

    res.status(201).json(flagged);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createChat,
  getUserChats,
  getChatById,
  sendMessage,
  generateAISummary,
  aiRespond,
  doctorReview,
  forwardChat,
  assignDoctor,
  flagRecommendation,
};
