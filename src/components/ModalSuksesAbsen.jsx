import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShieldCheck, MapPin, Calendar, Clock, Download, X } from 'lucide-react';
import { PTPN_LOCATION } from '../constants/ptpnConfig';

export function ModalSuksesAbsen({ logData, internProfile, onClose }) {
  useEffect(() => {
    // Launch celebratory confetti in shades of blue and white
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1e3a8a', '#2563eb', '#60a5fa', '#ffffff'],
    });
  }, []);

  if (!logData) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '28px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: '#ecfdf5',
            border: '2px solid #10b981',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
          }}>
            <CheckCircle2 size={32} color="#059669" />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            Presensi Berhasil Divalidasi!
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            Koordinat & Wajah Anda Resmi Terverifikasi di Area PTPN IV Regional 3
          </p>
        </div>

        {/* Digital Slip / Receipt Card */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-md)',
          padding: '18px',
          marginBottom: 20,
        }}>
          {/* Slip Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px dashed #cbd5e1',
            paddingBottom: 10,
            marginBottom: 12,
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#1e40af', fontWeight: 700, letterSpacing: '0.05em' }}>
                BUKTI PRESENSI ELEKTRONIK
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                PTPN IV REGIONAL 3 PEKANBARU
              </div>
            </div>
            <div style={{
              padding: '4px 10px',
              borderRadius: 20,
              background: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              fontSize: '0.78rem',
              fontWeight: 800,
            }}>
              ABSEN {(logData.tipe || 'MASUK').toUpperCase()}
            </div>
          </div>

          {/* Intern info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12, fontSize: '0.82rem' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.74rem' }}>Nama Peserta:</span>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{internProfile.nama}</div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.74rem' }}>NIM / Asal:</span>
              <div style={{ color: '#0f172a' }}>{internProfile.nim} • {internProfile.instansi}</div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.74rem' }}>Divisi Magang:</span>
              <div style={{ color: '#0f172a' }}>{internProfile.divisi}</div>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.74rem' }}>Waktu Presensi:</span>
              <div style={{ color: '#1e40af', fontWeight: 700 }}>{logData.jam}</div>
            </div>
          </div>

          {/* Coordinates & Verification row */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ color: '#64748b' }}>Titik GPS Terdeteksi:</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: '#0f172a', fontWeight: 600 }}>{logData.koordinat}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#64748b' }}>Jarak Radius:</div>
              <div style={{ color: '#059669', fontWeight: 700 }}>{logData.jarak} (Valid)</div>
            </div>
          </div>

          {/* Photo Thumbnail */}
          {logData.fotoUrl && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <img
                src={logData.fotoUrl}
                alt="Foto Selfie Presensi"
                style={{
                  maxHeight: '160px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {logData.fotoUrl && (
            <a
              href={logData.fotoUrl}
              download={`presensi_ptpn4_${internProfile.nim}_${Date.now()}.jpg`}
              className="btn btn-secondary"
              style={{ flex: 1, textDecoration: 'none' }}
            >
              <Download size={16} color="#1e40af" />
              <span>Simpan Foto</span>
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            <span>Tutup & Selesai</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export { ModalSuksesAbsen as AttendanceSuccessModal };
export default ModalSuksesAbsen;
