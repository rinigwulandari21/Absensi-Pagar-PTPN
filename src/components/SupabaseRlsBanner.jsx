import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle2, Copy, Check, RefreshCw, ExternalLink, X, ShieldAlert } from 'lucide-react';
import { checkSupabaseWritePermission } from '../utils/syncUtils';

export function SupabaseRlsBanner() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'rls_blocked' | 'connected'
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const sqlCommand = `-- 1. Matikan RLS agar aplikasi diizinkan menyimpan data ke Supabase
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances DISABLE ROW LEVEL SECURITY;

-- 2. Pastikan kolom foto_url bertipe TEXT agar foto selfie muat tersimpan
ALTER TABLE public.attendances ALTER COLUMN foto_url TYPE text;

-- 3. (Opsional) Akun default Admin jika belum ada
INSERT INTO public.users (username, password, nama, jurusan, bagian_magang, nama_mentor, role)
VALUES ('admin', '123', 'Admin Pembimbing PTPN IV', 'Bagian SDM & TI', 'Kantor Direksi PTPN IV Regional 3', 'Koordinator Magang', 'admin')
ON CONFLICT (username) DO NOTHING;`;

  const runCheck = async () => {
    setIsSyncing(true);
    const res = await checkSupabaseWritePermission();
    if (res.rlsBlocked) {
      setStatus('rls_blocked');
    } else if (res.ok) {
      setStatus('connected');
      setSyncResult('Terhubung langsung ke database Supabase');
    } else {
      setStatus('rls_blocked');
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    runCheck();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (status === 'checking') return null;

  if (status === 'connected') {
    return (
      <div style={{
        background: '#ecfdf5',
        borderBottom: '1px solid #a7f3d0',
        padding: '8px 16px',
        fontSize: '12px',
        color: '#065f46',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={15} style={{ color: '#059669', flexShrink: 0 }} />
          <span>
            <strong>Database Supabase Aktif:</strong> Terhubung langsung ke cloud Supabase. {syncResult || 'Data otomatis tersimpan ke server.'}
          </span>
        </div>
        <button
          onClick={runCheck}
          disabled={isSyncing}
          style={{
            background: 'none',
            border: 'none',
            color: '#047857',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'underline',
          }}
        >
          <RefreshCw size={12} className={isSyncing ? 'spin' : ''} />
          {isSyncing ? 'Memeriksa...' : 'Cek Status'}
        </button>
      </div>
    );
  }

  // Jika status === 'rls_blocked'
  return (
    <>
      <div style={{
        background: '#fffbeb',
        borderBottom: '1px solid #fde68a',
        padding: '10px 16px',
        fontSize: '13px',
        color: '#92400e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: '#fef3c7',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldAlert size={18} style={{ color: '#d97706' }} />
          </div>
          <div>
            <strong>Perhatian: Supabase RLS Masih Aktif</strong> — Data sementara disimpan di browser lokal karena Supabase menolak penyimpanan (Error 42501).
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Buka Solusi SQL</span>
            <ExternalLink size={13} />
          </button>

          <button
            onClick={runCheck}
            disabled={isSyncing}
            style={{
              background: '#ffffff',
              color: '#78350f',
              border: '1px solid #fde68a',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: 500,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
            {isSyncing ? 'Mengecek...' : 'Cek Ulang'}
          </button>
        </div>
      </div>

      {/* MODAL PANDUAN SQL UNTUK USER */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            padding: '24px',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                background: '#eff6ff',
                padding: '10px',
                borderRadius: '10px',
                color: '#1e3a8a',
              }}>
                <Database size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                  Cara Mengaktifkan Penyimpanan Supabase
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Supabase secara otomatis mengunci tabel baru (*Row Level Security*). Jalankan perintah SQL di bawah ini agar data absensi dan akun dapat masuk.
                </p>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '16px',
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#334155',
            }}>
              <strong>Langkah Cepat (1 Menit):</strong>
              <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Buka dashboard Supabase Anda: <a href="https://supabase.com/dashboard/project/bvqrcskjdcktnxmjbxcq/sql" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>Buka SQL Editor Supabase &rarr;</a></li>
                <li>Klik tombol <strong>"New query"</strong>.</li>
                <li>Salin perintah SQL di bawah ini dan tempel di editor tersebut.</li>
                <li>Klik tombol hijau <strong>"RUN"</strong> (atau tekan <code>Ctrl + Enter</code>).</li>
                <li>Kembali ke sini dan klik <strong>"Cek Ulang & Sinkronkan Sekarang"</strong>.</li>
              </ol>
            </div>

            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0f172a',
                padding: '8px 14px',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                color: '#94a3b8',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}>
                <span>supabase_fix_rls.sql</span>
                <button
                  onClick={copyToClipboard}
                  style={{
                    background: copied ? '#059669' : '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Tersalin!' : 'Salin SQL'}
                </button>
              </div>
              <pre style={{
                margin: 0,
                padding: '14px',
                background: '#1e293b',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'monospace',
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px',
                overflowX: 'auto',
                lineHeight: 1.5,
              }}>
                {sqlCommand}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Tutup
              </button>
              <button
                onClick={async () => {
                  await runCheck();
                  if (status === 'connected') {
                    setShowModal(false);
                  }
                }}
                disabled={isSyncing}
                style={{
                  background: '#1e3a8a',
                  border: 'none',
                  color: '#ffffff',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
                {isSyncing ? 'Memeriksa...' : 'Cek Status Koneksi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
