import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import WardrobePage from './pages/wardrobe/WardrobePage';
import UploadPage from './pages/upload/UploadPage';
import ProfilePage from './pages/profile/ProfilePage';
import StyleQuizPage from './pages/quiz/StyleQuizPage';
import RecommendationPage from './pages/recommendations/RecommendationPage';
import SettingsPage from './pages/settings/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            borderRadius: '10px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#3333CC', secondary: 'white' },
            style: { border: '1px solid rgba(51,51,204,0.2)' },
          },
          error: {
            style: { border: '1px solid rgba(239,68,68,0.2)' },
          },
        }}
      />
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected app routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="wardrobe" element={<WardrobePage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="quiz" element={<StyleQuizPage />} />
          <Route path="recommendations" element={<RecommendationPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
