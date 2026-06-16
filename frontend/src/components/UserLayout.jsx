import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const navItems = [
  { label: 'Home', icon: 'home', path: '/home' },
  { label: 'Chat', icon: 'chat', path: '/user-chat' },
  { label: 'History', icon: 'history', path: null },
];

const iconMap = {
  home: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  chat: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  ),
  history: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
};

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeLabel = navItems.find(
    (item) => item.path && location.pathname.startsWith(item.path),
  )?.label;

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (item) => {
    if (item.path === '/home') return location.pathname === '/home';
    if (item.path) return location.pathname.startsWith(item.path);
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-[240px] h-screen bg-[#0B132B] flex-col shrink-0">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-lg font-bold text-white">Health App</h1>
          <p className="text-xs text-slate-400 mt-0.5">Patient Portal</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item) || item.label === activeLabel;
            const handleClick = () => {
              if (item.path) navigate(item.path);
            };
            return (
              <button
                key={item.label}
                onClick={handleClick}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.path ? 'cursor-pointer' : 'cursor-default'
                } ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span className={active ? 'text-white' : 'text-slate-400'}>{iconMap[item.icon]}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="m-4 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {initials || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 shrink-0 text-slate-400 hover:text-red-400 transition-colors" title="Sign Out">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <button
              onClick={() => navigate('/my-profile')}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer w-full"
            >
              {iconMap.profile}
              My Profile
            </button>
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 flex flex-col min-h-screen">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-10">
        <div className="flex items-center justify-around px-4">
          {navItems.map((item) => {
            const active = isActive(item);
            return item.path ? (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 px-4 cursor-pointer ${
                  active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {active ? iconMap[item.icon] : (
                  <span className="text-slate-400">{iconMap[item.icon]}</span>
                )}
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-blue-600 absolute -bottom-0.5" />}
              </button>
            ) : (
              <div
                key={item.label}
                className="relative flex flex-col items-center gap-0.5 py-2.5 px-4 text-slate-300 cursor-not-allowed opacity-60"
              >
                {iconMap[item.icon]}
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
