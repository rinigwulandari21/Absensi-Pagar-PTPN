import React, { useState } from 'react';
import { User, Building, BookOpen, GraduationCap, X, Check } from 'lucide-react';

export function ModalProfilMagang({ profile, onSave, onClose }) {
  const [formData, setFormData] = useState({ ...profile });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel mobile-modal"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          position: 'relative',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <User size={22} color="#1e40af" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Profil Peserta Magang / PKL
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
              Identitas ini akan dicantumkan pada watermark bukti presensi
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Nama Lengkap Peserta Magang:
            </label>
            <input
              type="text"
              name="nama"
              required
              value={formData.nama}
              onChange={handleChange}
              style={{
                width: '100%',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '10px 12px',
                color: '#0f172a',
                fontSize: '0.88rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                NIM / NIS:
              </label>
              <input
                type="text"
                name="nim"
                required
                value={formData.nim}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#0f172a',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Asal Universitas / Instansi:
              </label>
              <input
                type="text"
                name="instansi"
                required
                value={formData.instansi}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#0f172a',
                  fontSize: '0.88rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Jurusan / Program Studi:
              </label>
              <input
                type="text"
                name="jurusan"
                value={formData.jurusan}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#0f172a',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Divisi Penempatan di PTPN IV:
              </label>
              <input
                type="text"
                name="divisi"
                value={formData.divisi}
                onChange={handleChange}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#0f172a',
                  fontSize: '0.88rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Nama Mentor / Pembimbing Lapangan:
            </label>
            <input
              type="text"
              name="pembimbing"
              value={formData.pembimbing}
              onChange={handleChange}
              style={{
                width: '100%',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '10px 12px',
                color: '#0f172a',
                fontSize: '0.88rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <Check size={16} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { ModalProfilMagang as InternProfileModal };
export default ModalProfilMagang;
