import DoctorSidebar from './DoctorSidebar';

export default function DoctorLayout({ children }) {
  return (
    <div className="h-screen flex bg-slate-100">
      <DoctorSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
