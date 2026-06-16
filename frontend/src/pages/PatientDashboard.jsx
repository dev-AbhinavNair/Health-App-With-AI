import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function getDoseTimes(dailyDoses) {
  const slots = {
    1: ['8:00 AM'],
    2: ['8:00 AM', '8:00 PM'],
    3: ['8:00 AM', '2:00 PM', '8:00 PM'],
    4: ['8:00 AM', '12:00 PM', '4:00 PM', '8:00 PM'],
  };
  return slots[dailyDoses] || slots[1];
}

function getCurrentDoseIndex(times) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = times.length - 1; i >= 0; i--) {
    const [h, m, ap] = times[i].match(/(\d+):(\d+) (AM|PM)/).slice(1);
    let hour = parseInt(h);
    if (ap === 'PM' && hour !== 12) hour += 12;
    if (ap === 'AM' && hour === 12) hour = 0;
    const doseMinutes = hour * 60 + parseInt(m);
    if (currentMinutes >= doseMinutes) return i;
  }
  return -1;
}

function getTimeUntilNext(times) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < times.length; i++) {
    const [h, m, ap] = times[i].match(/(\d+):(\d+) (AM|PM)/).slice(1);
    let hour = parseInt(h);
    if (ap === 'PM' && hour !== 12) hour += 12;
    if (ap === 'AM' && hour === 12) hour = 0;
    const doseMinutes = hour * 60 + parseInt(m);
    if (currentMinutes < doseMinutes) {
      const diff = doseMinutes - currentMinutes;
      if (diff < 60) return `${diff} minutes`;
      return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    }
  }
  return null;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingDose, setLoggingDose] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await api.get('/medications/today');
      setMedications(res.data);
    } catch (err) {
      setError('Failed to load medication data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTaken = async (medicationName) => {
    setLoggingDose(medicationName);
    try {
      setError('');
      await api.post('/medications/log', { medicationName });
      await fetchTodayStatus();
    } catch (err) {
      setError('Failed to log dose');
    } finally {
      setLoggingDose(null);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const nextMed = medications.find((m) => !m.completed);
  const totalTaken = medications.reduce((s, m) => s + m.takenToday, 0);
  const totalDoses = medications.reduce((s, m) => s + m.dailyDoses, 0);

  return (
    <div className="flex-1 bg-slate-100">
      <div className="w-full max-w-md lg:max-w-5xl mx-auto px-4 lg:px-8 pt-6 lg:pt-8 pb-28 lg:pb-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchTodayStatus} className="text-red-600 font-medium hover:text-red-700 text-xs cursor-pointer">Retry</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{greeting}, {user?.name?.split(' ')[0] || 'there'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
          </div>
        </div>

        {/* Two-column grid on desktop */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-4 mb-4">
          {/* Next Medication Card */}
          {loading ? (
            <div className="bg-slate-200 rounded-2xl h-32 animate-pulse mb-4 lg:mb-0" />
          ) : nextMed ? (
            <div className="bg-blue-600 rounded-2xl p-5 text-white mb-4 lg:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium opacity-90">
                  {getTimeUntilNext(getDoseTimes(nextMed.dailyDoses))
                    ? `Next dose in ${getTimeUntilNext(getDoseTimes(nextMed.dailyDoses))}`
                    : 'All upcoming doses complete'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{nextMed.name} {nextMed.dosage}</p>
                  <p className="text-sm opacity-80 mt-0.5">
                    {getDoseTimes(nextMed.dailyDoses)[getCurrentDoseIndex(getDoseTimes(nextMed.dailyDoses)) + 1] || 'Next dose'}
                  </p>
                </div>
                <button
                  onClick={() => handleMarkTaken(nextMed.name)}
                  disabled={loggingDose === nextMed.name}
                  className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  {loggingDose === nextMed.name ? 'Logging...' : 'Mark Taken'}
                </button>
              </div>
            </div>
          ) : medications.length > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4 lg:mb-0">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold text-green-800">All doses completed for today</p>
              </div>
            </div>
          ) : null}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/user-chat')}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 text-left hover:border-slate-300 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-900">Log Symptoms</p>
              <p className="text-xs text-slate-500 mt-0.5">Quick check-in</p>
            </button>
            <button
              onClick={() => navigate('/my-profile')}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 text-left hover:border-slate-300 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-900">Medications</p>
              <p className="text-xs text-slate-500 mt-0.5">View schedule</p>
            </button>
          </div>
        </div>

        {/* Refill Alert */}
        {medications.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-800">Medication Refill Needed</p>
                <p className="text-sm text-yellow-700 mt-0.5">
                  {medications[0].name} may need a refill soon. Contact your pharmacy.
                </p>
                <button className="text-sm text-yellow-700 font-medium hover:text-yellow-800 mt-1.5 cursor-pointer">
                  Contact pharmacy &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Today's Medications */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-base font-bold text-slate-900">Today's Medications</h2>
            <span className="text-sm text-slate-500">
              {totalTaken} of {totalDoses} taken
            </span>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : medications.length === 0 ? (
            <div className="p-5 text-center">
              <p className="text-sm text-slate-400 mb-3">No medications added yet</p>
              <button
                onClick={() => navigate('/my-profile')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                Set up your medications &rarr;
              </button>
            </div>
          ) : (
            <div className="px-5 pb-2">
              {medications.map((med) => {
                const times = getDoseTimes(med.dailyDoses);
                const currentIdx = getCurrentDoseIndex(times);

                return (
                  <div key={med.name} className="border-b border-slate-100 last:border-0">
                    {times.map((time, idx) => {
                      const isTaken = idx < med.takenToday;
                      const isCurrent = idx === currentIdx + 1 && !isTaken;
                      const isPast = idx <= currentIdx;

                      return (
                        <div key={`${med.name}-${idx}`} className="flex items-center gap-3 py-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isTaken ? 'bg-green-50' : isCurrent ? 'bg-blue-50' : 'bg-slate-50'
                          }`}>
                            <svg className={`w-4.5 h-4.5 ${
                              isTaken ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-slate-400'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              {med.name} {med.dosage}
                            </p>
                            <p className="text-xs text-slate-500">{time}</p>
                          </div>
                          {isTaken ? (
                            <span className="text-xs font-medium text-green-600 flex items-center gap-1 shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              Taken
                            </span>
                          ) : isCurrent ? (
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full shrink-0">
                              Up Next
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
