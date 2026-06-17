import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DoctorLayout from '../components/DoctorLayout';
import api from '../api';

const statusConfig = {
  approved: { label: 'Approved', classes: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending Review', classes: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-700' },
};

const docTypeLabels = {
  medical_license: 'Medical License',
  board_certification: 'Board Certification',
  id_proof: 'Government-Issued ID',
  education: 'Education',
  other: 'Other',
};

export default function DoctorProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [profile, setProfile] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [profileRes, appRes] = await Promise.all([
          api.get('/users/profile'),
          api.get('/verification/status'),
        ]);
        setProfile(profileRes.data);
        setName(profileRes.data.name || '');
        setApplication(appRes.data.application);
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handlePictureSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const res = await api.post('/users/profile/picture', { image: reader.result });
        setProfile((p) => ({ ...p, profilePicture: res.data.url }));
        updateUser({ profilePicture: res.data.url });
        setUploading(false);
        showToast('Profile picture saved');
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!window.confirm('Remove your profile picture?')) return;
    try {
      await api.delete('/users/profile/picture');
      setProfile((p) => ({ ...p, profilePicture: undefined }));
      updateUser({ profilePicture: undefined });
    } catch {}
  };

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === profile?.name) return;
    setSaving(true);
    try {
      await api.put('/users/profile', { name: name.trim() });
      setProfile((p) => ({ ...p, name: name.trim() }));
      updateUser({ name: name.trim() });
      showToast('Name saved');
    } catch {
      setError('Failed to save name');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = profile?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const status = application ? statusConfig[application.status] || statusConfig.pending : null;
  const specialty = application?.specialty || profile?.specialty || 'Not specified';

  return (
      <DoctorLayout>
      <div className="w-full max-w-4xl mx-auto space-y-4">
        {/* Back button (mobile) */}
        <button
          onClick={() => navigate('/doctor/patients')}
          className="lg:hidden flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>

        {/* Toast */}
        {toast && (
          <div className={`text-sm px-4 py-2.5 rounded-xl border ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-100'
          }`}>
            {toast.message}
          </div>
        )}

        <h1 className="text-xl font-bold text-slate-900">My Profile</h1>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</div>
        )}

        {/* Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all disabled:opacity-60"
              >
                {profile?.profilePicture ? (
                  <img src={profile.profilePicture} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials || 'DR'
                )}
              </button>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
              {!uploading && !profile?.profilePicture && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              )}
              {!uploading && profile?.profilePicture && (
                <button
                  onClick={handleRemovePicture}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white transition-colors cursor-pointer text-xs leading-none"
                >
                  &times;
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePictureSelect} className="hidden" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900 truncate">{profile?.name || 'Doctor'}</h2>
              <p className="text-sm text-slate-500 truncate">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
                  {specialty}
                </span>
                {status && (
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${status.classes}`}>
                    {status.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
              <p className="px-3.5 py-2.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl">
                {profile?.email}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Specialty</label>
              <p className="px-3.5 py-2.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl">
                {specialty}
              </p>
            </div>
            <button
              onClick={handleSaveName}
              disabled={saving || !name.trim() || name.trim() === profile?.name}
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-xl py-2.5 px-6 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Verification Details Card */}
        {application && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-900">Verification Details</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">License Number</p>
                <p className="text-sm text-slate-800">{application.licenseNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">NPI Number</p>
                <p className="text-sm text-slate-800">{application.npiNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">License State</p>
                <p className="text-sm text-slate-800">{application.licenseState}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Experience</p>
                <p className="text-sm text-slate-800">{application.experience}</p>
              </div>
              <div className="lg:col-span-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Hospital / Clinic Affiliation</p>
                <p className="text-sm text-slate-800">{application.hospitalAffiliation}</p>
              </div>
              {application.boardCertification && (
                <div className="lg:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Board Certification</p>
                  <p className="text-sm text-slate-800">{application.boardCertification}</p>
                </div>
              )}
              {application.professionalBio && (
                <div className="lg:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Professional Bio</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{application.professionalBio}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents Card */}
        {application?.documents?.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-900">Documents</h2>
            </div>
            <div className="space-y-2">
              {application.documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {docTypeLabels[doc.documentType] || doc.documentType}
                    </p>
                    <p className="text-xs text-slate-400">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewDocument(doc.publicId)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">Contact admin to update or replace documents.</p>
          </div>
        )}

        {/* Status Card */}
        {application && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-900">Application Status</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${status.classes}`}>
                {status.label}
              </span>
              <span className="text-xs text-slate-400">
                Submitted on {new Date(application.createdAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
