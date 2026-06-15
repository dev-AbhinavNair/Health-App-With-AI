import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DoctorLayout from '../components/DoctorLayout';
import api from '../api';

function formatTimeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const severityStyles = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
};

const severityLabels = {
  critical: 'Critical',
  high: 'High Severity',
};

export default function DoctorUrgentCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/doctors/urgent-cases')
      .then((res) => setCases(res.data))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, []);

  const totalUrgent = cases.length;
  const highCount = cases.filter((c) => c.severity === 'high').length;
  const criticalCount = cases.filter((c) => c.severity === 'critical').length;

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Urgent Cases</h1>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 font-medium">Total Urgent</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '—' : totalUrgent}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-orange-600 font-medium">High Severity</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '—' : highCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm text-red-600 font-medium">Critical</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '—' : criticalCount}</p>
          </div>
        </div>

        {/* Cases List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">Loading urgent cases...</div>
        ) : cases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">No urgent cases at this time.</div>
        ) : (
          <div className="space-y-4">
            {cases.map((c) => (
              <div
                key={c._id}
                className="bg-white rounded-2xl border-2 border-red-200 p-5 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-sm shrink-0">
                      {c.patient?.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'N/A'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {c.patient?.name || <span className="text-slate-400 italic">N/A</span>}
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
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${severityStyles[c.severity] || 'bg-slate-100 text-slate-600'}`}>
                    {severityLabels[c.severity] || c.severity}
                  </span>
                </div>

                {/* AI Summary */}
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Case Summary</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {c.aiSummary || <span className="text-slate-400 italic">N/A</span>}
                  </p>
                </div>

                {/* Symptoms */}
                {c.symptoms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.symptoms.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-600">
                        {s.name}
                        {s.severity && (
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            s.severity === 'severe' ? 'bg-red-500' :
                            s.severity === 'moderate' ? 'bg-orange-400' :
                            'bg-yellow-400'
                          }`} />
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action */}
                <div className="pt-1">
                  <Link
                    to={`/doctor/patients/${c.patient?._id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Review urgent case
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
