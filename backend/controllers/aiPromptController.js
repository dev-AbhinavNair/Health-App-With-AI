const AIPrompt = require("../models/AIPrompt");

const defaultPrompt = `You are a medical triage assistant. Your role is to:
1. Analyze the user's symptoms and concerns described in the conversation
2. Provide a concise medical summary of the patient's condition
3. Give actionable health recommendations

You must format your response as valid JSON with two fields:
- "summary": A professional medical summary of the patient's symptoms and concerns (2-3 sentences)
- "recommendations": Specific actionable recommendations (3-5 bullet points)

Important: Always remind users that this is not a substitute for professional medical advice.`;

const getActivePrompt = async (req, res) => {
  try {
    let prompt = await AIPrompt.findOne({ isActive: true })
      .populate("updatedBy", "name")
      .sort("-createdAt");

    if (!prompt) {
      prompt = await AIPrompt.create({
        promptText: defaultPrompt,
        isActive: true,
      });
    }

    res.json(prompt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePrompt = async (req, res) => {
  try {
    const { promptText } = req.body;

    if (!promptText) {
      return res.status(400).json({ message: "Please provide prompt text" });
    }

    await AIPrompt.updateMany({ isActive: true }, { isActive: false });

    const prompt = await AIPrompt.create({
      promptText,
      isActive: true,
      updatedBy: req.user._id,
    });

    const populated = await AIPrompt.findById(prompt._id).populate(
      "updatedBy",
      "name",
    );

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getActivePrompt, updatePrompt, defaultPrompt };
