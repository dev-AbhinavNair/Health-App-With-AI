const axios = require("axios");
const AIPrompt = require("../models/AIPrompt");

const AI_API_URL =
  process.env.AI_API_URL || "https://api.nvidia.com/v1/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "";

const FALLBACK_AI_API_URL = process.env.FALLBACK_AI_API_URL || "";
const FALLBACK_AI_API_KEY = process.env.FALLBACK_AI_API_KEY || "";
const FALLBACK_AI_MODEL = process.env.FALLBACK_AI_MODEL || "";

const HF_API_URL = process.env.HUGGINGFACE_API_URL || "";
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
const HF_MODEL = process.env.HUGGINGFACE_MODEL || "";

const defaultPrompt = `You are a medical triage assistant. Your role is to:
1. Analyze the user's symptoms and concerns described in the conversation
2. Provide a concise medical summary of the patient's condition
3. Give actionable health recommendations
4. Extract structured symptom data from the conversation
5. Determine the overall severity level of the case

You must format your response as valid JSON with five fields:
- "summary": A professional medical summary of the patient's symptoms and concerns (2-3 sentences)
- "recommendations": Specific actionable recommendations (3-5 bullet points) tailored to the suspected condition
- "symptoms": An array of objects, each with "name" (the symptom), "duration" (how long it has been present), and "severity" (mild/moderate/severe). Extract as many symptoms as you can identify from the conversation.
- "severity": The overall severity level of the case. Must be one of: "low", "medium", "high", or "critical". Use "low" for minor concerns, "medium" for moderate symptoms, "high" for severe symptoms requiring prompt attention, and "critical" for life-threatening emergencies.
- "possibleCondition": Your best assessment of the likely condition or disease based on the symptoms (e.g. "Gastroenteritis", "Urinary Tract Infection", "Migraine", "Upper Respiratory Infection"). Be as specific as the symptoms allow. Use null if you cannot determine a likely condition.
- "confidence": Your confidence level in the possible condition. Must be one of: "low", "medium", "high". Use "high" only when symptoms strongly and specifically point to a single condition. Use "medium" when symptoms suggest a condition but aren't definitive. Use "low" when you're speculating based on limited information. Use null if possibleCondition is null.

Important: Always remind users that this is not a substitute for professional medical advice.`;

const getSystemPrompt = async (type = "summary") => {
  try {
    const active = await AIPrompt.findOne({ type, isActive: true }).sort(
      "-createdAt",
    );
    if (active?.promptText) return active.promptText;
    return type === "conversation" ? conversationPrompt : defaultPrompt;
  } catch {
    return type === "conversation" ? conversationPrompt : defaultPrompt;
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

  const classifyError = (err) => {
    if (err.code === "ECONNABORTED") return "timeout";
    const status = err.response?.status;
    if (status === 429) return "rate_limited";
    if (status === 503 || status === 502 || status === 504) return "overloaded";
    return "unknown";
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
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
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn(`AI Provider auth error (${error.response.status}): ${url}`);
        return { error: "auth_error" };
      }
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      const errType = classifyError(error);
      console.error(`AI Provider error (${errType}): ${url}`, error.response?.data || error.message);
      return { error: errType };
    }
  }
};

const getProviders = () => {
  const providers = [
    { url: AI_API_URL, key: AI_API_KEY, model: AI_MODEL, name: "Groq (primary)" },
  ];
  if (AI_API_KEY) {
    providers.push({ url: AI_API_URL, key: AI_API_KEY, model: "mixtral-8x7b-32768", name: "Groq (mixtral)" });
  }
  if (HF_API_KEY) {
    providers.push({ url: HF_API_URL, key: HF_API_KEY, model: HF_MODEL, name: "HuggingFace" });
  }
  if (FALLBACK_AI_API_KEY) {
    providers.push({ url: FALLBACK_AI_API_URL, key: FALLBACK_AI_API_KEY, model: FALLBACK_AI_MODEL, name: "OpenRouter" });
  }
  return providers;
};

const tryProviders = async (messages, opts) => {
  const providers = getProviders();
  for (const p of providers) {
    const result = await callProvider(p.url, p.key, p.model, messages, opts);
    if (!result.error) return result;
    console.log(`Provider "${p.name}" failed (${result.error}), trying next`);
  }
  return { error: "all_providers_failed" };
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

  const result = await tryProviders(messages, opts);

  if (result.error) {
    console.error("All AI providers failed");
    return fallbackResponse();
  }

  const content = result.choices?.[0]?.message?.content;
  if (!content) return fallbackResponse();
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
      possibleCondition: parsed.possibleCondition || null,
      possibleConditionConfidence: parsed.confidence || null,
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
      possibleCondition: parsed.possibleCondition || null,
      possibleConditionConfidence: parsed.confidence || null,
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

  return { summary, recommendations, symptoms: [], severity, possibleCondition: null, possibleConditionConfidence: null };
};

const fallbackResponse = () => {
  return {
    summary: "Unable to generate summary at this time.",
    recommendations:
      "Please consult with a healthcare provider for personalized medical advice.",
    symptoms: [],
    severity: "low",
    possibleCondition: null,
    possibleConditionConfidence: null,
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
- "recommendations": Specific actionable recommendations (3-5 bullet points) tailored to the suspected condition
- "symptoms": Array of {name, duration, severity} objects
- "severity": One of "low", "medium", "high", "critical"
- "specialty": The most appropriate medical specialty from this list: "General Practice", "Cardiology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics", "Psychiatry", "Ophthalmology", "Gastroenterology", "Pulmonology", "Endocrinology", "Rheumatology", "Urology", "Obstetrics & Gynecology", "ENT", "Allergy & Immunology", "Infectious Disease", "Nephrology", "Hematology", "Oncology"
- "possibleCondition": Your best assessment of the likely condition or disease based on the symptoms (e.g. "Gastroenteritis", "Urinary Tract Infection", "Migraine", "Upper Respiratory Infection"). Be as specific as the symptoms allow. Use null if you cannot determine a likely condition.
- "confidence": Your confidence level in the possible condition. Must be one of: "low", "medium", "high". Use "high" only when symptoms strongly and specifically point to a single condition. Use "medium" when symptoms suggest a condition but aren't definitive. Use "low" when you're speculating based on limited information. Use null if possibleCondition is null.

When "question", you ONLY need to provide "type" and "message".

Important: Always remind users that this is not a substitute for professional medical advice.`;

const generateConversationResponse = async (conversation, patientContext = null) => {
  const systemPrompt = await getSystemPrompt("conversation");
  const messages = [
    { role: "system", content: systemPrompt },
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

  if (!AI_API_KEY && !HF_API_KEY && !FALLBACK_AI_API_KEY) {
    return { type: "unavailable", message: "AI health assistant is currently unavailable. Please consult with a healthcare provider directly." };
  }

  const opts = { temperature: 0.3, max_tokens: 1200 };

  let result = await tryProviders(messages, opts);

  if (!result.error) {
    const content = result.choices?.[0]?.message?.content;

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
      const recommendations = Array.isArray(recs) && recs.length > 0
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
        possibleCondition: parsed.possibleCondition || null,
        possibleConditionConfidence: parsed.confidence || null,
      };
    }
  } catch {}

  return { type: "question", message: stripped };
};

module.exports = { generateSummary, generateConversationResponse };
