import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import PublicLayout from './components/public/PublicLayout';
import { Toaster } from 'sonner';

// Lazy load pages
const Home = lazy(() => import('./pages/public/Home'));
const ArticleView = lazy(() => import('./pages/public/ArticleView'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AddNews = lazy(() => import('./pages/admin/AddNews'));
const ManageNews = lazy(() => import('./pages/admin/ManageNews'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const MediaLibrary = lazy(() => import('./pages/admin/MediaLibrary'));
const SocialPostGenerator = lazy(() => import('./pages/admin/SocialPostGenerator'));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-[#F1F5F9] border-t-[#1E90FF] rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0A2A43]/40">Synchronizing Data</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/admin/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
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
      </Suspense>
      <Toaster position="top-right" richColors />
    </>
  );
}
