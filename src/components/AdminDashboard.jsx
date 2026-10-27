import React, { useState, useEffect } from 'react';
import {
  Building2, Users, Calendar, Clock, MapPin, Eye, Download, LogOut,
  Search, Filter, CheckCircle2, UserCheck, Shield, X, Briefcase, GraduationCap,
  RefreshCw, Database, AlertTriangle
} from 'lucide-react';
import { getSupabaseInternsOnly } from '../utils/authUtils';
import { getSupabaseAttendanceLogsOnly, exportAttendanceToCSV } from '../utils/storageUtils';

export function AdminDashboard({ currentUser, onLogout }) {
  // Hanya ambil data murni dari database Supabase (bukan mock/browser)
  const [interns, setInterns] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attendancesRlsBlocked, setAttendancesRlsBlocked] = useState(false);

  // Muat data langsung murni dari database Supabase
  const loadDataFromSupabase = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [internsResult, logsResult] = await Promise.all([
        getSupabaseInternsOnly(),
        getSupabaseAttendanceLogsOnly(),
      ]);

      const fetchedInterns = internsResult.data || [];
      const fetchedLogs = logsResult.data || [];

      // Lengkapi data jurusan & bagian magang dari tabel users Supabase jika di tabel attendances belum ada
      const internMap = new Map(fetchedInterns.map(i => [(i.username || '').toLowerCase(), i]));
      const enrichedLogs = fetchedLogs.map(l => {
        const u = internMap.get((l.username || '').toLowerCase());
        return {
          ...l,
          internName: l.internName || (u ? u.nama : l.username),
          jurusan: l.jurusan && l.jurusan !== '-' ? l.jurusan : (u ? u.jurusan : '-'),
          bagianMagang: l.bagianMagang && l.bagianMagang !== '-' ? l.bagianMagang : (u ? u.bagianMagang : '-'),
        };
      });

      setInterns(fetchedInterns);
      setAllLogs(enrichedLogs);
      setAttendancesRlsBlocked(logsResult.rlsBlocked || false);
    } catch (err) {
      console.error('Error saat memuat data Supabase di admin:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDataFromSupabase();
  }, []);

  // Filter state
  const [selectedInternUsername, setSelectedInternUsername] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewPhotoModal, setViewPhotoModal] = useState(null);

  // Filter logs berdasarkan mahasiswa magang yang dipilih dan pencarian nama/tanggal
  const filteredLogs = allLogs.filter((log) => {
    const matchIntern =
      selectedInternUsername === 'all' ||
      (log.username && log.username.toLowerCase() === selectedInternUsername.toLowerCase());

    const query = searchQuery.toLowerCase();
    const matchSearch =
      !query ||
      (log.internName && log.internName.toLowerCase().includes(query)) ||
      (log.tanggal && log.tanggal.toLowerCase().includes(query)) ||
      (log.bagianMagang && log.bagianMagang.toLowerCase().includes(query));

    return matchIntern && matchSearch;
  });

  // Hitung statistik per anak magang
  const getInternAttendanceCount = (username) => {
    return allLogs.filter(l => l.username && l.username.toLowerCase() === username.toLowerCase()).length;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* 1. HEADER ADMIN */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          {/* Brand & Badge Admin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
            }}>
              <Building2 size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  SIA-MAGANG PTPN IV
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#1e3a8a',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  PANEL ADMIN
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Kantor Direksi Regional 3 Pekanbaru • Monitoring Mahasiswa & Presensi
              </div>
            </div>
          </div>

          {/* Profil Admin & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => loadDataFromSupabase(true)}
              disabled={isRefreshing || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#1e40af',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Ambil data terbaru langsung dari Supabase"
            >
              <RefreshCw size={13} className={isRefreshing || isLoading ? 'spin' : ''} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
            </button>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                {currentUser.nama}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 600 }}>
                Pembimbing / Administrator HRD
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#dc2626',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <LogOut size={14} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. KONTEN UTAMA ADMIN */}
      <main style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '24px 20px', flex: 1 }}>
        {/* Banner Peringatan jika RLS attendances Supabase masih aktif */}
        {attendancesRlsBlocked && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: '0.82rem',
            color: '#92400e',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0 }} />
              <div>
                <strong>Tabel Presensi (attendances) di Supabase masih terkunci RLS:</strong> Jalankan perintah <code>ALTER TABLE public.attendances DISABLE ROW LEVEL SECURITY;</code> di Supabase SQL Editor agar riwayat kehadiran dapat tersimpan dan tampil di sini.
              </div>
            </div>
            <button
              onClick={() => loadDataFromSupabase(true)}
              style={{
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Cek Ulang
            </button>
          </div>
        )}

        {/* Indikator Sumber Data Supabase */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          fontSize: '0.78rem',
          color: '#64748b',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>Sumber Data: <strong>Database Supabase Cloud (Live)</strong></span>
          </div>
          {isLoading && (
            <span style={{ color: '#1e40af', fontWeight: 600 }}>
              Sedang mengambil data terbaru dari Supabase...
            </span>
          )}
        </div>

        {/* Ringkasan Statistik Cepat */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '18px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.78rem', marginBottom: 6 }}>
              <Users size={16} color="#1e40af" />
              <span>Total Mahasiswa Magang</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
              {interns.length} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>Orang</span>
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '18px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.78rem', marginBottom: 6 }}>
              <Calendar size={16} color="#2563eb" />
              <span>Total Catatan Hadir Masuk</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e3a8a' }}>
              {allLogs.length} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>Hari Kehadiran</span>
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '18px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.78rem', marginBottom: 6 }}>
              <MapPin size={16} color="#059669" />
              <span>Validitas Area Kantor</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>
              100% <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>PTPN IV Reg 3</span>
            </div>
          </div>
        </div>

        {/* BAGIAN 1: DAFTAR SELURUH MAHASISWA MAGANG */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '20px',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={20} color="#1e3a8a" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Daftar Seluruh Anak Magang Terdaftar
              </h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Total: <strong>{interns.length} Mahasiswa</strong>
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 14px', width: '40px' }}>No</th>
                  <th style={{ padding: '10px 14px' }}>Nama Lengkap & Username</th>
                  <th style={{ padding: '10px 14px' }}>Jurusan</th>
                  <th style={{ padding: '10px 14px' }}>Bagian Magang</th>
                  <th style={{ padding: '10px 14px' }}>Mentor Lapangan</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Total Masuk</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#1e40af', fontWeight: 600 }}>
                      <RefreshCw size={15} className="spin" style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }} />
                      Mengambil data mahasiswa magang dari Supabase...
                    </td>
                  </tr>
                ) : interns.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      Belum ada data mahasiswa magang di database Supabase (tabel <code>users</code>).
                    </td>
                  </tr>
                ) : (
                  interns.map((intern, idx) => {
                    const count = getInternAttendanceCount(intern.username);
                    const isSelected = selectedInternUsername.toLowerCase() === intern.username.toLowerCase();
                    return (
                      <tr
                        key={intern.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isSelected ? '#eff6ff' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        <td style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {intern.nama}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#1e40af' }}>
                            Username: @{intern.username}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#334155' }}>
                          {intern.jurusan}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: 600 }}>
                          {intern.bagianMagang}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {intern.namaMentor}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: '#eff6ff',
                            color: '#1e40af',
                            border: '1px solid #bfdbfe',
                          }}>
                            {count} Hari Hadir
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedInternUsername(intern.username)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              border: isSelected ? '1px solid #1e3a8a' : '1px solid #cbd5e1',
                              background: isSelected ? '#1e3a8a' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#1e40af',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {isSelected ? 'Sedang Dilihat' : 'Lihat Kehadiran'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BAGIAN 2: REKAPITULASI DETAIL KEHADIRAN */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '20px',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
        }}>
          {/* Header Rekap Kehadiran & Filter Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: 16,
            marginBottom: 16,
          }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Rekapitulasi Kehadiran Mahasiswa
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Pantau hari masuk, jam hadir, koordinat GPS, dan bukti foto selfie
              </p>
            </div>

            {/* Aksi: Ekspor CSV */}
            <button
              type="button"
              onClick={() => exportAttendanceToCSV(filteredLogs)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                background: '#1e3a8a',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(30, 58, 138, 0.25)',
              }}
            >
              <Download size={15} />
              <span>Ekspor Rekap CSV (Excel)</span>
            </button>
          </div>

          {/* Filter Bar: Dropdown Mahasiswa & Pencarian */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
            background: '#f8fafc',
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
          }}>
            {/* Filter Dropdown Nama Mahasiswa */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={15} color="#1e40af" />
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                Filter Mahasiswa:
              </label>
              <select
                value={selectedInternUsername}
                onChange={(e) => setSelectedInternUsername(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.82rem',
                  color: '#0f172a',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">Semua Mahasiswa Magang ({allLogs.length} Log)</option>
                {interns.map((i) => (
                  <option key={i.id} value={i.username}>
                    {i.nama} ({getInternAttendanceCount(i.username)} Hari)
                  </option>
                ))}
              </select>
            </div>

            {/* Kotak Pencarian */}
            <div style={{ position: 'relative', minWidth: 240 }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', top: 9, left: 10 }} />
              <input
                type="text"
                placeholder="Cari nama / tanggal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.82rem',
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Tabel Detail Kehadiran */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 12px', width: '40px' }}>No</th>
                  <th style={{ padding: '10px 12px' }}>Nama Mahasiswa</th>
                  <th style={{ padding: '10px 12px' }}>Bagian Magang</th>
                  <th style={{ padding: '10px 12px' }}>Hari & Tanggal Masuk</th>
                  <th style={{ padding: '10px 12px' }}>Jam Hadir</th>
                  <th style={{ padding: '10px 12px' }}>Status Lokasi</th>
                  <th style={{ padding: '10px 12px' }}>Jarak GPS</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Bukti Foto</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#1e40af', fontWeight: 600 }}>
                      <RefreshCw size={15} className="spin" style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }} />
                      Mengambil catatan kehadiran dari Supabase...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
                      {allLogs.length === 0 ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                            Belum ada catatan presensi di database Supabase (tabel <code>attendances</code>).
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            Data absensi anak magang akan langsung otomatis muncul di sini setelah absensi dilakukan.
                          </div>
                        </div>
                      ) : (
                        'Tidak ditemukan catatan kehadiran untuk kriteria filter ini.'
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px', color: '#64748b', fontWeight: 600 }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {log.internName || '-'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#1e40af' }}>
                          @{log.username}
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: '#334155' }}>
                        {log.bagianMagang || '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {log.tanggal}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Hari {log.hari || 'Kerja'}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#0f172a' }}>
                          <Clock size={13} color="#2563eb" />
                          <span>{log.jam}</span>
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: '#ecfdf5',
                          color: '#065f46',
                          border: '1px solid #a7f3d0',
                        }}>
                          ✅ Hadir
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        <div>{log.jarak}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {log.koordinat}
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {log.fotoUrl ? (
                          <button
                            type="button"
                            onClick={() => setViewPhotoModal(log)}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: 6,
                              padding: '5px 10px',
                              color: '#1e40af',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Eye size={12} />
                            <span>Lihat</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tercatat</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL LIHAT FOTO SELFIE WATERMARK OLEH ADMIN */}
      {viewPhotoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setViewPhotoModal(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '20px',
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)',
              border: '1px solid #cbd5e1',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                  Bukti Presensi: {viewPhotoModal.internName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>
                  {viewPhotoModal.tanggal} • {viewPhotoModal.jam}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewPhotoModal(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #cbd5e1', marginBottom: 12, background: '#0f172a' }}>
              <img
                src={viewPhotoModal.fotoUrl}
                alt="Foto Presensi"
                style={{ width: '100%', maxHeight: 380, objectFit: 'contain' }}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>Bagian: <strong>{viewPhotoModal.bagianMagang || '-'}</strong></span>
              <span>Lokasi: <strong>{viewPhotoModal.jarak} dari Kantor PTPN IV</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
