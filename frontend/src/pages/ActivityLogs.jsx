import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/Sidebar';

const severityStyles = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-red-200 text-red-800'
};

const categories = ['All Categories', 'Doctor Management', 'AI Monitoring', 'Reports Management', 'User Management', 'System Updates'];
const severities = ['All Severities', 'info', 'warning', 'high', 'critical'];

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [severity, setSeverity] = useState('All Severities');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.category && params.category !== 'All Categories') query.set('category', params.category);
      if (params.severity && params.severity !== 'All Severities') query.set('severity', params.severity);
      if (params.fromDate) query.set('fromDate', params.fromDate);
      if (params.toDate) query.set('toDate', params.toDate);

      const res = await api.get(`/admin/activity-logs?${query.toString()}`);
      setLogs(res.data);
      setSelected(null);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      }
      setError('Failed to load activity logs');
    }
  };

  const handleFilter = () => {
    fetchLogs({ search, category, severity, fromDate, toDate });
  };

  const handleExport = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (category !== 'All Categories') query.set('category', category);
      if (severity !== 'All Severities') query.set('severity', severity);
      if (fromDate) query.set('fromDate', fromDate);
      if (toDate) query.set('toDate', toDate);

      const res = await api.get(`/admin/activity-logs/export?${query.toString()}`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export logs');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 ml-[260px] p-8 overflow-y-auto">
        <header className="mb-6">
          <h2 className="text-4xl font-bold text-slate-900">Audit & Activity Logs</h2>
          <p className="text-slate-500 mt-2 text-sm">Complete system activity history for accountability and tracing</p>
        </header>

        {error && <div className="mb-6 p-4 text-red-600 bg-red-50 border border-red-100 rounded-xl">{error}</div>}

        {/* Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                type="text"
                placeholder="Search logs by action, actor, or target..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {severities.map((s) => (
                <option key={s} value={s}>{s === 'All Severities' ? s : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>

            <button
              onClick={handleFilter}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Filter
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Export
            </button>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="pl-4 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-slate-400 text-sm font-medium">to</span>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="pl-4 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Two column layout */}
        <div className="flex gap-6">
          {/* Left: Activity Log List */}
          <div className="flex-[2] bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-lg font-semibold text-slate-900">Activity Log ({logs.length} entries)</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {logs.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-400">No activity logs found.</div>
              )}
              {logs.map((log) => (
                <div
                  key={log._id}
                  onClick={() => setSelected(log)}
                  className={`p-6 cursor-pointer transition-colors ${
                    selected?._id === log._id
                      ? 'bg-blue-50/70 border-l-4 border-blue-600'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${severityStyles[log.severity] || severityStyles.info}`}>
                        {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                      </span>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{log.category}</span>
                    <span className="text-xs text-slate-400">{log.actor?.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{log.target?.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Log Details */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 h-fit sticky top-8">
            {!selected ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                <p className="text-sm text-slate-400">Select a log entry to view details</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Log Details</h3>

                {/* Action */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Action</p>
                  <p className="text-sm font-semibold text-slate-900">{selected.action}</p>
                </div>

                {/* Timestamp */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Timestamp</p>
                  <p className="text-sm text-slate-900">{new Date(selected.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                </div>

                {/* Actor */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Actor</p>
                  <p className="text-sm text-slate-900">{selected.actor?.name}</p>
                  <p className="text-xs text-slate-400">{selected.actor?.id}</p>
                </div>

                {/* IP Address */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">IP Address</p>
                  <p className="text-sm text-slate-900">{selected.ipAddress}</p>
                </div>

                {/* Target */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Target</p>
                  <p className="text-sm text-slate-900">{selected.target?.name}</p>
                  <p className="text-xs text-slate-400">{selected.target?.id}</p>
                </div>

                {/* Category & Severity */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Category</p>
                    <p className="text-sm text-slate-900">{selected.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Severity</p>
                    <p className={`text-sm font-semibold ${severityStyles[selected.severity]?.split(' ')[1] || 'text-slate-700'}`}>
                      {selected.severity.charAt(0).toUpperCase() + selected.severity.slice(1)}
                    </p>
                  </div>
                </div>

                {/* Additional Details */}
                {selected.details && Object.keys(selected.details).length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Additional Details</p>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      {Object.entries(selected.details).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-xs font-medium text-slate-500">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</p>
                          <p className="text-sm text-slate-900">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Entry */}
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `log-entry-${selected._id}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-300 bg-white text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Export Entry
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
