import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLayout from './layouts/DashboardLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CoursesPage from './pages/CoursesPage';
import FDPDetailsPage from './pages/FDPDetailsPage';
import FDPLearningPage from './pages/FDPLearningPage';
import MyFDPsPage from './pages/MyFDPsPage';
import AIContentPage from './pages/AIContentPage';
import AssessmentsPage from './pages/AssessmentsPage';
import SkillGapPage from './pages/SkillGapPage';
import CertificatesPage from './pages/CertificatesPage';
import CertificateVerifyPage from './pages/CertificateVerifyPage';
import AdminCertificateEditorPage from './pages/AdminCertificateEditorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AIMentorPage from './pages/AIMentorPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminFDPsPage from './pages/AdminFDPsPage';
import AdminCreateFDPPage from './pages/AdminCreateFDPPage';
import AdminFdpEditorPage from './pages/AdminFdpEditorPage';
import AdminCertificatesPage from './pages/AdminCertificatesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminReportsPage from './pages/AdminReportsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium rounded-xl shadow-lg border border-gray-100' }} />
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin/register" element={<AdminRegisterPage />} />
            <Route path="/verify" element={<CertificateVerifyPage />} />
            <Route path="/verify-certificate/:certificateId" element={<CertificateVerifyPage />} />

            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<FacultyDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Common Routes */}
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/fdp/:id" element={<FDPDetailsPage />} />
              <Route path="/fdp/:id/learn" element={<FDPLearningPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Faculty Routes */}
              <Route path="/my-fdps" element={<MyFDPsPage />} />
              <Route path="/ai-mentor" element={<AIMentorPage />} />
              <Route path="/assessments" element={<AssessmentsPage />} />
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/skill-gap" element={<SkillGapPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />

              {/* Admin Routes */}
              <Route path="/ai-content" element={<AIContentPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/fdps" element={<AdminFDPsPage />} />
              <Route path="/admin/create-fdp" element={<AdminCreateFDPPage />} />
              <Route path="/admin/edit-fdp/:id" element={<AdminFdpEditorPage />} />
              <Route path="/admin/certificate-editor" element={<AdminCertificateEditorPage />} />
              <Route path="/admin/certificates" element={<AdminCertificatesPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;
