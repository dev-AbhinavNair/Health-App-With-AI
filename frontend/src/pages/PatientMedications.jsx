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

  useEffect(() => {
    fetchOverview();
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
      <div className="flex-1 bg-slate-100">
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
                const anyTaken = slot.medications.some((m) => m.taken);

                return (
                  <div key={slot.time} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Timeline line */}
                    {si < todaySchedule.length - 1 && (
                      <div className={`absolute left-[13px] top-8 bottom-0 w-0.5 ${
                        status === 'future' ? 'bg-slate-200' : 'bg-green-200'
                      }`} />
                    )}

                    {/* Status dot */}
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

                    {/* Content */}
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
                              {med.dosage && (
                                <p className="text-xs text-slate-500">{med.dosage}</p>
                              )}
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
          {/* All Medications */}
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
                        {med.dosage && (
                          <span className="text-sm text-slate-500">{med.dosage}</span>
                        )}
                      </div>
                      {med.purpose && (
                        <p className="text-xs text-slate-500">{med.purpose}</p>
                      )}
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

          {/* Recent Missed Doses */}
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
      </div>
    </div>
  );
}
