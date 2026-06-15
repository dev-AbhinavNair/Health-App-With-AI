import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE = 10 * 1024 * 1024;

const DOCUMENTS = [
  {
    key: 'medical_license',
    title: 'Medical License',
    required: true,
    description: 'Upload a copy of your current medical license',
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    key: 'board_certification',
    title: 'Board Certification',
    required: false,
    description: 'Upload your board certification (if applicable)',
    icon: (
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'id_proof',
    title: 'Government-Issued ID',
    required: true,
    description: "Driver's license, passport, or state ID",
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

export default function DocumentUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [uploads, setUploads] = useState({
    medical_license: { status: 'idle', file: null, error: '', url: '', publicId: '' },
    board_certification: { status: 'idle', file: null, error: '', url: '', publicId: '' },
    id_proof: { status: 'idle', file: null, error: '', url: '', publicId: '' },
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid format. Allowed: PDF, JPG, JPEG, PNG';
    }
    if (file.size > MAX_SIZE) {
      return 'File too large. Maximum size is 10MB';
    }
    return '';
  };

  const uploadToCloudinary = async (file, documentType) => {
    try {
      const sigRes = await api.get('/verification/upload-signature');
      const { timestamp, signature, apiKey, cloudName, folder } = sigRes.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('api_key', apiKey);
      formData.append('folder', folder);
      formData.append('type', 'upload');

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: 'POST', body: formData },
      );

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error?.message || 'Upload failed');
      }

      const data = await uploadRes.json();
      return { url: data.secure_url, publicId: data.public_id };
    } catch (err) {
      throw new Error(err.message || 'Failed to upload file');
    }
  };

  const handleFileSelect = async (docKey, file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploads((prev) => ({
        ...prev,
        [docKey]: { ...prev[docKey], status: 'error', file, error: validationError },
      }));
      return;
    }

    setUploads((prev) => ({
      ...prev,
      [docKey]: { ...prev[docKey], status: 'uploading', file, error: '' },
    }));

    try {
      const { url, publicId } = await uploadToCloudinary(file, docKey);

      await api.post('/verification/documents', {
        url,
        publicId,
        documentType: docKey,
      });

      setUploads((prev) => ({
        ...prev,
        [docKey]: { status: 'uploaded', file, error: '', url, publicId },
      }));
    } catch (err) {
      setUploads((prev) => ({
        ...prev,
        [docKey]: { ...prev[docKey], status: 'error', error: err.message },
      }));
    }
  };

  const handleRemove = (docKey) => {
    setUploads((prev) => ({
      ...prev,
      [docKey]: { status: 'idle', file: null, error: '', url: '', publicId: '' },
    }));
  };

  const isRequiredUploaded = (doc) => {
    if (!doc.required) return true;
    return uploads[doc.key].status === 'uploaded';
  };

  const allRequiredUploaded = () => {
    return DOCUMENTS.filter((d) => d.required).every((d) => isRequiredUploaded(d));
  };

  const handleSubmit = async () => {
    if (!allRequiredUploaded()) return;

    setSubmitting(true);
    setError('');

    try {
      await api.put('/verification/submit');
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Verification Request Submitted</h1>
          <p className="text-sm text-slate-500 mt-2">Your documents are being reviewed</p>
        </div>

        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-slate-800">Status: Pending Review</p>
            <p className="text-xs text-slate-500 mt-1">
              Estimated review time: 1-3 business days
            </p>
          </div>
          <p className="text-sm text-slate-600">
            You will receive access once your credentials have been verified by our team.
          </p>
        </div>
      </div>
    );
  }

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
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm font-medium text-blue-600">Profile Info</span>
        </div>
        <div className="w-16 h-px bg-blue-600" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-semibold text-white">2</span>
          </div>
          <span className="text-sm font-medium text-blue-600">Documents</span>
        </div>
      </div>

      {/* Upload Card */}
      <div className="w-full max-w-[660px] bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        {error && (
          <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            {error}
          </div>
        )}

        <h2 className="text-xl font-semibold text-slate-900 mb-1">Upload Verification Documents</h2>
        <p className="text-sm text-slate-500 mb-6">
          All documents must be clear, valid, and match the information provided
        </p>

        <div className="space-y-4">
          {DOCUMENTS.map((doc) => {
            const state = uploads[doc.key];

            return (
              <div
                key={doc.key}
                className={`border-2 border-dashed rounded-xl p-5 transition-colors ${
                  state.status === 'error'
                    ? 'border-red-300 bg-red-50/50'
                    : state.status === 'uploaded'
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    {doc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="text-sm font-semibold text-slate-900">{doc.title}</h3>
                      {doc.required && <span className="text-red-500 text-sm">*</span>}
                      {!doc.required && (
                        <span className="text-xs text-slate-400 font-normal">(optional)</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{doc.description}</p>

                    {state.status === 'idle' && (
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        Choose File
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleFileSelect(doc.key, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}

                    {state.status === 'uploading' && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Uploading...
                      </div>
                    )}

                    {state.status === 'uploaded' && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-green-700 truncate">{state.file.name}</span>
                        <button
                          onClick={() => handleRemove(doc.key)}
                          className="text-xs text-slate-500 hover:text-red-600 ml-auto shrink-0 cursor-pointer"
                        >
                          Replace
                        </button>
                      </div>
                    )}

                    {state.status === 'error' && state.error && (
                      <p className="text-xs text-red-500 mt-1">{state.error}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Review Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-slate-800">Note:</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Your documents will be securely reviewed by our verification team. This process typically takes 1-3 business days.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate('/doctor-verification')}
            className="flex-1 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg py-2.5 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allRequiredUploaded() || submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit for Review'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
