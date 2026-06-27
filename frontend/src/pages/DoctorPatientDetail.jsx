import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import DoctorLayout from '../components/DoctorLayout';

function FlagModal({ chatId, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/chats/${chatId}/flag-recommendation`, { reason });
      onSuccess();
    } catch {
      alert('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Report AI Recommendation</h3>
        <p className="text-sm text-slate-500 mb-5">Explain why you believe this AI recommendation is incorrect. The admin team will review your report.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          placeholder="Describe what's incorrect about the AI's recommendation..."
          className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y mb-5"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting || !reason.trim()} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed">
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NA({ text = 'N/A' }) {
  return <span className="text-slate-300 italic">{text}</span>;
}

const statusStyles = {
  pending_review: 'bg-yellow-100 text-yellow-700',
  reviewed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  active: 'bg-slate-100 text-slate-700',
};

const statusLabels = {
  pending_review: 'Under Review',
  reviewed: 'Waiting',
  completed: 'Completed',
  active: 'Active',
};

export default function DoctorPatientDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedRecs, setEditedRecs] = useState('');
  const [saving, setSaving] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagged, setFlagged] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/doctors/patients/${id}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load patient details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const { patient, latestChat: chat, messages, chats } = data || {};
  const chatId = chat?._id;
  const conditions = patient?.medicalConditions || [];
  const medications = patient?.medications || [];
  const isCompleted = chat?.status === 'completed';

  const handleSave = async () => {
    if (!chatId) return;
    setSaving(true);
    try {
      const recs = editedRecs || chat?.aiRecommendations || '';
      await api.put(`/chats/${chatId}/review`, { aiRecommendations: recs });
      setData((prev) => ({
        ...prev,
        latestChat: { ...prev.latestChat, aiRecommendations: recs },
      }));
      setEditing(false);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAndForward = async () => {
    if (!chatId) return;
    setSaving(true);
    try {
      const recs = editedRecs || chat?.aiRecommendations || '';
      await api.put(`/chats/${chatId}/review`, { aiRecommendations: recs });
      await api.put(`/chats/${chatId}/forward`);
      setData((prev) => ({
        ...prev,
        latestChat: { ...prev.latestChat, aiRecommendations: recs, status: 'completed', isForwarded: true },
      }));
      setEditing(false);
    } catch (err) {
      console.error('Failed to approve:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DoctorLayout>
    );
  }

  if (!data) {
    return (
      <DoctorLayout>
        <div className="text-sm text-slate-400">Patient not found.</div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div>
        <Link
          to="/doctor/patients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Patient List
        </Link>

        {/* Patient Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{patient?.name || <NA />}</h1>
                {chat?.status && (
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusStyles[chat.status] || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabels[chat.status] || chat.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {patient?.age ? `${patient.age} years old` : <NA />}
                {conditions.length > 0 && <> &middot; {conditions.join(', ')}</>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Last Update</p>
              <p className="text-sm text-slate-600 font-medium">
                {chat?.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : <NA />}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-12 mt-6 pt-6 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1.5">Active Medications</p>
              <p className="text-lg font-bold text-slate-900">
                {medications.length > 0 ? medications.length : <NA />}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">Recent Cases</p>
              <p className="text-lg font-bold text-slate-900">
                {chats?.length || 0} <span className="text-sm font-normal text-slate-500">Total</span>
              </p>
            </div>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="flex gap-6 items-start">
          {/* Left Column */}
          <div className="w-[400px] shrink-0 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <h2 className="text-sm font-semibold text-slate-800">Current Medications</h2>
              </div>
              {medications.length === 0 ? (
                <p className="text-sm text-slate-300 italic">No medications listed</p>
              ) : (
                <div className="space-y-0">
                  {medications.map((med, i) => (
                    <div key={i} className="py-3 first:pt-0 last:pb-0 border-b border-slate-100 last:border-b-0">
                      <p className="text-sm font-medium text-slate-900">{med.name || <NA />}{med.dosage ? ` ${med.dosage}` : ''}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{med.frequency || <NA />}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-slate-800">
                  {chat ? 'Active Case' : 'No Active Case'}
                </h2>
                {chat?.status && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusStyles[chat.status] || 'bg-slate-100 text-slate-700'}`}>
                    {statusLabels[chat.status] || chat.status}
                  </span>
                )}
              </div>

              {!chat ? (
                <p className="text-sm text-slate-300 italic">No case data available for this patient.</p>
              ) : (
                <>
                  {/* AI Summary */}
                  {chat.aiSummary && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        AI-Generated Summary
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{chat.aiSummary}</p>
                    </div>
                  )}

                  {/* Possible Condition */}
                  {chat.possibleCondition && (
                    <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">AI-Suspected Condition - {chat.possibleCondition}</p>
                          {chat.possibleConditionConfidence && (
                            <p className="text-xs text-indigo-700 mt-1">
                              Confidence - <span className="font-semibold">{chat.possibleConditionConfidence.charAt(0).toUpperCase() + chat.possibleConditionConfidence.slice(1)}</span>
                            </p>
                          )}
                          <p className="text-xs text-indigo-600 mt-1">This is a preliminary AI assessment — please verify with your clinical judgment.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Symptoms */}
                  {chat.symptoms?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        Symptoms
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {chat.symptoms.map((s, i) => (
                          <span
                            key={i}
                            className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full"
                          >
                            {s.name}{s.duration ? ` (${s.duration})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Patient Info Snapshot */}
                  {chat.patientInfo && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        Patient Info at Time of Report
                      </h3>
                      <div className="space-y-1 text-sm text-slate-600">
                        {chat.patientInfo.age && <p>Age: {chat.patientInfo.age}</p>}
                        {chat.patientInfo.conditions?.length > 0 && (
                          <p>Conditions: {chat.patientInfo.conditions.join(', ')}</p>
                        )}
                        {chat.patientInfo.medications?.length > 0 && (
                          <p>Medications: {chat.patientInfo.medications.map((m) => m.name).join(', ')}</p>
                        )}
                        {!chat.patientInfo.age && !chat.patientInfo.conditions?.length && !chat.patientInfo.medications?.length && (
                          <span className="text-slate-300 italic">No additional info recorded</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Conversation History */}
        {messages?.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Conversation History</h2>
            <div className="space-y-4">
              {messages.map((msg) => {
                const isUser = !msg.isFromAI;
                return (
                  <div key={msg._id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${isUser ? 'bg-blue-50 border border-blue-200' : 'bg-purple-50 border border-purple-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${isUser ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {isUser ? 'P' : 'AI'}
                        </div>
                        <span className={`text-xs font-medium ${isUser ? 'text-blue-700' : 'text-purple-700'}`}>
                          {isUser ? (patient?.name || 'Patient') : 'AI Assistant'}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-auto">{formatTime(msg.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-800 leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {chat && chat.aiRecommendations && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">AI Recommendations</h2>
              {isCompleted && (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                  Forwarded to Patient &check;
                </span>
              )}
            </div>

            {editing || !isCompleted ? (
              <textarea
                value={editing ? editedRecs : chat.aiRecommendations}
                onChange={(e) => {
                  setEditedRecs(e.target.value);
                  if (!editing) setEditing(true);
                }}
                rows={6}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y mb-4"
              />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line mb-4">{chat.aiRecommendations}</p>
            )}

            {!isCompleted && (
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl py-2.5 text-sm hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleApproveAndForward}
                  disabled={saving}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-white font-medium rounded-xl py-2.5 text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Processing...' : 'Approve & Forward'}
                </button>
                {!flagged && (
                  <button
                    onClick={() => setShowFlagModal(true)}
                    disabled={saving}
                    className="px-4 bg-white border border-red-300 text-red-600 font-medium rounded-xl py-2.5 text-sm hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Report
                  </button>
                )}
              </div>
            )}

            {isCompleted && !editing && (
              <p className="text-sm text-slate-400 italic">Recommendations have been approved and forwarded to the patient.</p>
            )}
          </div>
        )}

        {showFlagModal && chatId && (
          <FlagModal
            chatId={chatId}
            onClose={() => setShowFlagModal(false)}
            onSuccess={() => {
              setShowFlagModal(false);
              setFlagged(true);
            }}
          />
        )}
      </div>
    </DoctorLayout>
  );
}
