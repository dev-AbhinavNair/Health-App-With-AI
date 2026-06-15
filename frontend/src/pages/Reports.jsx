import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [selectedRep, setSelectedRep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/reports');
        setReports(res.data);
        if (res.data.length > 0) setSelectedRep(res.data[0]);
      } catch (err) {
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleResolve = async (id) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/admin/reports/${id}`, { status: 'resolved' });
      setReports(prev => prev.map(r => r._id === id ? res.data : r));
      if (selectedRep?._id === id) setSelectedRep(res.data);
    } catch (err) {
      setError('Failed to resolve report');
    } finally {
      setActionLoading(false);
    }
  };

  const selected = selectedRep;

  const severityColors = {
    'critical': 'bg-red-100 text-red-700',
    'high': 'bg-orange-100 text-orange-700',
    'medium': 'bg-yellow-100 text-yellow-700',
    'low': 'bg-blue-100 text-blue-700',
  };

  const statusColors = {
    'open': 'bg-red-100 text-red-700',
    'under-review': 'bg-yellow-100 text-yellow-700',
    'resolved': 'bg-green-100 text-green-700',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-slate-100 font-sans">
        <Sidebar />
        <main className="flex-1 ml-[260px] p-8 overflow-y-auto flex items-center justify-center">
          <p className="text-slate-500">Loading reports...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 ml-[260px] p-8 overflow-y-auto">
        <header className="mb-6">
          <h2 className="text-4xl font-bold text-slate-900">Reports & Complaints</h2>
          <p className="text-slate-500 mt-2 text-sm">Review and manage system reports and user complaints</p>
        </header>

        {error && <div className="mb-6 p-4 text-red-600 bg-red-50 border border-red-100 rounded-xl">{error}</div>}

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT PANEL */}
          <div className="col-span-5 flex flex-col">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900">Reports ({reports.length})</h3>
              </div>
              <div className="flex flex-col">
                {reports.map((rep) => (
                  <div key={rep._id} onClick={() => setSelectedRep(rep)} className={`p-4 border-b border-slate-200 cursor-pointer flex justify-between items-start transition-colors ${selectedRep?._id === rep._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}>
                    <div className="w-full">
                      <div className="flex justify-between items-center w-full mb-1">
                        <span className="font-bold text-slate-900 text-sm">#{rep._id.slice(-6)}</span>
                        <span className="text-xs text-slate-400">{new Date(rep.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mb-2 truncate">{rep.title}</p>
                      <p className="text-xs text-slate-500 mb-3">{rep.type.replace('-', ' ')} &bull; {rep.relatedEntity || 'N/A'}</p>
                      <div className="flex gap-2">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${severityColors[rep.severity] || 'bg-slate-100 text-slate-600'}`}>{rep.severity}</span>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${statusColors[rep.status] || 'bg-slate-100 text-slate-600'}`}>{rep.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="col-span-7">
            {selected ? (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-6">
                <div>
                  <div className="flex gap-2 mb-3">
                    <span className={`text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded ${severityColors[selected.severity]}`}>{selected.severity} Severity</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{selected.title}</h2>
                  <p className="text-sm text-slate-500 mt-2 font-medium">
                    Reported by {selected.reporter?.name || 'Unknown'} &bull; Related to: <span className="text-slate-800">{selected.relatedEntity || 'N/A'}</span>
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Status</h3>
                  <span className={`inline-block text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded ${statusColors[selected.status]}`}>{selected.status}</span>
                  {selected.resolvedBy && (
                    <p className="text-sm text-slate-500 mt-2">Resolved by: {selected.resolvedBy?.name || 'Admin'}</p>
                  )}
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  {selected.status !== 'resolved' ? (
                    <button
                      onClick={() => handleResolve(selected._id)}
                      disabled={actionLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-colors"
                    >{actionLoading ? 'Processing...' : 'Mark as Resolved'}</button>
                  ) : (
                    <div className="flex-1 text-center py-3 bg-slate-50 rounded-xl text-slate-500 font-medium">
                      Report Resolved
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-center justify-center h-64">
                <p className="text-slate-400">No reports found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
