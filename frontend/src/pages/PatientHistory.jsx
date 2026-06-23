import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const tabs = [
  { label: 'All', value: 'all', activeColor: 'bg-blue-600 text-white', inactiveColor: 'bg-slate-100 text-slate-700' },
  { label: 'Symptoms', value: 'symptom_log', activeColor: 'bg-purple-600 text-white', inactiveColor: 'bg-slate-100 text-slate-700' },
  { label: 'Medications', value: 'medication_event', activeColor: 'bg-green-600 text-white', inactiveColor: 'bg-slate-100 text-slate-700' },
  { label: 'Doctor Summaries', value: 'doctor_summary', activeColor: 'bg-blue-600 text-white', inactiveColor: 'bg-slate-100 text-slate-700' },
];

const categoryIconMap = {
  symptom_log: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  ),
  medication_event: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  doctor_summary: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
};

const categoryBgMap = {
  symptom_log: 'bg-purple-100 text-purple-700',
  medication_event: 'bg-green-100 text-green-700',
  doctor_summary: 'bg-blue-100 text-blue-700',
};

const severityBadgeMap = {
  mild: 'bg-green-100 text-green-700',
  moderate: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-red-100 text-red-700',
};

export default function PatientHistory() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [error, setError] = useState('');
  const [detailEntry, setDetailEntry] = useState(null);

  const fetchHistory = useCallback(async (tab, query) => {
    try {
      setError('');
      setLoading(true);
      const params = { category: tab };
      if (query.trim()) params.search = query.trim();
      const res = await api.get('/history', { params });
      setEntries(res.data.entries);
      setTotal(res.data.total);
    } catch {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(activeTab, search);
  }, [activeTab, fetchHistory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    fetchHistory(activeTab, searchInput);
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchInput('');
    setSearch('');
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatDateShort = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isSummaryEmpty = activeTab === 'doctor_summary' && entries.length === 0;

  return (
    <div className="flex-1 w-full bg-slate-50 overflow-x-hidden overflow-y-auto">
      <div className="w-full lg:max-w-4xl mx-auto px-4 lg:px-8 pt-6 pb-28 lg:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-1.5 text-slate-500 hover:text-slate-700 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Health History</h1>
              <p className="text-xs text-slate-500">All logs and summaries</p>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search your health history..."
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </form>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto max-w-full pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = tab.value === activeTab;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`shrink-0 text-sm font-medium px-4 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  isActive ? tab.activeColor : tab.inactiveColor
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Timeline Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-0.5 bg-slate-200" />
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isSummaryEmpty ? (
          /* Doctor Summaries always shows empty state when no data */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No results found</h3>
            <p className="text-sm text-slate-500">No history items in this category</p>
          </div>
        ) : entries.length === 0 ? (
          /* Generic empty state */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No results found</h3>
            <p className="text-sm text-slate-500">No matching records</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-full">
              {entries.map((entry, idx) => {
                const isLast = idx === entries.length - 1;
                const icon = categoryIconMap[entry.type] || categoryIconMap.symptom_log;
                const iconBg = categoryBgMap[entry.type] || 'bg-slate-100 text-slate-500';
                const severityClass = entry.severity ? severityBadgeMap[entry.severity] : null;

                return (
                  <div key={entry.id || idx} className="relative flex gap-4">
                    {/* Connector line (hidden on last entry) */}
                    {!isLast && (
                      <div className="absolute left-[19px] top-[42px] bottom-[-16px] w-0.5 bg-slate-200 rounded-full" />
                    )}
                    {/* Timeline dot + icon */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                        {icon}
                      </div>
                    </div>

                    {/* Card */}
                    <div
                      onClick={() => setDetailEntry(entry)}
                      className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 hover:border-slate-300 transition-colors cursor-pointer min-w-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h3 className="text-sm font-semibold text-slate-900 leading-tight break-words">
                              {entry.title}
                            </h3>
                            {entry.statusBadge && (
                              <span className="text-[11px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
                                {entry.statusBadge.label}
                              </span>
                            )}
                            {severityClass && (
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${severityClass}`}>
                                {entry.severity}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mb-1.5 break-words">
                            {formatTimestamp(entry.timestamp)}
                            {entry.medicationName && ` · ${entry.medicationName} ${entry.dosage || ''}`}
                          </p>
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 break-words">
            {entry.preview || entry.messageContent || (entry.symptoms?.length ? entry.symptoms.map(s => s.name).join(', ') : '')}
          </p>
                          {entry.eventType === 'missed_dose' && (
                            <p className="text-xs text-orange-600 mt-1">Scheduled dose not taken</p>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-slate-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        )}

        {/* Summary count */}
        {!loading && entries.length > 0 && (
          <p className="text-xs text-slate-400 text-center mt-6">
            {total} {total === 1 ? 'entry' : 'entries'}
          </p>
        )}
      </div>

      {/* Detail Modal */}
      {detailEntry && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setDetailEntry(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 break-words"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${categoryBgMap[detailEntry.type] || 'bg-slate-100'}`}>
                  {categoryIconMap[detailEntry.type] || categoryIconMap.symptom_log}
                </div>
                <h2 className="text-base font-bold text-slate-900">{detailEntry.title}</h2>
              </div>
              <button
                onClick={() => setDetailEntry(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">{formatTimestamp(detailEntry.timestamp)}</p>

            {detailEntry.type === 'doctor_summary' && (
              <div className="space-y-4">
                {detailEntry.doctorName && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-800">
                    Reviewed by <span className="font-semibold">Dr. {detailEntry.doctorName}</span>
                    {detailEntry.doctorSpecialty && <span> ({detailEntry.doctorSpecialty})</span>}
                  </div>
                )}
                {detailEntry.summary && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Summary</p>
                    <p className="text-sm text-slate-800 leading-relaxed break-words">{detailEntry.summary}</p>
                  </div>
                )}
                {detailEntry.recommendations && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Recommendations</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words">{detailEntry.recommendations}</p>
                  </div>
                )}
                {detailEntry.doctorNotes && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Doctor Notes</p>
                    <p className="text-sm text-slate-700 leading-relaxed break-words">{detailEntry.doctorNotes}</p>
                  </div>
                )}
                {detailEntry.symptoms && detailEntry.symptoms.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Symptoms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailEntry.symptoms.map((s, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                          {s.name} {s.severity ? `(${s.severity})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {detailEntry.severity && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Severity</p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${severityBadgeMap[detailEntry.severity] || 'bg-slate-100 text-slate-600'}`}>
                      {detailEntry.severity}
                    </span>
                  </div>
                )}
              </div>
            )}

            {detailEntry.type === 'symptom_log' && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Patient Report</p>
                <p className="text-sm text-slate-800 leading-relaxed break-words">{detailEntry.messageContent || detailEntry.preview}</p>
                {detailEntry.severity && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Severity</p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${severityBadgeMap[detailEntry.severity] || 'bg-slate-100 text-slate-600'}`}>
                      {detailEntry.severity}
                    </span>
                  </div>
                )}
              </div>
            )}

            {detailEntry.type === 'medication_event' && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Medication</p>
                <p className="text-sm font-medium text-slate-900 mb-3 break-words">
                  {detailEntry.medicationName} {detailEntry.dosage}
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm text-orange-800 break-words">Missed dose on {formatDateShort(detailEntry.timestamp)}</p>
                  </div>
                </div>
              </div>
            )}

            {detailEntry.type === 'doctor_summary' && detailEntry.chatId && (
              <button
                onClick={() => { setDetailEntry(null); }}
                className="mt-5 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                &larr; Back to history
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
