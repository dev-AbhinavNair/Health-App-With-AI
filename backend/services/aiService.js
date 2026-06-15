const axios = require("axios");
const AIPrompt = require("../models/AIPrompt");

const AI_API_URL =
  process.env.AI_API_URL || "https://api.nvidia.com/v1/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "";

const FALLBACK_AI_API_URL = process.env.FALLBACK_AI_API_URL || "";
const FALLBACK_AI_API_KEY = process.env.FALLBACK_AI_API_KEY || "";
const FALLBACK_AI_MODEL = process.env.FALLBACK_AI_MODEL || "";

const defaultPrompt = `You are a medical triage assistant. Your role is to:
1. Analyze the user's symptoms and concerns described in the conversation
2. Provide a concise medical summary of the patient's condition
3. Give actionable health recommendations
4. Extract structured symptom data from the conversation
5. Determine the overall severity level of the case

You must format your response as valid JSON with four fields:
- "summary": A professional medical summary of the patient's symptoms and concerns (2-3 sentences)
- "recommendations": Specific actionable recommendations (3-5 bullet points)
- "symptoms": An array of objects, each with "name" (the symptom), "duration" (how long it has been present), and "severity" (mild/moderate/severe). Extract as many symptoms as you can identify from the conversation.
- "severity": The overall severity level of the case. Must be one of: "low", "medium", "high", or "critical". Use "low" for minor concerns, "medium" for moderate symptoms, "high" for severe symptoms requiring prompt attention, and "critical" for life-threatening emergencies.

Important: Always remind users that this is not a substitute for professional medical advice.`;

const getSystemPrompt = async () => {
  try {
    const active = await AIPrompt.findOne({ isActive: true }).sort(
      "-createdAt",
    );
    return active?.promptText || defaultPrompt;
  } catch {
    return defaultPrompt;
  }
};

const callProvider = async (url, apiKey, model, messages, options = {}) => {
  if (!apiKey) return { error: "no_key" };

  const requestBody = {
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens ?? 800,
  };
  if (model) requestBody.model = model;

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: options.timeout || 60000,
    });
    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return { error: "timeout" };
    }
    const status = error.response?.status;
    if (status === 429) {
      console.warn(`AI Provider rate limited: ${url}`);
      return { error: "rate_limited" };
    }
    if (status === 401 || status === 403) {
      console.warn(`AI Provider auth error (${status}): ${url}`);
      return { error: "auth_error" };
    }
    console.error(`AI Provider error (${status || "network"}): ${url}`, error.response?.data || error.message);
    return { error: "unknown" };
  }
};

const generateSummary = async (conversation) => {
  const systemPrompt = await getSystemPrompt();

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversation.map((msg) => ({
      role: msg.isFromAI ? "assistant" : "user",
      content: msg.content,
    })),
  ];

  const opts = { temperature: 0.3, max_tokens: 1200 };

  let result = await callProvider(AI_API_URL, AI_API_KEY, AI_MODEL, messages, opts);
  if (result.error) {
    if (FALLBACK_AI_API_KEY) {
      console.log(`Primary AI failed (${result.error}), trying fallback`);
      result = await callProvider(FALLBACK_AI_API_URL, FALLBACK_AI_API_KEY, FALLBACK_AI_MODEL, messages, opts);
    }
  }

  if (result.error) {
    console.error("All AI providers failed");
    return getMockResponse();
  }

  const content = result.choices?.[0]?.message?.content;
  if (!content) return getMockResponse();
  return parseResponse(content);
};

const parseResponse = (raw) => {
  const stripped = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const jsonStart = stripped.indexOf('{');
  const jsonEnd = stripped.lastIndexOf('}');
  const jsonStr = jsonStart !== -1 && jsonEnd !== -1
    ? stripped.slice(jsonStart, jsonEnd + 1)
    : stripped;

  const normalizeRecs = (recs) => {
    if (!recs) return "Please consult with a healthcare provider for personalized medical advice.";
    if (Array.isArray(recs)) return recs.map((r, i) => `${i + 1}. ${r}`).join('\n');
    return recs;
  };

  const extractSymptoms = (parsed) => {
    if (!parsed.symptoms || !Array.isArray(parsed.symptoms)) return [];
    return parsed.symptoms.map((s) => ({
      name: s.name || "",
      duration: s.duration || "",
      severity: s.severity || "",
    }));
  };

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      summary: parsed.summary || stripped,
      recommendations: normalizeRecs(parsed.recommendations),
      symptoms: extractSymptoms(parsed),
      severity: parsed.severity || "medium",
    };
  } catch {
  }

  try {
    let fixed = jsonStr;
    fixed = fixed.replace(/"\s*\n\s+"/g, '",\n  "');
    const parsed = JSON.parse(fixed);
    return {
      summary: parsed.summary || stripped,
      recommendations: normalizeRecs(parsed.recommendations),
      symptoms: extractSymptoms(parsed),
      severity: parsed.severity || "medium",
    };
  } catch {
  }

  const summaryMatch = jsonStr.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const summary = summaryMatch ? summaryMatch[1].trim() : stripped;

  let recommendations = "Please consult with a healthcare provider for personalized medical advice.";
  const arrMatch = jsonStr.match(/"recommendations"\s*:\s*\[([\s\S]*?)\]/);
  if (arrMatch) {
    const items = arrMatch[1]
      .split(',')
      .map((item) => item.replace(/^\s*\*\s*/, '').replace(/^"|"$/g, '').trim())
      .filter(Boolean);
    if (items.length > 0) {
      recommendations = items.map((r, i) => `${i + 1}. ${r}`).join('\n');
    }
  } else {
    const strMatch = jsonStr.match(/"recommendations"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (strMatch) recommendations = strMatch[1];
  }

  let severity = "medium";
  const sevMatch = jsonStr.match(/"severity"\s*:\s*"(low|medium|high|critical)"/);
  if (sevMatch) severity = sevMatch[1];

  return { summary, recommendations, symptoms: [], severity };
};

