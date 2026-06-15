import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

function NA({ text = 'N/A' }) {
  return <span className="text-slate-300 italic">{text}</span>;
}

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/admin/users?role=doctor');
        setDoctors(res.data);
        if (res.data.length > 0) {
          setSelectedDoc(res.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  const selected = doctors.find(doc => doc._id === selectedDoc);

  const handleToggleBan = async () => {
    if (!selected) return;
    const verb = selected.isBanned ? 'unsuspend' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${verb} ${selected.name}? They will ${selected.isBanned ? 'regain' : 'lose'} access to the system.`)) return;
    try {
      const res = await api.put(`/admin/users/${selected._id}/ban`);
      setDoctors(doctors.map(d => 
        d._id === selected._id ? { ...d, isBanned: res.data.user.isBanned } : d
      ));
    } catch (err) {
      console.error('Failed to toggle ban status:', err);
    }
  };

  const handleRemove = async () => {
    if (!selected) return;
    if (!window.confirm(`Are you sure you want to completely remove ${selected.name}?`)) return;
    try {
      await api.delete(`/admin/users/${selected._id}`);
      setDoctors(doctors.filter(d => d._id !== selected._id));
      setSelectedDoc(doctors.length > 1 ? doctors[1]._id : null);
    } catch (err) {
      console.error('Failed to remove doctor:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 ml-[260px] p-8 overflow-y-auto">
        <header className="mb-6">
          <h2 className="text-4xl font-bold text-slate-900">Doctor Management</h2>
          <p className="text-slate-500 mt-2 text-sm">Monitor and manage all registered doctors</p>
        </header>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex justify-between items-center mb-6 shadow-sm">
          <div className="flex items-center gap-3 w-1/2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" placeholder="Search doctors by name or email..." className="w-full bg-transparent focus:outline-none text-sm text-slate-900 placeholder-slate-400" />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT PANEL */}
          <div className="col-span-5 flex flex-col">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900">Active Doctors ({doctors.length})</h3>
              </div>
              <div className="flex flex-col">
              {doctors.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No doctors found.</div>
              ) : doctors.map((doc) => {
                const status = doc.isBanned ? 'Suspended' : 'Active';
                return (
                <div key={doc._id} onClick={() => setSelectedDoc(doc._id)} className={`p-4 border-b border-slate-200 cursor-pointer flex justify-between items-center transition-colors ${selectedDoc === doc._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}>
                    <div>
                      <p className="font-semibold text-slate-900">{doc.name}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {doc.email || <NA />} &bull; {doc.patientCount != null ? `${doc.patientCount} Patients` : <NA />}
                    </p>
                      <div className="mt-3 flex gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{status}</span>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 px-2">&#8942;</button>
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="col-span-7">
            {selected && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-8">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selected.name}</h2>
                    <p className="text-slate-500 font-medium mt-1">{selected.email || <NA />}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${selected.isBanned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {selected.isBanned ? 'Suspended' : 'Active'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="border border-slate-200 rounded-xl p-4 text-center bg-slate-50">
                      <p className="text-2xl font-bold text-slate-900">{selected.patientCount != null ? selected.patientCount : <NA />}</p>
                      <p className="text-xs text-slate-500 mt-1">Total Patients</p>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 text-center bg-slate-50">
                      <p className="text-2xl font-bold text-slate-900">{selected._id ? formatDate(selected.createdAt) || <NA /> : <NA />}</p>
                      <p className="text-xs text-slate-500 mt-1">Joined Date</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Activity Details</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-sm text-slate-500">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-sm font-semibold ${selected.isBanned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {selected.isBanned ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Administrative Actions</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={handleToggleBan}
                      className={`flex-1 font-bold py-3 rounded-xl transition-colors text-white cursor-pointer ${selected.isBanned ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                    >
                      {selected.isBanned ? 'Unsuspend Doctor' : 'Suspend Doctor'}
                    </button>
                    <button
                      onClick={handleRemove}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer"
                    >
                      Remove Doctor
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
