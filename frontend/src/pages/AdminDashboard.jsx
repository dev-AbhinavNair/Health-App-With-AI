import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const severityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

const severityLabels = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-blue-600',
};

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [pendingApps, setPendingApps] = useState([]);
  const [reports, setReports] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, doctorsRes, appsRes, reportsRes, activityRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/users?role=doctor'),
          api.get('/admin/doctor-applications'),
          api.get('/admin/reports'),
          api.get('/admin/activity-logs?limit=5'),
        ]);
        setUsers(usersRes.data);
        setDoctors(doctorsRes.data);
        setPendingApps(appsRes.data.filter((a) => a.status === 'pending'));
        setReports(reportsRes.data);
        setRecentActivity(activityRes.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
        if (err.response?.status === 401) handleLogout();
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const urgentReports = reports.filter((r) => r.severity === 'high' || r.severity === 'critical');

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 ml-[260px] p-8 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-4xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-500 mt-2 text-sm">System health and key metrics at a glance</p>
        </header>

        {error && <div className="mb-6 p-4 text-red-600 bg-red-50 border border-red-100 rounded-xl">{error}</div>}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 w-fit">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <div className="mt-4">
              <h3 className="text-4xl font-bold text-slate-900">{loading ? '—' : users.length}</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Active Users</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="p-3 bg-green-50 rounded-xl text-green-600 w-fit">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <div className="mt-4">
              <h3 className="text-4xl font-bold text-slate-900">{loading ? '—' : doctors.length}</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Active Doctors</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600 w-fit">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div className="mt-4">
              <h3 className="text-4xl font-bold text-slate-900">{loading ? '—' : pendingApps.length}</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Pending Applications</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="p-3 bg-red-50 rounded-xl text-red-600 w-fit">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <div className="mt-4">
              <h3 className="text-4xl font-bold text-slate-900">{loading ? '—' : urgentReports.length}</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Urgent Alerts</p>
            </div>
          </div>
        </div>

        {/* Bottom Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports / Urgent Alerts */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Recent Reports</h3>
            {loading ? (
              <div className="text-sm text-slate-400 py-4">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="text-sm text-slate-400 italic py-4">No reports yet.</div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {reports.slice(0, 5).map((r) => (
                  <div key={r._id} className="py-4 flex justify-between items-start -mx-6 px-6">
                    <div className="flex gap-3 items-start">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${severityColors[r.severity] || 'bg-slate-400'}`}></span>
                      <div>
                        <p className={`text-sm font-bold ${severityLabels[r.severity] || 'text-slate-600'}`}>
                          {r.type ? r.type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Report'}
                        </p>
                        <p className="text-sm text-slate-900 mt-1">{r.title}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {r.reporter?.name || 'Unknown'} &bull; {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.status === 'open' ? 'bg-yellow-100 text-yellow-700' :
                      r.status === 'under-review' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Recent Activity</h3>
            {loading ? (
              <div className="text-sm text-slate-400 py-4">Loading...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-sm text-slate-400 italic py-4">No recent activity.</div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {recentActivity.map((log) => (
                  <div key={log._id} className="py-4 -mx-6 px-6">
                    <div className="flex items-start gap-3">
                      <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        log.severity === 'high' || log.severity === 'critical' ? 'bg-red-500' :
                        log.severity === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {log.actor?.name || 'System'} &bull; {log.category}
                        </p>
                        {log.target?.name && (
                          <p className="text-xs text-slate-400 mt-0.5">{log.target.name}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
