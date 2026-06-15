import { useState, useEffect } from 'react';
import DoctorLayout from '../components/DoctorLayout';
import api from '../api';

export default function DoctorMedicationHistory() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/doctors/medication-history');
        setPatients(res.data);
      } catch (err) {
        console.error('Failed to fetch medication history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const withAdherence = patients.filter((p) => p.adherence !== null);
  const avgAdherence = withAdherence.length
    ? Math.round(withAdherence.reduce((s, p) => s + p.adherence, 0) / withAdherence.length)
    : null;
  const good = withAdherence.filter((p) => p.adherence >= 75).length;
  const needsAttention = withAdherence.filter((p) => p.adherence >= 50 && p.adherence < 75).length;
  const poor = withAdherence.filter((p) => p.adherence < 50).length;

  const adherenceColor = (val) => {
    if (val === null) return 'bg-slate-200';
    if (val >= 75) return 'bg-green-500';
    if (val >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const statusBadge = (val) => {
    if (val === null) return <span className="text-xs text-slate-400 italic">N/A</span>;
    if (val >= 75) return <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Good</span>;
    if (val >= 50) return <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Needs Attention</span>;
    return <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Poor</span>;
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400">Loading medication history...</p>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Medication History</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500 mb-1">Avg Adherence</p>
            <p className="text-3xl font-bold text-slate-900">{avgAdherence !== null ? `${avgAdherence}%` : <span className="text-slate-400 italic text-lg">N/A</span>}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500 mb-1">Good (&ge;75%)</p>
            <p className="text-3xl font-bold text-green-600">{good}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500 mb-1">Needs Attention</p>
            <p className="text-3xl font-bold text-yellow-600">{needsAttention}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm text-slate-500 mb-1">Poor (&lt;50%)</p>
            <p className="text-3xl font-bold text-red-600">{poor}</p>
          </div>
        </div>

        {/* Medication adherence table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Patient Adherence Breakdown</h2>
          </div>
          {patients.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-400 italic">No patients with medication data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Medications</th>
                    <th className="px-6 py-3">Adherence</th>
                    <th className="px-6 py-3">Logged / Expected</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {patients.map((p) => (
                    <tr key={p.patient._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{p.patient.name}</p>
                        <p className="text-xs text-slate-400">{p.patient.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        {p.patient.medications.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.patient.medications.map((m) => (
                              <span key={m.name} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                {m.name} {m.dosage ? `(${m.dosage})` : ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {p.adherence !== null ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${adherenceColor(p.adherence)}`}
                                style={{ width: `${Math.min(p.adherence, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600">{p.adherence}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {p.adherence !== null ? `${p.loggedDoses} / ${p.totalDoses}` : '-'}
                      </td>
                      <td className="px-6 py-4">{statusBadge(p.adherence)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
