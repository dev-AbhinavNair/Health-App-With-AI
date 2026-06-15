import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function UserManagement() {
  const [patients, setPatients] = useState([]);
  const [selectedPat, setSelectedPat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/users?role=user');
        setPatients(res.data);
        if (res.data.length > 0) setSelectedPat(res.data[0]);
      } catch (err) {
        setError('Failed to load patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleToggleBan = async (user) => {
    try {
      const res = await api.put(`/admin/users/${user._id}/ban`);
      setPatients(prev => prev.map(p => p._id === user._id ? { ...p, isBanned: !p.isBanned } : p));
      if (selectedPat?._id === user._id) setSelectedPat(prev => ({ ...prev, isBanned: !prev.isBanned }));
    } catch (err) {
      setError('Failed to toggle ban status');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setPatients(prev => prev.filter(p => p._id !== userId));
      if (selectedPat?._id === userId) setSelectedPat(patients.length > 1 ? patients[0] : null);
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const selected = selectedPat;

  if (loading) {
    return (
      <div className="min-h-screen flex bg-slate-100 font-sans">
        <Sidebar />
        <main className="flex-1 ml-[260px] p-8 overflow-y-auto flex items-center justify-center">
          <p className="text-slate-500">Loading patients...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 ml-[260px] p-8 overflow-y-auto">
        <header className="mb-6">
          <h2 className="text-4xl font-bold text-slate-900">User & Patient Management</h2>
          <p className="text-slate-500 mt-2 text-sm">Monitor and manage patient accounts</p>
        </header>

        {error && <div className="mb-6 p-4 text-red-600 bg-red-50 border border-red-100 rounded-xl">{error}</div>}

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT PANEL */}
          <div className="col-span-5 flex flex-col">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900">Patients ({patients.length})</h3>
              </div>
              <div className="flex flex-col">
                {patients.map((pat) => (
                  <div key={pat._id} onClick={() => setSelectedPat(pat)} className={`p-4 border-b border-slate-200 cursor-pointer flex justify-between items-center transition-colors ${selectedPat?._id === pat._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}>
                    <div>
                      <p className="font-semibold text-slate-900">{pat.name}</p>
                      <p className="text-sm text-slate-500 mt-1">{pat.email}</p>
                      <div className="mt-3 flex gap-2">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${!pat.isBanned ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{pat.isBanned ? 'Suspended' : 'Active'}</span>
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
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selected.name}</h2>
                    <p className="text-slate-500 font-medium mt-1">ID: {selected._id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${!selected.isBanned ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selected.isBanned ? 'Suspended' : 'Active'}</span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Account Information</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div><p className="text-xs text-slate-400 mb-1">Email</p><p className="text-sm font-medium text-slate-900">{selected.email}</p></div>
                    <div><p className="text-xs text-slate-400 mb-1">Role</p><p className="text-sm font-medium text-slate-900">{selected.role}</p></div>
                    <div><p className="text-xs text-slate-400 mb-1">Joined</p><p className="text-sm font-medium text-slate-900">{new Date(selected.createdAt).toLocaleDateString()}</p></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Administrative Actions</h3>
                  <div className="flex gap-4">
                    <button onClick={() => handleToggleBan(selected)} className={`flex-1 font-bold py-3 rounded-xl transition-colors text-white ${!selected.isBanned ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}>
                      {selected.isBanned ? 'Unsuspend Account' : 'Suspend Account'}
                    </button>
                    <button onClick={() => handleDelete(selected._id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">Delete Account</button>
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-3">Warning: Deleting an account is permanent.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-center justify-center h-64">
                <p className="text-slate-400">No patients found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
