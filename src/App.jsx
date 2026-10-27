import React, { useState } from 'react';
import { HalamanLoginDaftar } from './components/HalamanLoginDaftar';
import { DashboardAbsensiMagang } from './components/DashboardAbsensiMagang';
import { DashboardAdmin } from './components/DashboardAdmin';
import { BannerStatusDatabase } from './components/BannerStatusDatabase';
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
      <BannerStatusDatabase />

      {/* 1. Jika belum login, tampilkan halaman Masuk (Login) / Daftar Akun Magang */}
      {!currentUser && (
        <HalamanLoginDaftar onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 2. Jika akun yang login adalah ADMIN, tampilkan Dashboard Admin */}
      {currentUser && (currentUser.role === 'admin' || currentUser.username.toLowerCase() === 'admin') && (
        <DashboardAdmin
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* 3. Jika akun yang login adalah MAHASISWA MAGANG, tampilkan Dashboard Absensi Magang */}
      {currentUser && currentUser.role !== 'admin' && currentUser.username.toLowerCase() !== 'admin' && (
        <DashboardAbsensiMagang
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
