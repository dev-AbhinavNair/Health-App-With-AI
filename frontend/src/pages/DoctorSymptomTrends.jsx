import { useState, useEffect } from 'react';
import DoctorLayout from '../components/DoctorLayout';
import api from '../api';
import {
  ResponsiveContainer,
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar,
} from 'recharts';

function NA({ text = 'N/A' }) {
  return <span className="text-slate-300 italic">{text}</span>;
}

export default function DoctorSymptomTrends() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/doctors/symptom-trends')
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const mostCommon = data?.mostCommon;
  const trendingUp = data?.trendingUp;
  const trendingDown = data?.trendingDown;
  const totalReports = data?.totalReports ?? null;
  const dailyReports = data?.dailyReports || [];
  const symptomFrequency = data?.symptomFrequency || [];

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Symptom Trends</h1>
            <p className="text-sm text-slate-500">Analyze patient symptom patterns over time</p>
          </div>
        </div>

        {/* Summary Analytics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 font-medium">Most Common</p>
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '—' : mostCommon?.name || <NA />}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {mostCommon ? `${mostCommon.count} reports this month` : 'No data'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 font-medium">Trending Up</p>
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '—' : trendingUp?.name || <NA text="None" />}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {trendingUp ? `+${trendingUp.change}% vs last month` : 'Stable'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 font-medium">Trending Down</p>
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '—' : trendingDown?.name || <NA text="None" />}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {trendingDown ? `-${trendingDown.change}% vs last month` : 'Stable'}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 font-medium">Total Reports</p>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '—' : totalReports !== null ? totalReports : <NA />}
            </p>
            <p className="text-xs text-slate-400 mt-1">This month</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          {/* Symptom Reports Over Time */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Symptom Reports Over Time</h2>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-sm text-slate-400">Loading...</div>
            ) : dailyReports.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-slate-300 italic">No symptom data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dailyReports}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {/* Alert */}
            {trendingUp && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-2.5">
                <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-yellow-800">Alert: Rising symptom detected</p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    "{trendingUp.name}" is up {trendingUp.change}% compared to last month. Consider proactive screening.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Symptom Frequency */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Symptom Frequency (Last 30 Days)</h2>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-sm text-slate-400">Loading...</div>
            ) : symptomFrequency.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-slate-300 italic">No symptom data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={symptomFrequency} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(value) => [value, 'Reports']}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
