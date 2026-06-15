import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function UserProfile() {
  const [age, setAge] = useState('');
  const [conditions, setConditions] = useState([]);
  const [conditionInput, setConditionInput] = useState('');
  const [medications, setMedications] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [todayStatus, setTodayStatus] = useState([]);
  const [logging, setLogging] = useState(null);

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
        if (u.age) setAge(String(u.age));
        if (u.medicalConditions) setConditions(u.medicalConditions);
        if (u.medications) setMedications(u.medications);
      } catch {}
    };
    fetch();
    fetchTodayStatus();
  }, [fetchTodayStatus]);

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

  const medStatusMap = {};
  todayStatus.forEach((s) => {
    medStatusMap[s.name] = s;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link
          to="/user-chat"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Chat
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">My Health Profile</h1>
          <p className="text-sm text-slate-500 mb-6">This information helps your doctor provide better care.</p>

          {/* Age */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Medical Conditions */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Medical Conditions</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCondition()}
                placeholder="e.g. Type 2 Diabetes"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addCondition}
                className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
            {conditions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full"
                  >
                    {c}
                    <button
                      onClick={() => removeCondition(i)}
                      className="text-blue-500 hover:text-blue-700 cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Medications */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">Medications</label>
              <button
                onClick={addMedication}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                + Add Medication
              </button>
            </div>
            {medications.length === 0 && (
              <p className="text-xs text-slate-400 italic">No medications added yet.</p>
            )}
            <div className="space-y-3">
              {medications.map((med, i) => (
                <div key={i} className="flex items-start gap-2 border border-slate-200 rounded-xl p-3">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => updateMed(i, 'name', e.target.value)}
                      placeholder="Medication name"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                        placeholder="Dosage (e.g. 1000mg)"
                        className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => updateMed(i, 'frequency', e.target.value)}
                        placeholder="Frequency (e.g. Daily)"
                        className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <input
                      type="number"
                      value={med.dailyDoses ?? 1}
                      onChange={(e) => updateMed(i, 'dailyDoses', e.target.value)}
                      placeholder="Doses per day"
                      min="1"
                      className="w-24 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => removeMed(i)}
                    className="text-red-500 hover:text-red-700 text-lg leading-none mt-1.5 cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-xl py-2.5 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed mb-6"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
          </button>

          {/* Today's Dose Log */}
          {todayStatus.length > 0 && (
            <div className="border-t border-slate-200 pt-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Today's Dose Log</h2>
              <div className="space-y-2.5">
                {todayStatus.map((med) => (
                  <div key={med.name} className="flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{med.name}</p>
                      <p className="text-xs text-slate-400">
                        {med.takenToday} / {med.dailyDoses} doses taken
                      </p>
                    </div>
                    <button
                      onClick={() => logDose(med.name)}
                      disabled={logging === med.name || med.completed}
                      className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                        med.completed
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed'
                      }`}
                    >
                      {logging === med.name ? '...' : med.completed ? 'Done' : 'Log Dose'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
