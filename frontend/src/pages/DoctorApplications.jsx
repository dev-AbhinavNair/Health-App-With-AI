import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function DoctorApplications() {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    if (selectedApp) {
      setAdminNotes(selectedApp.adminNotes || '');
    }
  }, [selectedApp]);

  const handleSaveNotes = async (id, notes) => {
    try {
      setNotesSaving(true);
      const res = await api.put(`/admin/doctor-applications/${id}/notes`, { notes });
      setApplications(prev => prev.map(a => a._id === id ? res.data : a));
      if (selectedApp?._id === id) setSelectedApp(res.data);
    } catch {
      setError('Failed to save notes');
    } finally {
      setNotesSaving(false);
    }
  };

  const handleViewDocument = async (publicId) => {
    try {
      const res = await api.get(`/verification/documents/view?publicId=${publicId}`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch {
      setError('Failed to open document');
    }
  };

  const verificationChecks = (app) => [
    { label: 'Medical License Verified', passed: !!app.licenseNumber },
    { label: 'NPI Number Verified', passed: !!app.npiNumber },
    { label: 'Board Certification', passed: !!app.boardCertification },
    { label: 'Documents Uploaded', passed: (app.documents?.length || 0) > 0 },
  ];

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/doctor-applications');
        setApplications(res.data);
        if (res.data.length > 0) setSelectedApp(res.data[0]);
      } catch (err) {
        setError('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/admin/doctor-applications/${id}/approve`);
      setApplications(prev => prev.map(a => a._id === id ? res.data : a));
      if (selectedApp?._id === id) setSelectedApp(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/admin/doctor-applications/${id}/reject`);
      setApplications(prev => prev.map(a => a._id === id ? res.data : a));
      if (selectedApp?._id === id) setSelectedApp(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const selected = selectedApp;

  if (loading) {
    return (
      <div className="min-h-screen flex bg-slate-100 font-sans">
        <Sidebar />
        <main className="flex-1 ml-[260px] p-8 overflow-y-auto flex items-center justify-center">
          <p className="text-slate-500">Loading applications...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">
      <Sidebar />

      <main className="flex-1 ml-[260px] p-8 overflow-y-auto">
        <header className="mb-6">
          <h2 className="text-4xl font-bold text-slate-900">Doctor Applications</h2>
          <p className="text-slate-500 mt-2 text-sm">Review and approve doctor registration requests</p>
        </header>

        {error && <div className="mb-6 p-4 text-red-600 bg-red-50 border border-red-100 rounded-xl">{error}</div>}

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT PANEL */}
          <div className="col-span-5 flex flex-col">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900">Applications ({applications.length})</h3>
              </div>
              <div className="flex flex-col">
                {applications.map((app) => (
                  <div key={app._id} onClick={() => setSelectedApp(app)} className={`p-4 border-b border-slate-200 cursor-pointer flex justify-between items-center transition-colors ${selectedApp?._id === app._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}>
                    <div>
                      <p className="font-semibold text-slate-900">{app.name}</p>
                      <p className="text-sm text-slate-500 mt-1">{app.specialty} &bull; {app.experience}</p>
                      <p className="text-xs text-slate-400 mt-1">License: {app.licenseNumber}</p>
                      <div className="mt-3 flex gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          app.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>{app.status}</span>
                        <span className="text-xs text-slate-400 flex items-center">{new Date(app.createdAt).toLocaleDateString()}</span>
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
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col gap-8">
                {/* Doctor Profile Header */}
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">{selected.name}</h2>
                  <p className="text-slate-500 mt-1">{selected.specialty}</p>
                </div>

                {/* Qualifications */}
                {(selected.boardCertification || selected.professionalBio) && (
                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">Qualifications</h3>
                    <div className="space-y-2">
                      {selected.boardCertification && (
                        <p className="text-base text-slate-900">Board Certified &mdash; {selected.boardCertification}</p>
                      )}
                      {selected.professionalBio && (
                        <p className="text-sm text-slate-600 leading-relaxed">{selected.professionalBio}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* License & Experience */}
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">License & Experience</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">License Number</p>
                      <p className="text-base font-medium text-slate-900 mt-1">{selected.licenseNumber || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Experience</p>
                      <p className="text-base font-medium text-slate-900 mt-1">{selected.experience || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">License State</p>
                      <p className="text-base font-medium text-slate-900 mt-1">{selected.licenseState || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">NPI Number</p>
                      <p className="text-base font-medium text-slate-900 mt-1">{selected.npiNumber || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Email Address</p>
                      <p className="text-base font-medium text-slate-900 mt-1">{selected.email}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Hospital Affiliation</p>
                      <p className="text-base font-medium text-slate-900 mt-1">{selected.hospitalAffiliation || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Verification Status */}
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">Verification Status</h3>
                  <div className="space-y-2.5">
                    {verificationChecks(selected).map((check) => (
                      <div key={check.label} className="flex items-center gap-3">
                        {check.passed ? (
                          <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <span className={`text-sm font-medium ${check.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Uploaded Documents */}
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">Uploaded Documents</h3>
                  {(selected.documents?.length > 0) ? (
                    <div className="space-y-2">
                      {selected.documents.map((doc, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleViewDocument(doc.publicId)}
                          className="w-full flex items-center gap-3 bg-slate-50 hover:bg-slate-100 rounded-lg px-4 py-3 transition-colors group text-left cursor-pointer"
                        >
                          <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <span className="flex-1 text-sm font-medium text-slate-700 capitalize">{doc.documentType.replace(/_/g, ' ')}</span>
                          <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No documents uploaded yet</p>
                  )}
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-3">Admin Notes</h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    onBlur={() => handleSaveNotes(selected._id, adminNotes)}
                    placeholder="Add notes or reasons for decision..."
                    rows={4}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-colors"
                  />
                  {notesSaving && (
                    <p className="text-xs text-slate-400 mt-1">Saving...</p>
                  )}
                </div>

                {/* Application Info */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>Applied: {new Date(selected.createdAt).toLocaleDateString()}</span>
                    <span className="font-semibold">Status: <span className={`${
                      selected.status === 'pending' ? 'text-yellow-600' :
                      selected.status === 'approved' ? 'text-green-600' : 'text-red-600'
                    }`}>{selected.status}</span></span>
                    {selected.reviewedBy && <span>Reviewed by: {selected.reviewedBy?.name || 'Admin'}</span>}
                  </div>
                </div>

                {/* Approval Actions */}
                <div className="flex gap-4">
                  {selected.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(selected._id)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {actionLoading ? 'Processing...' : 'Approve Application'}
                      </button>
                      <button
                        onClick={() => handleReject(selected._id)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {actionLoading ? 'Processing...' : 'Reject Application'}
                      </button>
                    </>
                  )}
                  {selected.status !== 'pending' && (
                    <div className="flex-1 text-center py-3 bg-slate-50 rounded-xl text-slate-500 font-medium">
                      Application {selected.status}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex items-center justify-center h-64">
                <p className="text-slate-400">No applications found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
