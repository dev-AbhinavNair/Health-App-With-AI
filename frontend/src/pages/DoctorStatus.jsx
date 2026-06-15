import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function DoctorStatus() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/verification/status');
        const application = res.data.application;
        if (!application) {
          navigate('/doctor-verification');
          return;
        }
        if (application.status === 'approved') {
          const profileRes = await api.get('/users/profile');
          if (profileRes.data.role === 'doctor') {
            updateUser({ role: 'doctor' });
            navigate('/doctor/patients');
            return;
          }
        }
        setApp(application);
      } catch {
        navigate('/doctor-verification');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return null;

  const isRejected = app.status === 'rejected';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-slate-900">Doctor Verification</h1>
        <p className="text-sm text-slate-500 mt-2">Help us verify your credentials to ensure patient safety</p>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
        {isRejected ? (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ) : (
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}

        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {isRejected ? 'Application Rejected' : 'Application Under Review'}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {isRejected
            ? 'Your verification application has been reviewed and was not approved at this time.'
            : 'Your verification documents are being reviewed by our team.'}
        </p>

        <div className={`rounded-lg p-4 mb-6 ${isRejected ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'}`}>
          <p className="text-sm font-medium text-slate-800">
            Status: {isRejected ? 'Rejected' : 'Pending Review'}
          </p>
          {!isRejected && (
            <p className="text-xs text-slate-500 mt-1">
              Estimated review time: 1-3 business days
            </p>
          )}
        </div>

        <p className="text-sm text-slate-600 mb-6">
          {isRejected
            ? 'If you believe this was a mistake or would like to re-apply, please contact our support team for further assistance.'
            : `You will receive access to your doctor dashboard once your credentials have been verified. We will notify you at ${user?.email} when the review is complete.`}
        </p>

        <button
          onClick={handleLogout}
          className="w-full bg-white border border-slate-300 text-slate-700 font-medium rounded-lg py-2.5 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
