import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DoctorLayout from '../components/DoctorLayout';
import api from '../api';

function NA({ text = 'N/A' }) {
  return <span className="text-slate-300 italic">{text}</span>;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DoctorArchivedCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/doctors/archived-cases')
      .then((res) => setCases(res.data))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, []);

  const totalArchived = cases.length;
  const forwardedCount = cases.filter((c) => c.isForwarded).length;
  const forwardedPct = totalArchived ? Math.round((forwardedCount / totalArchived) * 100) : 0;
  const avgDuration = cases.length
    ? Math.round(cases.reduce((sum, c) => sum + (c.durationDays || 0), 0) / cases.length)
    : 0;

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Archived Cases</h1>
            <p className="text-sm text-slate-500">Review completed and resolved patient cases</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 font-medium">Total Archived</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '—' : totalArchived}</p>
            <p className="text-xs text-slate-400 mt-1">All time</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 font-medium">Avg Resolution Time</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '—' : `${avgDuration} days`}</p>
            <p className="text-xs text-slate-400 mt-1">Median duration</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-green-600 font-medium">Forwarded to Patient</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '—' : `${forwardedPct}%`}</p>
            <p className="text-xs text-slate-400 mt-1">{forwardedCount} of {totalArchived} cases</p>
          </div>
        </div>

        {/* Archived Case List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">Loading archived cases...</div>
        ) : cases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">No archived cases yet.</div>
        ) : (
          <div className="space-y-4">
            {cases.map((c) => (
              <Link
                key={c._id}
                to={`/doctor/patients/${c.patient?._id}`}
                className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm shrink-0">
                      {c.patient?.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'N/A'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {c.patient?.name || <NA />}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.patient?.age ? `${c.patient.age} yrs` : ''}
                        {c.patient?.age && c.patient?.medicalConditions?.length ? ' · ' : ''}
                        {c.patient?.medicalConditions?.length
                          ? c.patient.medicalConditions.slice(0, 2).join(', ')
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      Resolved
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Resolved</p>
                      <p className="text-sm font-medium text-slate-700">{formatDate(c.resolvedAt) || <NA />}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <p className="text-sm text-slate-700 font-medium">
                    {c.title || <NA />}
                  </p>
                  {c.symptoms?.length > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      Math.max(...c.symptoms.map(s => Number(s.severity || 0))) >= 7
                        ? 'bg-red-100 text-red-700'
                        : Math.max(...c.symptoms.map(s => Number(s.severity || 0))) >= 4
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {(Math.max(...c.symptoms.map(s => Number(s.severity || 0))) >= 7 ? 'High' : Math.max(...c.symptoms.map(s => Number(s.severity || 0))) >= 4 ? 'Moderate' : 'Mild')}
                    </span>
                  )}
                </div>

                {c.symptoms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {c.symptoms.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-600">
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {c.durationDays || 0} days
                  </div>
                  {c.aiSummary && (
                    <span className="text-slate-400 truncate max-w-[200px]">{c.aiSummary}</span>
                  )}
                  {c.aiRecommendations && (
                    <span className="text-blue-600 font-medium">
                      {(c.aiRecommendations.match(/\d+\.\s/g) || []).length} recommendations
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
