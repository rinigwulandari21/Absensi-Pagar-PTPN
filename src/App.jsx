import React, { useState } from 'react';
import { AuthPage } from './components/AuthPage';
import { SimpleAttendanceDashboard } from './components/SimpleAttendanceDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SupabaseRlsBanner } from './components/SupabaseRlsBanner';
import { getCurrentUser, logoutUser } from './utils/authUtils';

export function App() {
  // Ambil user yang sedang login dari localStorage (jika ada)
  const [currentUser, setCurrentUser] = useState(getCurrentUser);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Banner Notifikasi Status RLS & Sinkronisasi Database Supabase */}
      <SupabaseRlsBanner />

      {/* 1. Jika belum login, tampilkan halaman Masuk (Login) / Daftar Akun Magang */}
      {!currentUser && (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 2. Jika akun yang login adalah ADMIN, tampilkan Admin Dashboard */}
      {currentUser && (currentUser.role === 'admin' || currentUser.username.toLowerCase() === 'admin') && (
        <AdminDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 3. Jika akun yang login adalah MAHASISWA MAGANG, tampilkan Halaman Absensi Simpel */}
      {currentUser && currentUser.role !== 'admin' && currentUser.username.toLowerCase() !== 'admin' && (
        <SimpleAttendanceDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
