import React, { useState } from 'react';
import { History, Download, Eye, CheckCircle, Calendar, Clock, MapPin, Check, Filter } from 'lucide-react';
import { exportAttendanceToCSV } from '../utils/storageUtils';

export function RiwayatAbsensi({ logs, onSelectPhoto }) {
  const [filterType, setFilterType] = useState('Semua'); // 'Semua' | 'Masuk' | 'Pulang'

  const filteredLogs = logs.filter(log => {
    if (filterType === 'Semua') return true;
    return log.tipe.toLowerCase() === filterType.toLowerCase();
  });

  const totalMasuk = logs.filter(l => l.tipe.toLowerCase() === 'masuk').length;
  const totalPulang = logs.filter(l => l.tipe.toLowerCase() === 'pulang').length;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Top Header & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <History size={20} color="#1e40af" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Riwayat Presensi Magang
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
              Daftar absensi harian terverifikasi dengan koordinat GPS & foto
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Filter Pill Buttons */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: 4,
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e2e8f0',
          }}>
            {['Semua', 'Masuk', 'Pulang'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filterType === type ? '#1e3a8a' : 'transparent',
                  color: filterType === type ? '#ffffff' : '#475569',
                  boxShadow: filterType === type ? '0 2px 6px rgba(30, 58, 138, 0.25)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Export CSV button */}
          <button
            type="button"
            onClick={() => exportAttendanceToCSV(logs)}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', gap: 6 }}
          >
            <Download size={14} color="#1e40af" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}>
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Total Presensi</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{logs.length}</div>
        </div>

        <div style={{ background: '#eff6ff', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: 600 }}>Total Masuk (Check-In)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a' }}>{totalMasuk}</div>
        </div>

        <div style={{ background: '#f0fdfa', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #99f6e4' }}>
          <div style={{ fontSize: '0.74rem', color: '#0f766e', fontWeight: 600 }}>Total Pulang (Check-Out)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f766e' }}>{totalPulang}</div>
        </div>
      </div>

      {/* Table / List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.85rem',
          textAlign: 'left',
        }}>
          <thead>
            <tr style={{
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              color: '#475569',
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <th style={{ padding: '12px 14px' }}>Waktu & Tanggal</th>
              <th style={{ padding: '12px 14px' }}>Tipe</th>
              <th style={{ padding: '12px 14px' }}>Geofence / Jarak</th>
              <th style={{ padding: '12px 14px' }}>Catatan Aktivitas</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>Bukti Foto</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  Belum ada catatan presensi untuk filter ini.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Waktu & Tanggal */}
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      {log.jam}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {log.tanggal}
                    </div>
                  </td>

                  {/* Tipe Absensi */}
                  <td style={{ padding: '14px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: log.tipe.toLowerCase() === 'masuk' ? '#eff6ff' : '#f0fdfa',
                      color: log.tipe.toLowerCase() === 'masuk' ? '#1e40af' : '#0f766e',
                      border: `1px solid ${log.tipe.toLowerCase() === 'masuk' ? '#bfdbfe' : '#99f6e4'}`,
                    }}>
                      {log.tipe}
                    </span>
                  </td>

                  {/* Geofence & Koordinat */}
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span className={log.lokasiValid ? 'pulse-indicator' : 'pulse-indicator pulse-red'} style={{ width: 8, height: 8 }} />
                      <span style={{ fontWeight: 600, color: log.lokasiValid ? '#059669' : '#dc2626' }}>
                        {log.lokasiValid ? 'Area PTPN IV' : 'Luar Radius'}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#64748b' }}>
                      {log.jarak} ({log.koordinat})
                    </div>
                  </td>

                  {/* Catatan Ringkas */}
                  <td style={{ padding: '14px', maxWidth: '240px' }}>
                    <div style={{
                      color: '#334155',
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {log.catatan || '-'}
                    </div>
                  </td>

                  {/* Bukti Foto */}
                  <td style={{ padding: '14px', textAlign: 'center' }}>
                    {log.fotoUrl ? (
                      <button
                        type="button"
                        onClick={() => onSelectPhoto(log)}
                        style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: 8,
                          padding: '6px 12px',
                          color: '#1e40af',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#1e3a8a';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#eff6ff';
                          e.currentTarget.style.color = '#1e40af';
                        }}
                      >
                        <Eye size={13} />
                        <span>Lihat Bukti</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tersimpan</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { RiwayatAbsensi as AttendanceHistory };
export default RiwayatAbsensi;
