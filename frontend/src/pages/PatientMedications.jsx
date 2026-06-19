import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function parseTimeToMinutes(timeStr) {
  const [h, m, ap] = timeStr.match(/(\d+):(\d+) (AM|PM)/).slice(1);
  let hour = parseInt(h);
  if (ap === 'PM' && hour !== 12) hour += 12;
  if (ap === 'AM' && hour === 12) hour = 0;
  return hour * 60 + parseInt(m);
}

export default function PatientMedications() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(null);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [latestChat, setLatestChat] = useState(null);

  useEffect(() => {
    fetchOverview();
    fetchRecommendations();
  }, []);

  const fetchOverview = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await api.get('/medications/overview');
      setData(res.data);
    } catch {
      setError('Failed to load medication data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/chats');
      const withRecs = res.data.find(c => c.aiRecommendations);
      if (withRecs?.aiRecommendations) {
        setRecommendations(withRecs.aiRecommendations);
        setLatestChat(withRecs);
      }
    } catch {}
  };

  const handleMarkTaken = async (medicationName) => {
    setLogging(medicationName);
    try {
      setError('');
      await api.post('/medications/log', { medicationName });
      await fetchOverview();
    } catch {
      setError('Failed to log dose');
    } finally {
      setLogging(null);
    }
  };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const getScheduleStatus = (time) => {
    const tMin = parseTimeToMinutes(time);
    if (tMin + 60 < currentMinutes) return 'past';
    if (tMin <= currentMinutes) return 'current';
    return 'future';
  };

  const getAdherenceBadgeClass = (badge) => {
    if (badge === 'good') return 'bg-green-100 text-green-700';
    if (badge === 'moderate') return 'bg-blue-100 text-blue-700';
    return 'bg-orange-100 text-orange-700';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
    <div className="flex-1 bg-slate-100 overflow-y-auto">
        <div className="max-w-md lg:max-w-5xl mx-auto px-4 lg:px-8 pt-6 pb-28 lg:pb-8 space-y-4">
          <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const meds = data?.medications || [];
  const todaySchedule = data?.todaySchedule || [];
  const missedDoses = data?.missedDoses || [];
  const refillSoon = data?.refillSoon || [];
  const hasAiData = recommendations && meds.length === 0;

  const severityColor = (s) => {
    const v = Number(s.severity || 0);
    if (v >= 7) return 'bg-red-100 text-red-700';
    if (v >= 4) return 'bg-orange-100 text-orange-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div className="flex-1 bg-slate-100">
      <div className="max-w-md lg:max-w-5xl mx-auto px-4 lg:px-8 pt-6 pb-28 lg:pb-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchOverview} className="text-red-600 font-medium hover:text-red-700 text-xs cursor-pointer">Retry</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-1.5 text-slate-500 hover:text-slate-700 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-slate-900">Medications</h1>
          </div>
          <button
            onClick={() => navigate('/my-profile')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl px-3.5 py-2 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Med
          </button>
        </div>

        {/* AI Recommendations */}
        {!hasAiData && recommendations && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 lg:p-5 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-blue-900 text-sm">AI Recommendations</h3>
                <p className="text-sm text-blue-800 mt-1.5 whitespace-pre-line leading-relaxed">{recommendations}</p>
              </div>
            </div>
          </div>
        )}

        {hasAiData ? (
          <>
            {/* Symptoms + Assessment grid */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-4 mb-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 lg:mb-0">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Symptoms Reported</h3>
                </div>
                {latestChat?.symptoms?.length > 0 ? (
                  <div className="space-y-3">
                    {latestChat.symptoms.map((s, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{s.name}</p>
                          {s.duration && <p className="text-xs text-slate-500">{s.duration}</p>}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityColor(s)}`}>{s.severity}/10</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No symptoms recorded in your latest consultation</p>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Assessment</h3>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-500">Severity:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    latestChat?.severity === 'high' ? 'bg-red-100 text-red-700' : latestChat?.severity === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {(latestChat?.severity || 'N/A').charAt(0).toUpperCase() + (latestChat?.severity || 'N/A').slice(1)}
                  </span>
                </div>
                {latestChat?.aiSummary ? (
                  <p className="text-sm text-slate-700 leading-relaxed">{latestChat.aiSummary}</p>
                ) : (
                  <p className="text-sm text-slate-400">No assessment summary available</p>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-4">
              <div className="p-5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Next Steps</h2>
                </div>
              </div>
              <div className="px-5 pb-5">
                <div className="space-y-2">
                  {recommendations.split('\n').filter(r => r.trim()).map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-blue-600">{i + 1}</span>
                      </div>
                      <p className="text-sm text-slate-700 pt-0.5">{rec.replace(/^\d+\.\s*/, '')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 mb-4">Track your progress by adding medications</p>
              <button
                onClick={() => navigate('/my-profile')}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors cursor-pointer"
              >
                Add Medications
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 2-column grid on desktop */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-4 mb-4">
              {/* Adherence Summary Card */}
              <div className="bg-green-600 rounded-2xl p-5 text-white mb-4 lg:mb-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">7-Day Adherence</span>
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">{data?.adherence7Day || 0}%</div>
                <p className="text-sm text-green-100">
                  {data?.adherence7Day >= 90 ? 'Great job! ' : data?.adherence7Day >= 70 ? 'Keep it up! ' : ''}
                  You've taken {data?.totalActual7 || 0} of {data?.totalExpected7 || 0} scheduled doses
                </p>
              </div>

              {/* Refill Alert Card */}
              {refillSoon.length > 0 ? (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">Refill Needed Soon</p>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {refillSoon[0].name} {refillSoon[0].dosage}
                      </p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        {refillSoon[0].daysUntil > 0
                          ? `Runs out in ${refillSoon[0].daysUntil} days`
                          : refillSoon[0].daysUntil === 0
                            ? 'Runs out today'
                            : `Overdue by ${Math.abs(refillSoon[0].daysUntil)} days`}
                        {refillSoon[0].refillDate ? ` · ${formatDate(refillSoon[0].refillDate)}` : ''}
                      </p>
                      <button className="mt-3 px-4 py-1.5 bg-white border border-orange-300 text-orange-700 text-xs font-medium rounded-full hover:bg-orange-50 transition-colors cursor-pointer">
                        Request Refill
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600">All medications have sufficient refill supply</p>
                </div>
              )}
            </div>

            {/* Today's Schedule */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-4">
              <div className="p-5 pb-3">
                <h2 className="text-base font-bold text-slate-900">Today's Schedule</h2>
              </div>
              {todaySchedule.length === 0 ? (
                <div className="p-5 text-center text-sm text-slate-400">
                  No medications scheduled for today
                </div>
              ) : (
                <div className="px-5 pb-4">
                  {todaySchedule.map((slot, si) => {
                    const status = getScheduleStatus(slot.time);
                    const allTaken = slot.medications.every((m) => m.taken);

                    return (
                      <div key={slot.time} className="relative flex gap-4 pb-6 last:pb-0">
                        {si < todaySchedule.length - 1 && (
                          <div className={`absolute left-[13px] top-8 bottom-0 w-0.5 ${
                            status === 'future' ? 'bg-slate-200' : 'bg-green-200'
                          }`} />
                        )}

                        <div className={`relative shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                          allTaken ? 'bg-green-500' : status === 'future' ? 'bg-slate-200' : 'bg-blue-500'
                        }`}>
                          {allTaken ? (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <div className={`w-2.5 h-2.5 rounded-full ${
                              status === 'future' ? 'bg-slate-400' : 'bg-white'
                            }`} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-semibold ${
                              allTaken ? 'text-green-600' : 'text-slate-900'
                            }`}>{slot.time}</span>
                            {allTaken && slot.medications[0].takenAt && (
                              <span className="text-xs text-green-600">
                                Taken at {new Date(slot.medications[0].takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            {!allTaken && status === 'future' && (
                              <span className="text-xs text-slate-400">Coming up next</span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {slot.medications.map((med) => (
                              <div key={med.name} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{med.name}</p>
                                  {med.dosage && <p className="text-xs text-slate-500">{med.dosage}</p>}
                                </div>
                                {!med.taken && (
                                  <button
                                    onClick={() => handleMarkTaken(med.name)}
                                    disabled={logging === med.name}
                                    className="px-3.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-xl hover:bg-blue-100 disabled:opacity-50 transition-colors cursor-pointer"
                                  >
                                    {logging === med.name ? '...' : 'Mark Taken'}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* All Medications + Recent Missed Doses — side by side on desktop */}
            <div className="lg:grid lg:grid-cols-3 lg:gap-4">
              <div className="lg:col-span-2 space-y-3 mb-4 lg:mb-0">
                <h2 className="text-base font-bold text-slate-900 px-1">All Medications</h2>
                {meds.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                    <p className="text-sm text-slate-400 mb-3">No medications added yet</p>
                    <button
                      onClick={() => navigate('/my-profile')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      Add your first medication &rarr;
                    </button>
                  </div>
                ) : (
                  meds.map((med) => (
                    <div key={med.name} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 hover:border-slate-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-bold text-slate-900">{med.name}</h3>
                            {med.dosage && <span className="text-sm text-slate-500">{med.dosage}</span>}
                          </div>
                          {med.purpose && <p className="text-xs text-slate-500">{med.purpose}</p>}
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${getAdherenceBadgeClass(med.badge)}`}>
                          {med.adherence7}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 mb-3">
                        <div>
                          <span className="text-slate-400">Schedule: </span>
                          {med.schedule.join(', ')}
                        </div>
                        {med.refillDate && (
                          <div>
                            <span className="text-slate-400">Refill: </span>
                            {formatDate(med.refillDate)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => navigate('/my-profile')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        Edit &rarr;
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900 px-1 mb-3">Recent Missed Doses</h2>
                {missedDoses.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-500">No missed doses this week</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100">
                    {missedDoses.slice(0, 4).map((m, i) => (
                      <div key={i} className="flex items-start gap-3 p-4">
                        <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{m.medicationName} {m.dosage}</p>
                          <p className="text-xs text-slate-500">
                            {m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                            {' · '}Missed {m.expected - m.taken} of {m.expected} doses
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
