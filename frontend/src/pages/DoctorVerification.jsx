import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const SPECIALTIES = [
  'General Practice', 'Cardiology', 'Dermatology', 'Neurology',
  'Orthopedics', 'Pediatrics', 'Psychiatry', 'Ophthalmology',
  'Gastroenterology', 'Pulmonology', 'Endocrinology', 'Rheumatology',
  'Urology', 'Obstetrics & Gynecology', 'ENT',
  'Allergy & Immunology', 'Infectious Disease', 'Nephrology',
  'Hematology', 'Oncology',
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

export default function DoctorVerification() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [specialty, setSpecialty] = useState('');
  const [yearsInPractice, setYearsInPractice] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [npiNumber, setNpiNumber] = useState('');
  const [hospitalAffiliation, setHospitalAffiliation] = useState('');
  const [boardCertification, setBoardCertification] = useState('');
  const [professionalBio, setProfessionalBio] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  const validateNPI = (val) => /^\d{10}$/.test(val);

  const isFormValid = () => {
    return (
      specialty.trim() &&
      yearsInPractice.trim() &&
      !isNaN(Number(yearsInPractice)) &&
      licenseNumber.trim() &&
      licenseState &&
      validateNPI(npiNumber) &&
      hospitalAffiliation.trim()
    );
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getFieldClass = (field, isValid) => {
    const base =
      'w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm placeholder-slate-400 focus:outline-none transition-colors';
    if (!touched[field]) return `${base} border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`;
    return isValid
      ? `${base} border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20`
      : `${base} border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20`;
  };

  const getSelectClass = (field, value) => {
    const base =
      'w-full px-3 py-2.5 bg-slate-50 border rounded-lg text-sm focus:outline-none transition-colors appearance-none cursor-pointer';
    if (!touched[field]) return `${base} border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-400`;
    return value
      ? `${base} border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-slate-900`
      : `${base} border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-slate-900`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/verification/save', {
        specialty,
        yearsInPractice,
        licenseNumber,
        licenseState,
        npiNumber,
        hospitalAffiliation,
        boardCertification,
        professionalBio,
      });
      navigate('/doctor-verification/documents');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-slate-900">Doctor Verification</h1>
        <p className="text-sm text-slate-500 mt-2">Help us verify your credentials to ensure patient safety</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-semibold text-white">1</span>
          </div>
          <span className="text-sm font-medium text-blue-600">Profile Info</span>
        </div>
        <div className="w-16 h-px bg-slate-300" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <span className="text-sm font-semibold text-slate-400">2</span>
          </div>
          <span className="text-sm font-medium text-slate-400">Documents</span>
        </div>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-[660px] bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg p-3">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Professional Information</h2>

          {/* Row 1: Specialty + Years */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Medical Specialty <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  onBlur={() => handleBlur('specialty')}
                  className={getSelectClass('specialty', specialty)}
                >
                  <option value="">Select Specialty</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <svg
                  className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {touched.specialty && !specialty && (
                <p className="text-xs text-red-500 mt-1">Medical specialty is required</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Years in Practice <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={yearsInPractice}
                onChange={(e) => setYearsInPractice(e.target.value.replace(/\D/g, ''))}
                onBlur={() => handleBlur('yearsInPractice')}
                placeholder="e.g., 10"
                className={getFieldClass(
                  'yearsInPractice',
                  yearsInPractice.length > 0 && !isNaN(Number(yearsInPractice)),
                )}
              />
              {touched.yearsInPractice && !yearsInPractice.trim() && (
                <p className="text-xs text-red-500 mt-1">Years in practice is required</p>
              )}
              {touched.yearsInPractice && yearsInPractice.trim() && isNaN(Number(yearsInPractice)) && (
                <p className="text-xs text-red-500 mt-1">Must be a number</p>
              )}
            </div>
          </div>

          {/* Row 2: License Number + License State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Medical License Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                onBlur={() => handleBlur('licenseNumber')}
                placeholder="e.g., MD123456"
                className={getFieldClass('licenseNumber', licenseNumber.length > 0)}
              />
              {touched.licenseNumber && !licenseNumber.trim() && (
                <p className="text-xs text-red-500 mt-1">License number is required</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                License State <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={licenseState}
                  onChange={(e) => setLicenseState(e.target.value)}
                  onBlur={() => handleBlur('licenseState')}
                  className={getSelectClass('licenseState', licenseState)}
                >
                  <option value="">Select State</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <svg
                  className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {touched.licenseState && !licenseState && (
                <p className="text-xs text-red-500 mt-1">License state is required</p>
              )}
            </div>
          </div>

          {/* Row 3: NPI Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              NPI Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={npiNumber}
              onChange={(e) => setNpiNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onBlur={() => handleBlur('npiNumber')}
              placeholder="10-digit National Provider Identifier"
              className={getFieldClass('npiNumber', validateNPI(npiNumber))}
            />
            {touched.npiNumber && !npiNumber && (
              <p className="text-xs text-red-500 mt-1">NPI number is required</p>
            )}
            {touched.npiNumber && npiNumber.length > 0 && !validateNPI(npiNumber) && (
              <p className="text-xs text-red-500 mt-1">NPI must be exactly 10 digits</p>
            )}
          </div>

          {/* Row 4: Hospital Affiliation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Hospital/Clinic Affiliation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={hospitalAffiliation}
              onChange={(e) => setHospitalAffiliation(e.target.value)}
              onBlur={() => handleBlur('hospitalAffiliation')}
              placeholder="e.g., St. Mary's Medical Center"
              className={getFieldClass('hospitalAffiliation', hospitalAffiliation.length > 0)}
            />
            {touched.hospitalAffiliation && !hospitalAffiliation.trim() && (
              <p className="text-xs text-red-500 mt-1">Hospital or clinic affiliation is required</p>
            )}
          </div>

          {/* Row 5: Board Certification */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Board Certification(s) <span className="text-slate-400 text-xs font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={boardCertification}
              onChange={(e) => setBoardCertification(e.target.value)}
              placeholder="e.g., ABIM Internal Medicine"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Row 6: Professional Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Professional Bio <span className="text-slate-400 text-xs font-normal">(optional)</span>
            </label>
            <textarea
              value={professionalBio}
              onChange={(e) => setProfessionalBio(e.target.value)}
              rows={4}
              placeholder="Brief description of your practice and experience..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors resize-y"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Continue to Document Upload'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