const getMockResponse = () => {
  return {
    summary: "This is a mock summary",
    recommendations:
      "1. mock recommendation.\n2. mock recommendation.\n3. mock recommendation.\n4. mock recommendation. \n\nNote: This AI-generated summary is for informational purposes only and does not provide any medical advice.",
    symptoms: [
      { name: "Sample symptom", duration: "N/A", severity: "mild" },
    ],
    severity: "low",
  };
  };

const conversationPrompt = `You are a clinical intake assistant. Your role is to gather information about the patient's condition step by step.

Ask 1-2 focused questions at a time. You need to collect:
- What symptoms the patient is experiencing
- Duration and severity of each symptom
- Any triggers, patterns, or context
- Current medications and medical conditions
- Any other relevant health information

You must format your response as valid JSON:
- "type": "question" if you need more information, "ready" if you have enough
- "message": Your question or a closing message for the patient

Only set "type" to "ready" when you have gathered: symptoms, duration, severity, triggers/context, and medication/condition info.

When "ready", you should also include:
- "summary": A professional medical summary (2-3 sentences)
- "recommendations": Specific actionable recommendations (3-5 bullet points)
- "symptoms": Array of {name, duration, severity} objects
- "severity": One of "low", "medium", "high", "critical"
- "specialty": The most appropriate medical specialty from this list: "General Practice", "Cardiology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics", "Psychiatry", "Ophthalmology", "Gastroenterology", "Pulmonology", "Endocrinology", "Rheumatology", "Urology", "Obstetrics & Gynecology", "ENT", "Allergy & Immunology", "Infectious Disease", "Nephrology", "Hematology", "Oncology"

When "question", you ONLY need to provide "type" and "message".

Important: Always remind users that this is not a substitute for professional medical advice.`;

const generateConversationResponse = async (conversation, patientContext = null) => {
  const messages = [
    { role: "system", content: conversationPrompt },
    ...(patientContext?.age || patientContext?.conditions?.length || patientContext?.medications?.length
      ? [{
          role: "system",
          content: `Patient context: Age ${patientContext.age || "unknown"}, Conditions: ${(patientContext.conditions || []).join(", ") || "none reported"}, Medications: ${(patientContext.medications || []).map((m) => m.name).join(", ") || "none"}`,
        }]
      : []),
    ...conversation.map((msg) => ({
      role: msg.isFromAI ? "assistant" : "user",
      content: msg.content,
    })),
  ];

  if (!AI_API_KEY && !FALLBACK_AI_API_KEY) {
    return { type: "unavailable", message: "AI health assistant is currently unavailable. Please consult with a healthcare provider directly." };
  }

  const opts = { temperature: 0.3, max_tokens: 1200 };

  let result = await callProvider(AI_API_URL, AI_API_KEY, AI_MODEL, messages, opts);
  if (result.error) {
    if (FALLBACK_AI_API_KEY) {
      console.log(`Primary AI failed (${result.error}), trying fallback`);
      result = await callProvider(FALLBACK_AI_API_URL, FALLBACK_AI_API_KEY, FALLBACK_AI_MODEL, messages, opts);
      if (result.error) {
        console.warn(`Fallback AI also failed (${result.error})`);
      }
    }
  }

  if (!result.error) {
    const content = result.choices?.[0]?.message?.content;
    console.log("=== RAW AI RESPONSE ===", content);
    if (content) return parseConversationResponse(content);
  }

  console.error("All AI providers failed for conversation response");
  return { type: "error", message: "Sorry, I'm having trouble connecting right now. Please try again." };

};

const parseConversationResponse = (raw) => {
  const stripped = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const jsonStart = stripped.indexOf('{');
  const jsonEnd = stripped.lastIndexOf('}');
  const jsonStr = jsonStart !== -1 && jsonEnd !== -1
    ? stripped.slice(jsonStart, jsonEnd + 1)
    : stripped;

  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.type === "question") {
      return { type: "question", message: parsed.message || "Could you tell me more about that?" };
    }
    if (parsed.type === "ready") {
      const recs = parsed.recommendations;
      const recommendations = Array.isArray(recs)
        ? recs.map((r, i) => `${i + 1}. ${r}`).join('\n')
        : (recs || "Please consult with a healthcare provider.");
      return {
        type: "ready",
        message: parsed.message || "I've gathered enough information.",
        summary: parsed.summary || stripped,
        recommendations,
        symptoms: Array.isArray(parsed.symptoms)
          ? parsed.symptoms.map((s) => ({
              name: s.name || "",
              duration: s.duration || "",
              severity: String(s.severity || ""),
            }))
          : [],
        severity: parsed.severity || "medium",
        specialty: parsed.specialty || null,
      };
    }
  } catch {}

  return { type: "question", message: stripped };
};

module.exports = { generateSummary, generateConversationResponse };
