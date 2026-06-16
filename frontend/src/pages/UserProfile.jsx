import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function UserProfile() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [age, setAge] = useState('');
  const [conditions, setConditions] = useState([]);
  const [conditionInput, setConditionInput] = useState('');
  const [medications, setMedications] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [todayStatus, setTodayStatus] = useState([]);
  const [logging, setLogging] = useState(null);
  const [profile, setProfile] = useState(null);

  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await api.get('/medications/today');
      setTodayStatus(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/users/profile');
        const u = res.data;
        setProfile(u);
        if (u.profilePicture) updateUser({ profilePicture: u.profilePicture });
        if (u.age) setAge(String(u.age));
        if (u.medicalConditions) setConditions(u.medicalConditions);
        if (u.medications) setMedications(u.medications);
      } catch {}
    };
    fetch();
    fetchTodayStatus();
  }, [fetchTodayStatus, updateUser]);

  const addCondition = () => {
    const val = conditionInput.trim();
    if (val && !conditions.includes(val)) {
      setConditions([...conditions, val]);
      setConditionInput('');
    }
  };

  const removeCondition = (idx) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', dailyDoses: 1 }]);
  };

  const updateMed = (idx, field, value) => {
    const updated = medications.map((m, i) =>
      i === idx ? { ...m, [field]: field === 'dailyDoses' ? Number(value) : value } : m,
    );
    setMedications(updated);
  };

  const removeMed = (idx) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/users/profile', {
        age: age ? Number(age) : undefined,
        medicalConditions: conditions,
        medications: medications.filter((m) => m.name.trim()),
      });
      setSaved(true);
      fetchTodayStatus();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const logDose = async (medName) => {
    setLogging(medName);
    try {
      await api.post('/medications/log', { medicationName: medName });
      fetchTodayStatus();
    } catch (err) {
      console.error('Failed to log dose:', err);
    } finally {
      setLogging(null);
    }
  };

  const handlePictureSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        const res = await api.post('/users/profile/picture', { image: base64 });
        setProfile((p) => ({ ...p, profilePicture: res.data.url }));
        updateUser({ profilePicture: res.data.url });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!window.confirm('Remove your profile picture?')) return;
    try {
      await api.delete('/users/profile/picture');
      setProfile((p) => ({ ...p, profilePicture: undefined }));
      updateUser({ profilePicture: undefined });
    } catch (err) {
      console.error('Remove failed:', err);
    }
  };

  const initials = profile?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const medStatusMap = {};
  todayStatus.forEach((s) => {
    medStatusMap[s.name] = s;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg lg:max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative shrink-0">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-md shadow-blue-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all disabled:opacity-60"
            >
              {profile?.profilePicture ? (
                <img src={profile.profilePicture} alt="" className="w-full h-full object-cover" />
              ) : (
                initials || 'U'
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
              <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
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
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePictureSelect}
            className="hidden"
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{profile?.name || 'My Health Profile'}</h1>
            <p className="text-sm text-slate-500">{profile?.email || 'Manage your health information'}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-400">{conditions.length} condition{conditions.length !== 1 ? 's' : ''}</span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-400">{medications.filter(m => m.name.trim()).length} medication{(medications.filter(m => m.name.trim()).length) !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* 2-column grid on desktop */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-4 mb-4">
          {/* Personal Information Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-4 lg:mb-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
            </div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Medical Conditions Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-4 lg:mb-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-900">Medical Conditions</h2>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCondition()}
                placeholder="e.g. Type 2 Diabetes"
                className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addCondition}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer shrink-0"
              >
                Add
              </button>
            </div>

            {conditions.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No conditions added yet</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-700 px-2.5 py-1.5 rounded-full"
                  >
                    {c}
                    <button onClick={() => removeCondition(i)} className="text-red-400 hover:text-red-700 cursor-pointer leading-none">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Medications Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-900">Medications</h2>
            </div>
            <button
              onClick={addMedication}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              + Add Medication
            </button>
          </div>

          {medications.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="text-sm text-slate-400">No medications added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {medications.map((med, i) => (
                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-stretch">
                    <div className="w-1 bg-green-500 shrink-0" />
                    <div className="flex-1 p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={med.name}
                            onChange={(e) => updateMed(i, 'name', e.target.value)}
                            placeholder="Medication name"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => removeMed(i)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none p-1 cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                          placeholder="Dosage"
                          className="flex-1 min-w-[80px] px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => updateMed(i, 'frequency', e.target.value)}
                          placeholder="Frequency"
                          className="flex-1 min-w-[80px] px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={med.dailyDoses ?? 1}
                            onChange={(e) => updateMed(i, 'dailyDoses', e.target.value)}
                            min="1"
                            className="w-16 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-400">/day</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save */}
        <div className="mb-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full lg:w-auto inline-flex items-center justify-center gap-2 font-medium rounded-xl py-2.5 px-8 text-sm transition-all cursor-pointer disabled:cursor-not-allowed ${
              saved
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white'
            }`}
          >
            {saving ? (
              'Saving...'
            ) : saved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Saved!
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>

        {/* Today's Dose Log */}
        {todayStatus.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-900">Today's Dose Log</h2>
            </div>
            <div className="space-y-3">
              {todayStatus.map((med) => {
                const pct = med.dailyDoses > 0 ? Math.round((med.takenToday / med.dailyDoses) * 100) : 0;
                return (
                  <div key={med.name} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{med.name}</p>
                        <p className="text-xs text-slate-500">{med.dosage}</p>
                      </div>
                      <button
                        onClick={() => logDose(med.name)}
                        disabled={logging === med.name || med.completed}
                        className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                          med.completed
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed'
                        }`}
                      >
                        {logging === med.name ? '...' : med.completed ? 'Done' : 'Log Dose'}
                      </button>
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            med.completed ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium shrink-0 ${
                        med.completed ? 'text-green-600' : 'text-slate-500'
                      }`}>
                        {med.takenToday}/{med.dailyDoses}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
