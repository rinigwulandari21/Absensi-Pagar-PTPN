import React from 'react';
import { MapPin, Navigation, CheckCircle2, XCircle, AlertCircle, RefreshCw, Sliders, Shield } from 'lucide-react';
import { PTPN_LOCATION, SIMULATION_PRESETS } from '../constants/ptpnConfig';
import { formatDistance, formatCoordinates } from '../utils/geoUtils';

export function GeofenceStatusCard({
  userLat,
  userLng,
  userAccuracy,
  distanceMeters,
  isWithinGeofence,
  allowedRadius,
  setAllowedRadius,
  selectedPresetId,
  onSelectPreset,
  onRefreshGps,
  isLoadingGps,
  gpsError,
}) {
  const percentOfRadius = Math.min(100, Math.round((distanceMeters / allowedRadius) * 100));

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: -60,
        right: -60,
        width: 180,
        height: 180,
        borderRadius: '50%',
        background: isWithinGeofence
          ? 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Navigation size={18} color="#2563eb" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Geofencing & Koordinat GPS
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Validasi Area PTPN IV Reg 3
          </h2>
        </div>

        {/* Status Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.88rem',
          fontWeight: 700,
        }} className={isWithinGeofence ? 'badge-valid' : 'badge-invalid'}>
          {isWithinGeofence ? (
            <>
              <CheckCircle2 size={16} color="#059669" />
              <span>AREA RESMI TERVERIFIKASI</span>
            </>
          ) : (
            <>
              <XCircle size={16} color="#dc2626" />
              <span>DILUAR RADIUS KANTOR</span>
            </>
          )}
        </div>
      </div>

      {/* Location comparison grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
        marginBottom: 20,
      }}>
        {/* Office Target Details */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#1e40af', fontSize: '0.8rem', fontWeight: 600 }}>
            <MapPin size={15} />
            <span>Titik Acuan Resmi:</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: 4 }}>
            {PTPN_LOCATION.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>
            {PTPN_LOCATION.address}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '4px 8px',
            borderRadius: 6,
            color: '#1e40af',
            display: 'inline-block',
          }}>
            📍 {PTPN_LOCATION.latitude.toFixed(6)}, {PTPN_LOCATION.longitude.toFixed(6)}
          </div>
        </div>

        {/* Current User Coordinates & Distance */}
        <div style={{
          background: isWithinGeofence ? '#eff6ff' : '#fef2f2',
          border: `1px solid ${isWithinGeofence ? '#bfdbfe' : '#fecaca'}`,
          borderRadius: 'var(--radius-md)',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isWithinGeofence ? '#1e40af' : '#991b1b', fontSize: '0.8rem', fontWeight: 600 }}>
              <span className={isWithinGeofence ? 'pulse-indicator' : 'pulse-indicator pulse-red'} />
              <span>Posisi Terdeteksi Anda:</span>
            </div>
            <button
              onClick={onRefreshGps}
              disabled={isLoadingGps}
              type="button"
              title="Perbarui Sinyal GPS"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
              }}
            >
              <RefreshCw size={13} className={isLoadingGps ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: isWithinGeofence ? '#0f172a' : '#dc2626' }}>
              {formatDistance(distanceMeters)}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              dari gerbang kantor
            </span>
          </div>

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            background: '#ffffff',
            border: `1px solid ${isWithinGeofence ? '#bfdbfe' : '#fecaca'}`,
            padding: '4px 8px',
            borderRadius: 6,
            color: '#0f172a',
            display: 'inline-block',
            marginBottom: 6,
          }}>
            📡 {formatCoordinates(userLat, userLng)}
          </div>

          {userAccuracy && (
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Akurasi sensor: ±{Math.round(userAccuracy)} meter
            </div>
          )}
        </div>
      </div>

      {/* Distance meter bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
          <span style={{ color: '#64748b' }}>
            Radius Presensi yang Diizinkan: <strong style={{ color: '#0f172a' }}>{allowedRadius} meter</strong>
          </span>
          <span style={{
            fontWeight: 700,
            color: isWithinGeofence ? '#1e40af' : '#dc2626',
          }}>
            {isWithinGeofence ? 'Memenuhi Syarat' : `Melebihi Batas (+${Math.round(distanceMeters - allowedRadius)}m)`}
          </span>
        </div>

        <div style={{
          height: 10,
          background: '#e2e8f0',
          borderRadius: 999,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            width: `${isWithinGeofence ? Math.min(100, (distanceMeters / allowedRadius) * 100) : 100}%`,
            background: isWithinGeofence
              ? 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)'
              : 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)',
            borderRadius: 999,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Preset simulation & demo switcher */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={16} color="#1e40af" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              Mode Pengujian & Simulasi Lokasi (Demo PTPN IV)
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Gunakan untuk pengujian saat berada di luar lokasi kantor
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 10,
        }}>
          {SIMULATION_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: isSelected
                    ? '1.5px solid #2563eb'
                    : '1px solid #e2e8f0',
                  background: isSelected
                    ? '#eff6ff'
                    : '#ffffff',
                  color: isSelected ? '#1e40af' : '#475569',
                  boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#1e40af' : '#0f172a', marginBottom: 2 }}>
                  {preset.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: isSelected ? '#3b82f6' : '#64748b' }}>
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
