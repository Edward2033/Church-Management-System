import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { PublicLayout } from '@/components/PublicLayout';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import GalleryPage from '@/pages/GalleryPage';
import AnnouncementsPage from '@/pages/AnnouncementsPage';
import ActivitiesPage from '@/pages/ActivitiesPage';
import ContactPage from '@/pages/ContactPage';
import RegisterPage from '@/pages/RegisterPage';
import LoginPage from '@/pages/LoginPage';
import SetupPasswordPage from '@/pages/SetupPasswordPage';
import AdminDashboard from '@/pages/AdminDashboard';
import MemberDashboard from '@/pages/MemberDashboard';
import ProtectedRoute from '@/components/ProtectedRoute';

const App: React.FC = () => (
  <AuthProvider>
    <Routes>
      {/* Public website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/setup-password" element={<SetupPasswordPage />} />
      </Route>

      {/* Protected dashboards */}
      <Route path="/admin/*" element={<ProtectedRoute roles={['admin','superadmin','pastor','elder']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/*" element={<ProtectedRoute roles={['member','choir_member','choir','admin','superadmin','pastor','elder','deacon','leader']}><MemberDashboard /></ProtectedRoute>} />
    </Routes>
  </AuthProvider>
);

export default App;
