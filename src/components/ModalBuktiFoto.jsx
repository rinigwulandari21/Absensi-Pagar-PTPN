import React from 'react';
import { X, Download, ShieldCheck, MapPin, Calendar, Clock, User } from 'lucide-react';

export function ModalBuktiFoto({ logData, onClose }) {
  if (!logData) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel mobile-modal"
        style={{
          width: '100%',
          maxWidth: '680px',
          padding: '24px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <ShieldCheck size={22} color="#1e40af" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Bukti Foto Presensi Terverifikasi
          </h2>
        </div>

        {/* The photo with official watermark */}
        <div style={{
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          background: '#0a1128',
          marginBottom: 16,
          textAlign: 'center',
        }}>
          {logData.fotoUrl ? (
            <img
              src={logData.fotoUrl}
              alt="Bukti Selfie Presensi"
              style={{ width: '100%', maxHeight: '480px', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ padding: '40px', color: '#64748b' }}>
              Foto tidak tersedia untuk log historis ini.
            </div>
          )}
        </div>

        {/* Metadata Details */}
        <div style={{
          background: '#f8fafc',
          borderRadius: 10,
          padding: '14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          fontSize: '0.8rem',
          marginBottom: 16,
          border: '1px solid #e2e8f0',
        }}>
          <div>
            <span style={{ color: '#64748b' }}>Waktu & Tanggal:</span>
            <div style={{ color: '#0f172a', fontWeight: 600 }}>{logData.tanggal} - {logData.jam}</div>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Tipe Absensi:</span>
            <div style={{ color: '#1e40af', fontWeight: 700 }}>
              {logData.tipe ? (logData.tipe.toLowerCase() === 'pulang' ? 'Pulang (Sore)' : 'Masuk (Pagi)') : 'Masuk (Pagi)'}
            </div>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Koordinat GPS:</span>
            <div style={{ fontFamily: 'var(--font-mono)', color: '#0f172a', fontWeight: 600 }}>{logData.koordinat}</div>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Jarak ke Kantor:</span>
            <div style={{ color: '#0f172a', fontWeight: 600 }}>{logData.jarak} (PTPN IV Reg 3)</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {logData.fotoUrl && (
            <a
              href={logData.fotoUrl}
              download={`bukti_presensi_${logData.id}.jpg`}
              className="btn btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              <Download size={15} color="#1e40af" />
              <span>Unduh Foto</span>
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
          >
            <span>Tutup</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export { ModalBuktiFoto as PhotoProofModal };
export default ModalBuktiFoto;
