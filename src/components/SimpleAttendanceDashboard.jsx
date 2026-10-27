import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Building2, Camera, MapPin, Navigation, CheckCircle2, XCircle, LogOut,
  RefreshCw, Check, Sparkles, Calendar, Clock, History, AlertTriangle, Eye, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PTPN_LOCATION } from '../constants/ptpnConfig';
import { calculateHaversineDistance, isWithinGeofence, formatDistance, formatCoordinates } from '../utils/geoUtils';
import { captureWithWatermark } from '../utils/watermarkUtils';
import { getAttendanceLogs, saveAttendanceLog, getLocalLogs } from '../utils/storageUtils';

export function SimpleAttendanceDashboard({ currentUser, onLogout }) {
  // Ambil riwayat absen khusus untuk user yang sedang login (sync initial dari local, async dari Supabase)
  const [logs, setLogs] = useState(() => getLocalLogs(currentUser.username));
  const [successModal, setSuccessModal] = useState(null);
  const [viewPhotoModal, setViewPhotoModal] = useState(null);

  // Sinkronkan data kehadiran dari Supabase saat komponen dibuka
  useEffect(() => {
    let isMounted = true;
    async function loadLogs() {
      try {
        const remoteLogs = await getAttendanceLogs(currentUser.username);
        if (isMounted && remoteLogs && remoteLogs.length > 0) {
          setLogs(remoteLogs);
        }
      } catch (e) {
        console.warn('Error fetching logs from Supabase:', e);
      }
    }
    loadLogs();
    return () => { isMounted = false; };
  }, [currentUser.username]);

  // Status GPS Riil Asli Perangkat
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);
  const [userAccuracy, setUserAccuracy] = useState(null);
  const [allowedRadius] = useState(250); // Radius resmi kantor PTPN IV (250m)
  const [isLoadingGps, setIsLoadingGps] = useState(true);
  const [gpsError, setGpsError] = useState(null);

  // Kamera
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deteksi GPS Riil Otomatis saat halaman dibuka
  const detectRealGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Browser atau perangkat Anda tidak mendukung fitur Geolocation/GPS.');
      setIsLoadingGps(false);
      return;
    }

    setIsLoadingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setUserAccuracy(pos.coords.accuracy);
        setIsLoadingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        let msg = 'Gagal mendeteksi lokasi GPS.';
        if (err.code === 1) {
          msg = 'Izin lokasi belum diberikan. Silakan izinkan akses lokasi (GPS) pada browser Anda.';
        } else if (err.code === 2) {
          msg = 'Sinyal GPS tidak terdeteksi. Pastikan GPS/Lokasi perangkat Anda aktif.';
        } else if (err.code === 3) {
          msg = 'Waktu permintaan GPS habis. Coba klik tombol "Perbarui GPS".';
        }
        setGpsError(msg);
        setIsLoadingGps(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Jalankan pembacaan GPS dan Kamera saat pertama kali masuk
  useEffect(() => {
    detectRealGPS();

    // Pantau pergerakan GPS secara langsung (watchPosition)
    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          setUserAccuracy(pos.coords.accuracy);
          setIsLoadingGps(false);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [detectRealGPS]);

  // Perhitungan Jarak Real-time menggunakan GPS Asli
  const distanceMeters = (userLat !== null && userLng !== null)
    ? calculateHaversineDistance(userLat, userLng, PTPN_LOCATION.latitude, PTPN_LOCATION.longitude)
    : Infinity;

  const isInGeofence = isWithinGeofence(distanceMeters, allowedRadius);

  // Buka kamera saat halaman dibuka
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error(err);
      setCameraError('Izin kamera belum aktif. Pastikan kamera diizinkan pada browser Anda.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Cek apakah hari ini sudah pernah absen
  const todayDateString = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const alreadyAttendedToday = logs.some(l => l.tanggal.includes(todayDateString));

  // Ambil Foto & Submit Absen Tunggal Harian
  const handleCaptureAndSubmit = () => {
    if (!videoRef.current) return;

    if (userLat === null || userLng === null) {
      alert('Lokasi GPS belum terdeteksi. Harap tunggu sinyal GPS atau klik "Perbarui GPS".');
      return;
    }

    if (!isInGeofence) {
      alert(`❌ Absensi Ditolak! Anda terdeteksi berada di luar area kantor PTPN IV Regional 3.\nJarak saat ini: ${formatDistance(distanceMeters)} (Batas maksimal: ${allowedRadius} meter).`);
      return;
    }

    setIsSubmitting(true);

    // Ambil foto dengan watermark resmi berbasis koordinat riil perangkat
    const photoDataUrl = captureWithWatermark(videoRef.current, {
      internName: currentUser.nama,
      internNim: currentUser.username,
      attendanceType: 'Hadir',
      lat: userLat,
      lng: userLng,
      distanceMeters: distanceMeters,
      isValidGeofence: isInGeofence,
    });

    setCapturedPhoto(photoDataUrl);

    const now = new Date();
    const dayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
    const fullDate = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    const newLog = {
      id: `att-${Date.now()}`,
      hari: dayName,
      tanggal: fullDate,
      jam: timeString,
      status: 'Hadir (Area PTPN IV)',
      koordinat: `${userLat.toFixed(6)}, ${userLng.toFixed(6)}`,
      lat: userLat,
      lng: userLng,
      jarak: formatDistance(distanceMeters),
      lokasiValid: true,
      internName: currentUser.nama,
      username: currentUser.username,
      fotoUrl: photoDataUrl,
    };

    setTimeout(async () => {
      try {
        await saveAttendanceLog(newLog);
        // Refresh riwayat presensi dari Supabase (atau fallback lokal)
        const updatedLogs = await getAttendanceLogs(currentUser.username);
        setLogs(updatedLogs);
      } catch (e) {
        console.warn('Gagal sinkron log:', e);
      }
      setIsSubmitting(false);
      setSuccessModal(newLog);

      // Confetti efek selebrasi
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#1e3a8a', '#2563eb', '#60a5fa', '#ffffff'],
      });
    }, 500);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* 1. HEADER */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
      }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          {/* Logo & Info Perusahaan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Building2 size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                SIA-MAGANG PTPN IV
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Regional 3 Pekanbaru • Jl. Rambutan No. 43
              </div>
            </div>
          </div>

          {/* Info Peserta Magang & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                {currentUser.nama}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#1e40af' }}>
                {currentUser.bagianMagang}
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#dc2626',
                fontSize: '0.8rem',
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

      {/* 2. KONTEN UTAMA */}
      <main style={{ maxWidth: 960, margin: '0 auto', width: '100%', padding: '20px 16px', flex: 1 }}>
        {/* Banner Profil Singkat */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Data Peserta Magang:</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{currentUser.nama}</div>
            <div style={{ fontSize: '0.8rem', color: '#1e40af' }}>
              Jurusan: <strong>{currentUser.jurusan}</strong> • Bagian: <strong>{currentUser.bagianMagang}</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
              Mentor: {currentUser.namaMentor}
            </div>
          </div>

          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '8px 14px',
            borderRadius: 10,
            textAlign: 'right',
          }}>
            <div style={{ fontSize: '0.7rem', color: '#1e40af', fontWeight: 700 }}>AREA KANTOR WAJIB</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>PTPN IV Regional 3</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Batas Radius: 250 Meter</div>
          </div>
        </div>

        {/* Notifikasi jika sudah absen hari ini */}
        {alreadyAttendedToday && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 12,
            padding: '10px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#065f46',
            fontSize: '0.82rem',
          }}>
            <CheckCircle2 size={18} color="#059669" />
            <div>
              <strong>Anda sudah melakukan absensi untuk hari ini ({todayDateString})!</strong> Riwayat telah tercatat pada tabel di bawah.
            </div>
          </div>
        )}

        {/* Grid: 2 Kolom (Kamera Tampak Muka & Status Lokasi GPS Riil) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 24 }}>
          
          {/* KOTAK 1: KAMERA TAMPAK MUKA */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '18px',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={18} color="#1e3a8a" />
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Tampak Muka (Kamera Selfie)
                </h2>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Posisikan Wajah</span>
            </div>

            {/* Video Viewport */}
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 3',
              background: '#0a1128',
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #cbd5e1',
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />

              {/* Panduan Oval Tampak Wajah */}
              <div style={{
                position: 'absolute',
                width: '60%',
                height: '75%',
                border: '2px dashed rgba(96, 165, 250, 0.85)',
                borderRadius: '50%',
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(10, 17, 40, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: 'rgba(15, 23, 42, 0.75)',
                  padding: '3px 8px',
                  borderRadius: 16,
                }}>
                  Posisikan Wajah
                </span>
              </div>

              {cameraError && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#0a1128',
                  color: '#f87171',
                  padding: 16,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                }}>
                  <AlertTriangle size={28} style={{ marginBottom: 6 }} />
                  <span>{cameraError}</span>
                  <button
                    onClick={startCamera}
                    type="button"
                    style={{
                      marginTop: 10,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#1e3a8a',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Buka Kamera Lagi
                  </button>
                </div>
              )}
            </div>

            {/* Tombol Ambil Foto & Catat Kehadiran Tunggal */}
            <button
              type="button"
              onClick={handleCaptureAndSubmit}
              disabled={isSubmitting || !isInGeofence || userLat === null}
              style={{
                marginTop: 14,
                width: '100%',
                padding: '13px',
                borderRadius: 10,
                border: 'none',
                background: isInGeofence && userLat !== null
                  ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
                  : '#cbd5e1',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: isInGeofence && userLat !== null ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: isInGeofence && userLat !== null ? '0 4px 12px rgba(30, 58, 138, 0.25)' : 'none',
              }}
            >
              <Camera size={18} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Ambil Foto & Catat Kehadiran Hari Ini'}</span>
            </button>
          </div>

          {/* KOTAK 2: STATUS DETEKSI LOKASI GPS RIIL */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '18px',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Navigation size={18} color="#1e3a8a" />
                  <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Lokasi GPS Anda Saat Ini
                  </h2>
                </div>

                {/* Tombol Refresh GPS */}
                <button
                  type="button"
                  onClick={detectRealGPS}
                  disabled={isLoadingGps}
                  title="Perbarui GPS"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#1e40af',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={12} className={isLoadingGps ? 'spin' : ''} />
                  <span>{isLoadingGps ? 'Mendeteksi...' : 'Perbarui GPS'}</span>
                </button>
              </div>

              {/* Titik Kantor Acuan Wajib */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '12px',
                marginBottom: 12,
              }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Titik Acuan Lokasi Resmi:</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  Kantor Direksi PTPN IV Regional 3
                </div>
                <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                  Jl. Rambutan No. 43, Pekanbaru, Riau
                </div>
                <div style={{ fontSize: '0.7rem', color: '#1e40af', marginTop: 4 }}>
                  Koordinat: 0.470142, 101.426221
                </div>
              </div>

              {/* Status GPS Terdeteksi */}
              {isLoadingGps ? (
                <div style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: 10,
                  border: '1px dashed #cbd5e1',
                  color: '#64748b',
                  fontSize: '0.82rem',
                }}>
                  <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px', color: '#2563eb' }} />
                  <div>Sedang mendeteksi sinyal GPS perangkat Anda...</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                    Pastikan Anda telah menyetujui izin lokasi di browser
                  </div>
                </div>
              ) : gpsError ? (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  padding: '14px',
                  color: '#991b1b',
                  fontSize: '0.8rem',
                }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AlertTriangle size={15} />
                    <span>Perhatian GPS:</span>
                  </div>
                  <div>{gpsError}</div>
                  <button
                    type="button"
                    onClick={detectRealGPS}
                    style={{
                      marginTop: 10,
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Coba Deteksi GPS Lagi
                  </button>
                </div>
              ) : (
                /* Tampilan Jarak dan Validasi Geofence */
                <div style={{
                  background: isInGeofence ? '#eff6ff' : '#fef2f2',
                  border: `1px solid ${isInGeofence ? '#bfdbfe' : '#fecaca'}`,
                  borderRadius: 10,
                  padding: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isInGeofence ? '#1e40af' : '#991b1b' }}>
                      Jarak dari Kantor PTPN IV:
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: isInGeofence ? '#ecfdf5' : '#fee2e2',
                      color: isInGeofence ? '#065f46' : '#991b1b',
                      border: `1px solid ${isInGeofence ? '#a7f3d0' : '#fca5a5'}`,
                    }}>
                      {isInGeofence ? 'DI DALAM RADIUS' : 'DILUAR RADIUS'}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: isInGeofence ? '#0f172a' : '#dc2626', lineHeight: 1.1 }}>
                    {formatDistance(distanceMeters)}
                  </div>

                  <div style={{ fontSize: '0.76rem', color: isInGeofence ? '#1e40af' : '#b91c1c', marginTop: 6, lineHeight: 1.3 }}>
                    {isInGeofence
                      ? '✅ Anda berada di dalam area kantor (≤ 250m). Tombol absensi aktif.'
                      : `❌ Anda berjarak ${formatDistance(distanceMeters)} dari kantor. Absensi hanya dapat dilakukan jika berada di area kantor PTPN IV Regional 3.`}
                  </div>

                  <div style={{
                    marginTop: 10,
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    background: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: `1px solid ${isInGeofence ? '#bfdbfe' : '#fecaca'}`,
                    display: 'inline-block',
                    color: '#0f172a',
                  }}>
                    📡 GPS Riil: {formatCoordinates(userLat, userLng)}
                    {userAccuracy && ` (Akurasi: ±${Math.round(userAccuracy)}m)`}
                  </div>
                </div>
              )}
            </div>

            {/* Catatan Bantuan */}
            <div style={{
              marginTop: 12,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: '0.74rem',
              color: '#64748b',
              lineHeight: 1.4,
            }}>
              💡 <strong>Absen 1 Kali Sehari:</strong> Presensi dicatat sekali per hari kerja sebagai bukti kehadiran resmi mahasiswa magang di PTPN IV Regional 3.
            </div>
          </div>
        </div>

        {/* 3. RIWAYAT HARI-HARI MASUK MAGANG */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '20px',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
        }}>
          {/* Header Riwayat & Statistik Hari Masuk */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: 14,
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Calendar size={18} color="#1e3a8a" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Riwayat Hari Masuk Magang
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  Daftar rekap kehadiran peserta: <strong>{currentUser.nama}</strong>
                </p>
              </div>
            </div>

            {/* Badge Total Hari Hadir */}
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '6px 14px',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 600 }}>Total Kehadiran:</span>
              <strong style={{ fontSize: '0.95rem', color: '#1e3a8a' }}>{logs.length} Hari Masuk</strong>
            </div>
          </div>

          {/* Tabel Riwayat Kehadiran */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 12px', width: '50px' }}>No</th>
                  <th style={{ padding: '10px 12px' }}>Hari & Tanggal Masuk</th>
                  <th style={{ padding: '10px 12px' }}>Jam Hadir</th>
                  <th style={{ padding: '10px 12px' }}>Status Lokasi</th>
                  <th style={{ padding: '10px 12px' }}>Jarak GPS</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Foto Selfie</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      Belum ada catatan hari masuk magang.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Nomor */}
                      <td style={{ padding: '12px', color: '#64748b', fontWeight: 600 }}>
                        {index + 1}
                      </td>

                      {/* Hari & Tanggal */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {log.tanggal}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 600 }}>
                          Hari {log.hari || 'Kerja'}
                        </div>
                      </td>

                      {/* Jam Masuk */}
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#0f172a',
                          fontWeight: 600,
                        }}>
                          <Clock size={13} color="#2563eb" />
                          <span>{log.jam}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: '#ecfdf5',
                          color: '#065f46',
                          border: '1px solid #a7f3d0',
                        }}>
                          ✅ Hadir
                        </span>
                      </td>

                      {/* Jarak GPS */}
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        <div>{log.jarak}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {log.koordinat}
                        </div>
                      </td>

                      {/* Bukti Foto */}
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

      {/* MODAL 1: SUKSES PRESENSI HARI INI */}
      {successModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 18,
            padding: '24px',
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
            border: '1px solid #cbd5e1',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#ecfdf5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
              <CheckCircle2 size={32} color="#059669" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              Kehadiran Berhasil Dicatat!
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px' }}>
              Presensi masuk Anda untuk <strong>{successModal.tanggal}</strong> telah tersimpan di sistem PTPN IV Regional 3.
            </p>

            {/* Preview Foto Selfie Ber-Watermark */}
            {successModal.fotoUrl && (
              <div style={{ marginBottom: 16, borderRadius: 10, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <img
                  src={successModal.fotoUrl}
                  alt="Bukti Selfie"
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setSuccessModal(null)}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 8,
                background: '#1e3a8a',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: LIHAT FOTO SELFIE WATERMARK */}
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
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                Bukti Foto Presensi: {viewPhotoModal.tanggal}
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
              <span>Waktu: <strong>{viewPhotoModal.jam}</strong></span>
              <span>Lokasi: <strong>{viewPhotoModal.jarak} dari Kantor</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
