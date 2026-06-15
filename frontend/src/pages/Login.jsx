import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function OtpInput({ value, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="000000"
      maxLength={6}
      className="w-full text-center tracking-[0.5em] text-2xl py-3 bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    />
  );
}

function LoadingSpinner({ text }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {text}
    </span>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('signin'); // 'signin' | 'register'

  // Shared
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState({});

  // Register-only
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const isSignInValid = email.trim() && validateEmail(email);
  const isRegisterValid =
    firstName.trim() && lastName.trim() && email.trim() && validateEmail(email);

  const switchTab = (t) => {
    setTab(t);
    setStep(1);
    setError('');
    setMessage('');
    setOtp('');
    setTouched({});
  };

  const redirectUser = (role) => {
    if (role === 'admin') {
      navigate('/dashboard');
    } else if (role === 'doctor') {
      navigate('/doctor/patients');
    } else if (role === 'user') {
      navigate('/home');
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/request-otp', { email: email.trim().toLowerCase() });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp,
      });
      login(res.data);

      const role = res.data.role;

      if (role === 'pending_doctor') {
        navigate('/doctor-status');
        return;
      }

      redirectUser(role);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isRegisterValid) return;
    setLoading(true);
    setError('');
    setMessage('');

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      await api.post('/auth/register', {
        name: fullName,
        email: email.trim().toLowerCase(),
      });
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already exists')) {
        // User already exists — continue to OTP
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await api.post('/auth/request-otp', {
        email: email.trim().toLowerCase(),
      });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp,
      });
      login(res.data);
      navigate('/welcome');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getFieldClass = (field, isValid) => {
    const base = 'w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-lg text-sm placeholder-slate-400 focus:outline-none transition-colors';
    if (!touched[field]) return `${base} border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`;
    return isValid
      ? `${base} border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20`
      : `${base} border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-12">
      {/* Branding */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Health AI Platform</h1>
        <p className="text-sm text-slate-500 mt-1">Your personal health companion</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => switchTab('signin')}
            className={`flex-1 py-3.5 text-sm font-medium text-center transition-colors cursor-pointer rounded-t-2xl ${
              tab === 'signin'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-slate-500 hover:text-slate-700 bg-slate-50/50'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchTab('register')}
            className={`flex-1 py-3.5 text-sm font-medium text-center transition-colors cursor-pointer rounded-t-2xl ${
              tab === 'register'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-slate-500 hover:text-slate-700 bg-slate-50/50'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-5 text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg p-3">
              {message}
            </div>
          )}

          {/* ── SIGN IN TAB ── */}
          {tab === 'signin' && step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!isSignInValid || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner text="Sending..." /> : 'Send OTP'}
              </button>
              <p className="text-center text-sm text-slate-500">
                Are you a doctor?{' '}
                <Link to="/doctor-signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Register here
                </Link>
              </p>
            </form>
          )}

          {tab === 'signin' && step === 2 && (
            <form onSubmit={handleSignInVerify} className="space-y-5">
              <p className="text-sm text-slate-600">
                Enter the 6-digit code sent to <strong className="text-slate-800">{email}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Verification Code</label>
                <OtpInput value={otp} onChange={setOtp} />
              </div>
              <button
                type="submit"
                disabled={otp.length !== 6 || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner text="Verifying..." /> : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                Back to email
              </button>
            </form>
          )}

          {/* ── REGISTER TAB ── */}
          {tab === 'register' && step === 1 && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                  <div className="relative">
                    <svg
                      className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onBlur={() => handleBlur('firstName')}
                      placeholder="John"
                      className={getFieldClass('firstName', firstName.length > 0)}
                    />
                    {touched.firstName && firstName.length > 0 && (
                      <svg className="w-4 h-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {touched.firstName && !firstName.trim() && (
                    <p className="text-xs text-red-500 mt-1">First name is required</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                  <div className="relative">
                    <svg
                      className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onBlur={() => handleBlur('lastName')}
                      placeholder="Doe"
                      className={getFieldClass('lastName', lastName.length > 0)}
                    />
                    {touched.lastName && lastName.length > 0 && (
                      <svg className="w-4 h-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {touched.lastName && !lastName.trim() && (
                    <p className="text-xs text-red-500 mt-1">Last name is required</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="you@example.com"
                    className={getFieldClass('email', validateEmail(email))}
                  />
                  {touched.email && validateEmail(email) && (
                    <svg className="w-4 h-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {touched.email && !email.trim() && (
                  <p className="text-xs text-red-500 mt-1">Email is required</p>
                )}
                {touched.email && email.trim() && !validateEmail(email) && (
                  <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isRegisterValid || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner text="Sending verification..." /> : 'Continue to Verification'}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchTab('signin')}
                  className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {tab === 'register' && step === 2 && (
            <form onSubmit={handleRegisterVerify} className="space-y-5">
              <p className="text-sm text-slate-600">
                Enter the 6-digit code sent to <strong className="text-slate-800">{email}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Verification Code</label>
                <OtpInput value={otp} onChange={setOtp} />
              </div>
              <button
                type="submit"
                disabled={otp.length !== 6 || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner text="Creating account..." /> : 'Verify & Create Account'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
                Back to registration form
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Legal */}
      {tab === 'register' && step === 1 && (
        <p className="text-xs text-slate-400 text-center mt-6 max-w-sm">
          By signing up, you agree to our{' '}
          <a href="#" className="text-slate-500 hover:text-slate-700 underline">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="text-slate-500 hover:text-slate-700 underline">Privacy Policy</a>.
        </p>
      )}
    </div>
  );
}
