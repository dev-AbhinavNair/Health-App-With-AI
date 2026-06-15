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
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
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

function NA({ text = 'N/A' }) {
  return <span className="text-slate-300 italic">{text}</span>;
}

export default function DoctorPatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/doctors/patients');
        setPatients(res.data);
      } catch (err) {
        console.error('Failed to load patients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      (p.medicalConditions || []).some((c) => c.toLowerCase().includes(search.toLowerCase())) ||
      (p.medications || []).some((m) => m.name?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus =
      statusFilter === 'All Statuses' || (statusLabels[p.lastChatStatus] || p.lastChatStatus) === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DoctorLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Patient List</h1>
          <p className="text-sm text-slate-500 mt-1">Review and manage patient cases</p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search patients by name, condition, or medication..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option>All Statuses</option>
            <option>Under Review</option>
            <option>Waiting</option>
            <option>Active</option>
          </select>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
              Loading patients...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
              {patients.length === 0 ? 'No patients assigned yet.' : 'No patients match your search criteria.'}
            </div>
          ) : (
            filtered.map((patient) => (
              <div
                key={patient._id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{patient.name || <NA />}</h3>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          statusStyles[patient.lastChatStatus] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {statusLabels[patient.lastChatStatus] || patient.lastChatStatus || <NA />}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-1">
                      {patient.age ? `${patient.age} years` : <NA />}
                      {patient.medicalConditions?.length > 0 && (
                        <> &middot; {patient.medicalConditions.join(', ')}</>
                      )}
                      {!patient.age && !patient.medicalConditions?.length && ' '}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {patient.medications?.length > 0 ? (
                        patient.medications.slice(0, 2).map((med) => (
                          <span
                            key={med.name}
                            className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md"
                          >
                            {med.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-300 italic">No medications listed</span>
                      )}
                      {patient.medications?.length > 2 && (
                        <span className="text-xs text-slate-400 font-medium">
                          +{patient.medications.length - 2} more
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/doctor/patients/${patient._id}`}
                      className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View patient details &rarr;
                    </Link>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {patient.lastActive ? formatTimeAgo(patient.lastActive) : <NA />}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
