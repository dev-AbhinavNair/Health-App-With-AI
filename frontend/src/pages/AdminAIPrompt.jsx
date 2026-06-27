import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import Sidebar from '../components/Sidebar';

const TABS = [
  { key: 'summary', label: 'Summary Prompt' },
  { key: 'conversation', label: 'Conversation Prompt' },
];

export default function AdminAIPrompt() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState('summary');
  const [promptText, setPromptText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchPrompt();
  }, [activeTab]);

  const fetchPrompt = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/ai-prompt?type=${activeTab}`);
      setPromptText(res.data.promptText);
      setOriginalText(res.data.promptText);
      setLastUpdated(res.data.updatedBy);
    } catch {
      showToast('Failed to load prompt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!promptText.trim()) {
      showToast('Please provide prompt text', 'error');
      return;
    }
    try {
      setSaving(true);
      const res = await api.put(`/admin/ai-prompt?type=${activeTab}`, { promptText });
      setPromptText(res.data.promptText);
      setOriginalText(res.data.promptText);
      setLastUpdated(res.data.updatedBy);
      showToast(`${TABS.find(t => t.key === activeTab)?.label || 'Prompt'} saved`);
    } catch {
      showToast('Failed to save prompt', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    try {
      setSaving(true);
      await api.put(`/admin/ai-prompt?type=${activeTab}`, { promptText: '' });
      const res = await api.get(`/admin/ai-prompt?type=${activeTab}`);
      setPromptText(res.data.promptText);
      setOriginalText(res.data.promptText);
      setLastUpdated(res.data.updatedBy);
      showToast('Default prompt restored');
    } catch {
      showToast('Failed to restore default', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = promptText !== originalText;

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8 overflow-y-auto">
        <h1 className="text-xl font-bold text-slate-900 mb-1">AI Prompt Management</h1>
        <p className="text-sm text-slate-500 mb-6">
          {isSuperAdmin
            ? 'Edit the system prompts that control AI behavior'
            : 'View the system prompts (only super admins can edit)'}
        </p>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-2xl p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
            Loading prompt...
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Info bar */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {activeTab === 'summary'
                  ? 'Controls how the AI generates summaries after patient conversations'
                  : 'Controls how the AI chats with patients — asking symptoms, deciding when ready, extracting data'}
              </p>
              {lastUpdated && (
                <p className="text-xs text-slate-400">
                  Last updated by {lastUpdated.name}
                </p>
              )}
            </div>

            <div className="p-6">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                readOnly={!isSuperAdmin}
                rows={22}
                className={`w-full border rounded-xl p-4 text-sm font-mono leading-relaxed resize-y focus:outline-none ${
                  isSuperAdmin
                    ? 'border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600 cursor-default'
                }`}
              />
            </div>

            {/* Actions */}
            {isSuperAdmin && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-xl px-5 py-2.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
                </button>
                <button
                  onClick={handleRestore}
                  disabled={saving}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl px-5 py-2.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Restoring...' : 'Restore Default'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium z-50 ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            {toast.message}
          </div>
        )}
      </main>
    </div>
  );
}
