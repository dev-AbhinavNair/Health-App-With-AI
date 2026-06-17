import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DoctorApplications from './pages/DoctorApplications';
import DoctorManagement from './pages/DoctorManagement';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import ActivityLogs from './pages/ActivityLogs';

import UserChatPage from './pages/UserChatPage';
import DoctorSignup from './pages/DoctorSignup';
import DoctorVerification from './pages/DoctorVerification';
import DocumentUpload from './pages/DocumentUpload';
import DoctorStatus from './pages/DoctorStatus';
import DoctorPatientList from './pages/DoctorPatientList';
import DoctorPatientDetail from './pages/DoctorPatientDetail';
import DoctorUrgentCases from './pages/DoctorUrgentCases';
import DoctorArchivedCases from './pages/DoctorArchivedCases';
import DoctorSymptomTrends from './pages/DoctorSymptomTrends';
import DoctorMedicationHistory from './pages/DoctorMedicationHistory';
import DoctorProfile from './pages/DoctorProfile';
import UserProfile from './pages/UserProfile';
import WelcomePage from './pages/WelcomePage';
import PatientDashboard from './pages/PatientDashboard';
import PatientMedications from './pages/PatientMedications';
import PatientHistory from './pages/PatientHistory';
import UserLayout from './components/UserLayout';
import DoctorRoute from './components/DoctorRoute';
import AdminRoute from './components/AdminRoute';
import UserRoute from './components/UserRoute';
import { useAuth } from './context/AuthContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  const homeElement = () => {
    if (!user) return <Login />;
    if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
    if (user.role === 'doctor') return <Navigate to="/doctor/patients" replace />;
    if (user.role === 'user') return <Navigate to="/home" replace />;
    if (user.role === 'pending_doctor') return <Navigate to="/doctor-status" replace />;
    return <Login />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={homeElement()} />
        <Route path="/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/applications" element={<AdminRoute><DoctorApplications /></AdminRoute>} />
        <Route path="/doctors" element={<AdminRoute><DoctorManagement /></AdminRoute>} />
        <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
        <Route path="/patients" element={<AdminRoute><UserManagement /></AdminRoute>} />
        <Route path="/audit-logs" element={<AdminRoute><ActivityLogs /></AdminRoute>} />
        <Route path="/doctor/patients" element={<DoctorRoute><DoctorPatientList /></DoctorRoute>} />
        <Route path="/doctor/patients/:id" element={<DoctorRoute><DoctorPatientDetail /></DoctorRoute>} />
        <Route path="/doctor/urgent" element={<DoctorRoute><DoctorUrgentCases /></DoctorRoute>} />
        <Route path="/doctor/archived" element={<DoctorRoute><DoctorArchivedCases /></DoctorRoute>} />
        <Route path="/doctor/symptoms" element={<DoctorRoute><DoctorSymptomTrends /></DoctorRoute>} />
        <Route path="/doctor/medications" element={<DoctorRoute><DoctorMedicationHistory /></DoctorRoute>} />
        <Route path="/doctor/profile" element={<DoctorRoute><DoctorProfile /></DoctorRoute>} />
        <Route path="/doctor-signup" element={<DoctorSignup />} />
        <Route path="/doctor-verification" element={<DoctorVerification />} />
        <Route path="/doctor-verification/documents" element={<DoctorRoute requireVerified={false}><DocumentUpload /></DoctorRoute>} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route element={<UserLayout />}>
          <Route path="/home" element={<UserRoute><PatientDashboard /></UserRoute>} />
          <Route path="/medications" element={<UserRoute><PatientMedications /></UserRoute>} />
          <Route path="/history" element={<UserRoute><PatientHistory /></UserRoute>} />
          <Route path="/user-chat" element={<UserRoute><UserChatPage /></UserRoute>} />
          <Route path="/my-profile" element={<UserRoute><UserProfile /></UserRoute>} />
        </Route>
        <Route path="/doctor-status" element={<DoctorRoute requireVerified={false}><DoctorStatus /></DoctorRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
