import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const WELCOME_MESSAGE = {
  _id: "welcome",
  content:
    "Hello! I'm your health assistant. Please describe your symptoms and concerns in as much detail as you can. I'll ask you a few questions to help organize everything for your doctor.",
  isFromAI: true,
  createdAt: new Date().toISOString(),
};

export default function UserChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    initChat();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiThinking]);

  useEffect(() => {
    if (!sending && !aiThinking) inputRef.current?.focus();
  }, [sending, aiThinking]);

  const initChat = async () => {
    try {
      const res = await fetch("/api/chats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch chats");
      const chats = await res.json();
      const active = chats.find((c) => c.status === "active");

      if (active) {
        setChat(active);
        const detailRes = await fetch(`/api/chats/${active._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (detailRes.ok) {
          const data = await detailRes.json();
          setMessages(data.messages || []);
        }
        setLoading(false);
        return;
      }

      const createRes = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ title: "Health Consultation" }),
      });
      if (createRes.ok) {
        const newChat = await createRes.json();
        setChat(newChat);
        setMessages([]);
      }
    } catch (err) {
      console.error("Error initializing chat:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerAiResponse = useCallback(async () => {
    if (!chat) return;
    setAiThinking(true);
    try {
      const res = await fetch(`/api/chats/${chat._id}/ai-respond`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log(
          "=== FRONTEND AI RESPONSE ===",
          res.status,
          data.type,
          data.message?.slice(0, 60),
        );
        const aiMsg = {
          _id: "ai-" + Date.now(),
          content: data.message,
          isFromAI: true,
          sender: { name: "Health Assistant" },
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (data.type === "ready") {
          setChat((prev) => ({
            ...prev,
            status: "pending_review",
            aiSummary: data.summary,
            aiRecommendations: data.recommendations,
          }));
        } else if (data.type === "unavailable") {
          setChat((prev) => ({ ...prev, status: "completed" }));
        } else if (data.type === "error") {
          // do nothing — keep chat active, user can retry
        } else if (data.type === "in_progress") {
          // previous AI call still running — ignore
        }
      }
    } catch (err) {
      console.error("Error getting AI response:", err);
    } finally {
      setAiThinking(false);
    }
  }, [chat]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chat || sending || aiThinking) return;
    const content = inputValue.trim();
    setSending(true);
    try {
      const res = await fetch(`/api/chats/${chat._id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setInputValue("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (chat?.status === "active" && messages.length > 0 && !aiThinking) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && !lastMsg.isFromAI) {
        triggerAiResponse();
      }
    }
  }, [messages, chat?.status, triggerAiResponse]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Please log in to access consultations.</p>
      </div>
    );
  }

  const isActive = chat?.status === "active";
  const isPendingReview = chat?.status === "pending_review";
  const isReviewed = chat?.status === "reviewed";
  const isCompleted = chat?.status === "completed";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Header ── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 sticky top-0 z-10">
        <button
          onClick={handleBack}
          className="p-1.5 text-slate-500 hover:text-slate-700 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex-1 text-center">
          <h1 className="text-[20px] font-semibold text-slate-800 leading-tight">
            Symptom Chat
          </h1>
          <p className="text-[12px] text-slate-500">
            Describe symptoms naturally
          </p>
        </div>

        <Link
          to="/my-profile"
          className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
        >
          My Profile
        </Link>
      </header>

      {/* ── Info Banner ── */}
      <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center justify-center px-4">
        <p className="text-xs text-slate-500 text-center leading-tight">
          &#128172; Your words are captured exactly as you say them. The AI
          organizes information but doesn&apos;t change your meaning.
        </p>
      </div>

      {/* ── Main Chat Area ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[620px] mx-auto py-6 px-4 space-y-4">
          {loading ? (
            <div className="text-center text-slate-400 py-16">
              Loading your consultation...
            </div>
          ) : !chat ? (
            <div className="text-center text-slate-400 py-16">
              Could not start a consultation. Please try again.
            </div>
          ) : (
            <>
              {/* Welcome AI message */}
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-[80%]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
                      AI
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      Health Assistant
                    </span>
                  </div>
                  <p className="text-[14px] text-slate-800 leading-relaxed">
                    {WELCOME_MESSAGE.content}
                  </p>
                </div>
              </div>

              {/* User & AI messages */}
              {messages.map((msg) =>
                msg.isFromAI ? (
                  <div key={msg._id} className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-[80%]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
                          AI
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          Health Assistant
                        </span>
                      </div>
                      <p className="text-[14px] text-slate-800 leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={msg._id} className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-2xl px-5 py-4 max-w-[70%]">
                      <p className="text-[14px] leading-relaxed">
                        {msg.content}
                      </p>
                      <p className="text-[11px] text-blue-200 text-right mt-1.5">
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ),
              )}

              {/* AI typing indicator */}
              {aiThinking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
                        AI
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        Health Assistant
                      </span>
                      <span className="flex gap-1 ml-2">
                        <span
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Summary Section ── */}
              {(isPendingReview || isReviewed || isCompleted) &&
                chat.aiSummary && (
                  <div className="border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50/80 p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
                        AI
                      </div>
                      <div>
                        <h3 className="text-[18px] font-semibold text-slate-800 leading-tight">
                          AI-Generated Summary
                        </h3>
                        <p className="text-xs text-slate-500">
                          This is what will be sent to your doctor:
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div>
                        <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wide">
                          Summary
                        </p>
                        <p className="text-sm text-slate-800 mt-1 leading-relaxed">
                          {chat.aiSummary}
                        </p>
                      </div>
                      {chat.aiRecommendations && (
                        <div>
                          <p className="text-[13px] font-medium text-slate-500 uppercase tracking-wide">
                            Recommendations
                          </p>
                          <p className="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-line">
                            {chat.aiRecommendations}
                          </p>
                        </div>
                      )}
                    </div>

                    <div
                      className={`w-full rounded-xl py-3 text-center text-sm font-medium ${
                        isPendingReview
                          ? "bg-amber-50 border border-amber-200 text-amber-700"
                          : isReviewed
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : "bg-green-50 border border-green-200 text-green-700"
                      }`}
                    >
                      {isPendingReview && "Summary sent to doctor for review"}
                      {isReviewed && "Doctor has reviewed your case"}
                      {isCompleted && "Recommendations forwarded to you \u2713"}
                    </div>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>

      {/* ── Sticky Input ── */}
      <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200">
        <div className="max-w-[620px] mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe how you're feeling..."
              disabled={!isActive || aiThinking}
              className="flex-1 h-14 bg-white border border-slate-300 rounded-2xl px-5 text-[15px] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed transition-shadow"
            />
            <button
              onClick={handleSend}
              disabled={
                !isActive || !inputValue.trim() || sending || aiThinking
              }
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 19V5m0 0l-7 7m7-7l7 7"
                />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            For emergencies, call 911 or your local emergency number
          </p>
        </div>
      </div>
    </div>
  );
}
