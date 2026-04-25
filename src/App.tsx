import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import PublicLayout from './components/public/PublicLayout';
import Home from './pages/public/Home';
import ArticleView from './pages/public/ArticleView';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AddNews from './pages/admin/AddNews';
import ManageNews from './pages/admin/ManageNews';
import Settings from './pages/admin/Settings';
import MediaLibrary from './pages/admin/MediaLibrary';
import SocialPostGenerator from './pages/admin/SocialPostGenerator';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/admin/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/news/:slug" element={<ArticleView />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="add" element={<AddNews />} />
          <Route path="edit/:id" element={<AddNews />} />
          <Route path="manage" element={<ManageNews />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="generator" element={<SocialPostGenerator />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}
