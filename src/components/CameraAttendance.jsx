import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, FlipHorizontal, Check, AlertTriangle, ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { captureWithWatermark } from '../utils/watermarkUtils';
import { formatDistance, formatCoordinates } from '../utils/geoUtils';

export function CameraAttendance({
  internProfile,
  userLat,
  userLng,
  distanceMeters,
  isWithinGeofence,
  onSubmitAttendance,
}) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [attendanceType, setAttendanceType] = useState('Masuk'); // 'Masuk' | 'Pulang'
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  // Inisialisasi kamera
  const startCamera = async (mode = facingMode) => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Tidak dapat mengakses kamera. Harap pastikan izin kamera telah diizinkan di browser Anda.');
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  // Switch depan / belakang
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  // Ambil foto selfie
  const handleCapture = () => {
    if (!videoRef.current) return;

    // Trigger flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const watermarkedDataUrl = captureWithWatermark(videoRef.current, {
      internName: internProfile.nama,
      internNim: internProfile.nim,
      attendanceType: attendanceType,
      lat: userLat || 0,
      lng: userLng || 0,
      distanceMeters: distanceMeters,
      isValidGeofence: isWithinGeofence,
    });

    if (watermarkedDataUrl) {
      setCapturedPhoto(watermarkedDataUrl);
    }
  };

  // Ulangi ambil foto
  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera(facingMode);
  };

  // Konfirmasi submit absensi
  const handleConfirmAttendance = () => {
    if (!capturedPhoto) return;
    if (!isWithinGeofence) {
      alert('Maaf, absensi gagal! Posisi Anda berada di luar area kantor PTPN IV Regional 3. Silakan pastikan Anda berada di area kantor atau pilih Preset Simulasi untuk keperluan demo.');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const entry = {
      id: `att-${Date.now()}`,
      tanggal: now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      jam: now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB',
      tipe: attendanceType,
      status: isWithinGeofence ? 'Terverifikasi' : 'Di Luar Radius',
      koordinat: `${userLat.toFixed(6)}, ${userLng.toFixed(6)}`,
      jarak: formatDistance(distanceMeters),
      lokasiValid: isWithinGeofence,
      catatan: notes.trim() || `Presensi ${attendanceType} harian peserta magang`,
      fotoUrl: capturedPhoto,
      internName: internProfile.nama,
      internNim: internProfile.nim,
      divisi: internProfile.divisi,
    };

    setTimeout(() => {
      onSubmitAttendance(entry);
      setIsSubmitting(false);
      setCapturedPhoto(null);
      setNotes('');
    }, 600);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Camera size={20} color="#2563eb" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Kamera Presensi Selfie & Watermark
          </h2>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Deteksi Wajah & Koordinat Otomatis
        </div>
      </div>

      {/* Tipe Absensi Selector */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        marginBottom: 16,
      }}>
        <button
          type="button"
          onClick={() => setAttendanceType('Masuk')}
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: attendanceType === 'Masuk' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            background: attendanceType === 'Masuk' ? '#eff6ff' : '#f8fafc',
            color: attendanceType === 'Masuk' ? '#1e40af' : '#64748b',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: attendanceType === 'Masuk' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <Sparkles size={16} color={attendanceType === 'Masuk' ? '#2563eb' : 'currentColor'} />
          <span>Absen Masuk (Check-In)</span>
        </button>

        <button
          type="button"
          onClick={() => setAttendanceType('Pulang')}
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: attendanceType === 'Pulang' ? '2px solid #1e3a8a' : '1px solid #e2e8f0',
            background: attendanceType === 'Pulang' ? '#eff6ff' : '#f8fafc',
            color: attendanceType === 'Pulang' ? '#1e3a8a' : '#64748b',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: attendanceType === 'Pulang' ? '0 2px 8px rgba(30, 58, 138, 0.15)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <ShieldCheck size={16} color={attendanceType === 'Pulang' ? '#1e3a8a' : 'currentColor'} />
          <span>Absen Pulang (Check-Out)</span>
        </button>
      </div>

      {/* Camera Viewport Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4 / 3',
        maxHeight: '460px',
        background: '#0a1128',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.12)',
      }}>
        {/* Flash Effect on shutter */}
        {isFlashing && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: '#ffffff',
            zIndex: 30,
            opacity: 0.85,
            transition: 'opacity 0.2s ease-out',
          }} />
        )}

        {/* Live Video or Captured Photo Preview */}
        {!capturedPhoto ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />

            {/* Moving Scanner Laser Line */}
            <div className="scanner-laser" />

            {/* Semi-transparent Oval Face Guide */}
            <div style={{
              position: 'absolute',
              width: '60%',
              height: '75%',
              border: '2px dashed rgba(96, 165, 250, 0.85)',
              borderRadius: '50%',
              pointerEvents: 'none',
              boxShadow: '0 0 0 9999px rgba(10, 17, 40, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 600,
                textAlign: 'center',
                padding: '4px 10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 20,
              }}>
                Posisikan Wajah di Sini
              </span>
            </div>

            {/* HUD Corner Brackets */}
            <div style={{ position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderTop: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderTop: '3px solid #3b82f6', borderRight: '3px solid #3b82f6', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 16, left: 16, width: 24, height: 24, borderBottom: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 16, right: 16, width: 24, height: 24, borderBottom: '3px solid #3b82f6', borderRight: '3px solid #3b82f6', pointerEvents: 'none' }} />

            {/* Live Camera Overlay HUD Badge */}
            <div style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>
                  {internProfile.nama} • {internProfile.nim}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: '#93c5fd',
                }}>
                  GPS: {formatCoordinates(userLat, userLng)}
                </div>
              </div>

              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: isWithinGeofence ? '#34d399' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span className={isWithinGeofence ? 'pulse-indicator' : 'pulse-indicator pulse-red'} />
                <span>{isWithinGeofence ? `${Math.round(distanceMeters)}m (Valid)` : `${Math.round(distanceMeters)}m (Di Luar)`}</span>
              </div>
            </div>

            {/* Switch Camera Button (Front / Back) */}
            <button
              type="button"
              onClick={toggleCameraFacing}
              title="Putar Kamera Depan/Belakang"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
              }}
            >
              <FlipHorizontal size={18} />
            </button>
          </>
        ) : (
          /* Preview captured photo with official watermark */
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src={capturedPhoto}
              alt="Bukti Selfie Absensi"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: '#1e3a8a',
              color: '#ffffff',
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}>
              <Check size={14} />
              <span>Foto Siap Disimpan</span>
            </div>
          </div>
        )}

        {/* Camera Error fallback */}
        {cameraError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            gap: 12,
          }}>
            <AlertTriangle size={36} color="#f87171" />
            <p style={{ color: '#f87171', fontSize: '0.9rem' }}>{cameraError}</p>
            <button
              onClick={() => startCamera(facingMode)}
              type="button"
              className="btn btn-secondary"
            >
              <RefreshCw size={14} />
              <span>Coba Buka Kamera Lagi</span>
            </button>
          </div>
        )}
      </div>

      {/* Input Catatan Kegiatan Ringkas */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <FileText size={15} color="#2563eb" />
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
            Catatan Ringkas Aktivitas / Agenda Hari Ini:
          </label>
        </div>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: Mengikuti pendampingan divisi TI, konfigurasi server database presensi..."
          style={{
            width: '100%',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            color: '#0f172a',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-sans)',
            resize: 'none',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#2563eb';
            e.target.style.background = '#ffffff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#cbd5e1';
            e.target.style.background = '#f8fafc';
          }}
        />
      </div>

      {/* Geofence Alert Warning if Outside */}
      {!isWithinGeofence && (
        <div style={{
          marginTop: 14,
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.82rem', color: '#991b1b', lineHeight: 1.4 }}>
            <strong>Peringatan Titik Lokasi:</strong> Posisi Anda saat ini berjarak <strong>{formatDistance(distanceMeters)}</strong> dari kantor PTPN IV Regional 3. Absensi hanya dapat dikonfirmasi bila Anda berada di dalam radius resmi kantor (≤ 250m). Silakan gunakan <em>Mode Simulasi Lokasi</em> di kartu geofencing untuk pengujian.
          </div>
        </div>
      )}

      {/* Actions: Shutter or Retake/Submit */}
      <div style={{ marginTop: 20 }}>
        {!capturedPhoto ? (
          <button
            type="button"
            onClick={handleCapture}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              fontWeight: 700,
              gap: 10,
            }}
          >
            <Camera size={20} />
            <span>Ambil Foto Selfie Presensi</span>
          </button>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <button
              type="button"
              onClick={handleRetake}
              className="btn btn-secondary"
              style={{ padding: '14px' }}
            >
              <RefreshCw size={16} />
              <span>Foto Ulang</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmAttendance}
              disabled={isSubmitting || !isWithinGeofence}
              className="btn btn-primary"
              style={{
                padding: '14px',
                fontSize: '1rem',
                opacity: !isWithinGeofence ? 0.6 : 1,
              }}
            >
              <Check size={18} />
              <span>{isSubmitting ? 'Memproses...' : `Konfirmasi Absen ${attendanceType}`}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
