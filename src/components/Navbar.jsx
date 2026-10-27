import React, { useState, useEffect } from 'react';
import { Building2, Clock, User, ShieldCheck, MapPin } from 'lucide-react';
import { PTPN_LOCATION } from '../constants/ptpnConfig';

export function Navbar({ internProfile, onOpenProfile, isWithinGeofence, distanceMeters }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header style={{
      borderBottom: '1px solid #e2e8f0',
      background: '#ffffff',
      boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        {/* Brand & Corporate ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            border: '1px solid #1e3a8a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
          }}>
            <Building2 size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#0f172a',
              }}>
                SIA-MAGANG
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 9999,
                background: '#eff6ff',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                REGIONAL 3
              </span>
            </div>
            <p style={{
              fontSize: '0.78rem',
              color: '#64748b',
              margin: 0,
            }}>
              PT Perkebunan Nusantara IV • Jl. Rambutan No. 43 Pekanbaru
            </p>
          </div>
        </div>

        {/* Center: Live Digital Clock & Geofence Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          {/* Live Clock */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#f8fafc',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e2e8f0',
          }}>
            <Clock size={16} color="#2563eb" />
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '0.03em',
              }}>
                {formattedTime} <span style={{ fontSize: '0.7rem', color: '#2563eb' }}>WIB</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {formattedDate}
              </div>
            </div>
          </div>

          {/* Quick Geofence Pill */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            background: isWithinGeofence ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${isWithinGeofence ? '#a7f3d0' : '#fecaca'}`,
          }} className="geofence-header-pill">
            <span className={isWithinGeofence ? 'pulse-indicator' : 'pulse-indicator pulse-red'} />
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: isWithinGeofence ? '#065f46' : '#991b1b',
            }}>
              {isWithinGeofence ? 'Area PTPN IV (Valid)' : 'Di Luar Area PTPN IV'}
            </span>
          </div>
        </div>

        {/* User Profile Button */}
        <button
          onClick={onOpenProfile}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            padding: '6px 14px',
            color: '#0f172a',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.background = '#eff6ff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.background = '#f8fafc';
          }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: '#ffffff',
          }}>
            {internProfile.nama ? internProfile.nama.charAt(0) : 'R'}
          </div>
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
              {internProfile.nama}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 600 }}>
              {internProfile.instansi}
            </div>
          </div>
        </button>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .geofence-header-pill {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
