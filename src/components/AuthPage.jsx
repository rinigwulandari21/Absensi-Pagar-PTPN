import React, { useState } from 'react';
import { Building2, User, Lock, BookOpen, Briefcase, UserCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { registerUser, loginUser } from '../utils/authUtils';

export function AuthPage({ onLoginSuccess }) {
  // 'login' | 'register'
  const [mode, setMode] = useState('login');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Login
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  // Form Registrasi (Nama, Jurusan, Tempat Bagian Magang, Nama Mentor, Username, PW)
  const [regForm, setRegForm] = useState({
    nama: '',
    jurusan: '',
    bagianMagang: '',
    namaMentor: '',
    username: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginForm.username || !loginForm.password) {
      setErrorMsg('Harap isi username dan password!');
      return;
    }

    setIsSubmitting(true);
    const res = await loginUser(loginForm.username, loginForm.password);
    setIsSubmitting(false);

    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regForm.nama || !regForm.jurusan || !regForm.bagianMagang || !regForm.namaMentor || !regForm.username || !regForm.password) {
      setErrorMsg('Semua data registrasi wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    const res = await registerUser(regForm);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Akun berhasil dibuat! Mengalihkan ke halaman absensi...');
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 700);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
    }}>
      <div
        className="mobile-card"
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.1), 0 4px 12px rgba(30, 58, 138, 0.08)',
          border: '1px solid #e2e8f0',
          padding: '32px 28px',
        }}
      >
        {/* Header Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(30, 58, 138, 0.25)',
            marginBottom: 12,
          }}>
            <Building2 size={28} color="#ffffff" />
          </div>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 4px',
          }}>
            SIA-MAGANG PTPN IV
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Regional 3 Pekanbaru • Absensi Wajah & Lokasi
          </p>
        </div>

        {/* Tab Switcher: Login / Daftar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#f1f5f9',
          padding: 4,
          borderRadius: 12,
          marginBottom: 20,
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '9px',
              borderRadius: 8,
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: mode === 'login' ? '#ffffff' : 'transparent',
              color: mode === 'login' ? '#1e3a8a' : '#64748b',
              boxShadow: mode === 'login' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '9px',
              borderRadius: 8,
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: mode === 'register' ? '#ffffff' : 'transparent',
              color: mode === 'register' ? '#1e3a8a' : '#64748b',
              boxShadow: mode === 'register' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Daftar Akun
          </button>
        </div>

        {/* Notifikasi Alert */}
        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#059669',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. FORM LOGIN */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                Username:
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#64748b" style={{ position: 'absolute', top: 12, left: 12 }} />
                <input
                  type="text"
                  placeholder="Masukkan username Anda"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#1e3a8a'; e.target.style.background = '#ffffff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.background = '#f8fafc'; }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                Password:
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', top: 12, left: 12 }} />
                <input
                  type="password"
                  placeholder="Masukkan password Anda"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#1e3a8a'; e.target.style.background = '#ffffff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.background = '#f8fafc'; }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                marginTop: 6,
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: 700,
                width: '100%',
                borderRadius: 10,
              }}
            >
              <span>Masuk ke Halaman Absensi</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* 2. FORM PENDAFTARAN AKUN */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                Nama Lengkap:
              </label>
              <input
                type="text"
                placeholder="Contoh: Rini Anggraini"
                value={regForm.nama}
                onChange={(e) => setRegForm({ ...regForm, nama: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                Jurusan:
              </label>
              <input
                type="text"
                placeholder="Contoh: Sistem Informasi / Teknik Informatika"
                value={regForm.jurusan}
                onChange={(e) => setRegForm({ ...regForm, jurusan: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                Tempat Bagian Magang (Divisi):
              </label>
              <input
                type="text"
                placeholder="Contoh: Divisi TI & Transformasi Digital"
                value={regForm.bagianMagang}
                onChange={(e) => setRegForm({ ...regForm, bagianMagang: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                Nama Mentor / Pembimbing Lapangan:
              </label>
              <input
                type="text"
                placeholder="Contoh: Bpk. Hendra Saputra"
                value={regForm.namaMentor}
                onChange={(e) => setRegForm({ ...regForm, namaMentor: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Username:
                </label>
                <input
                  type="text"
                  placeholder="Username login"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Password (PW):
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                marginTop: 6,
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: 700,
                width: '100%',
                borderRadius: 10,
              }}
            >
              <CheckCircle2 size={16} />
              <span>Daftar Akun Magang</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
