import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, Navigate } from 'react-router-dom';

import Protectedlayout from './components/Protectedlayout';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Pricing from './pages/Pricing';
import MeetingRoom from './pages/MeetingRoom';

const App = () => {
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: '12px',
            fontSize: '13px',
            padding: '10px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <Routes>
        {/* Public Marketing Landing Page (Reference 1) */}
        <Route path='/' element={<LandingPage />} />

        {/* Authenticated / Protected Routes (Requires Sign In) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Protectedlayout />}>
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/sessions' element={<Sessions />} />
            <Route path='/pricing' element={<Pricing />} />
          </Route>
        </Route>

        {/* Auth Dedicated Pages */}
        <Route path='/login/*' element={<Login mode="login" />} />
        <Route path='/register/*' element={<Login mode="register" />} />  

        {/* Video Meeting Room (Mesh WebRTC) */}
        <Route path='/meeting/:meetingId' element={<MeetingRoom />} />

        {/* Fallback Route */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </>
  );
};

export default App;
