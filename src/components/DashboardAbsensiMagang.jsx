import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Building2, Camera, MapPin, Navigation, CheckCircle2, XCircle, LogOut,
  RefreshCw, Check, Sparkles, Calendar, Clock, History, AlertTriangle, Eye, X,
  Sunrise, Sunset, Sun, ArrowRight, ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PTPN_LOCATION } from '../constants/ptpnConfig';
import { calculateHaversineDistance, isWithinGeofence, formatDistance, formatCoordinates } from '../utils/geoUtils';
import { captureWithWatermark } from '../utils/watermarkUtils';
import { getAttendanceLogs, saveAttendanceLog, getLocalLogs } from '../utils/storageUtils';

export function DashboardAbsensiMagang({ currentUser, onLogout }) {
  // Ambil riwayat absen khusus untuk user yang sedang login (sync initial dari local, async dari Supabase)
  const [logs, setLogs] = useState(() => getLocalLogs(currentUser.username));
  const [successModal, setSuccessModal] = useState(null);
  const [viewPhotoModal, setViewPhotoModal] = useState(null);

  // Mode absensi yang dipilih: 'Masuk' (Pagi) atau 'Pulang' (Sore)
  const [attendanceType, setAttendanceType] = useState('Masuk');
  // Filter tampilan riwayat: 'Semua' | 'Masuk' | 'Pulang'
  const [historyFilter, setHistoryFilter] = useState('Semua');

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

  // Format tanggal hari ini
  const todayRaw = new Date().toISOString().slice(0, 10); // format YYYY-MM-DD
  const todayDayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  const todayDateString = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const todayShortDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Pencocokan log kehadiran hari ini
  const isLogToday = (l) => {
    if (l.rawTanggal && l.rawTanggal === todayRaw) return true;
    if (l.tanggal) {
      if (l.tanggal.includes(todayRaw)) return true;
      if (l.tanggal.includes(todayShortDate)) return true;
    }
    return false;
  };

  const todayLogs = logs.filter(isLogToday);
  const logMasukHariIni = todayLogs.find(l => (l.tipe || '').toLowerCase() === 'masuk');
  const logPulangHariIni = todayLogs.find(l => (l.tipe || '').toLowerCase() === 'pulang');

  const sudahAbsenMasuk = !!logMasukHariIni;
  const sudahAbsenPulang = !!logPulangHariIni;
  const sudahLengkapHariIni = sudahAbsenMasuk && sudahAbsenPulang;

  // Auto-switch mode yang tepat saat komponen aktif / data terisi
  useEffect(() => {
    if (sudahAbsenMasuk && !sudahAbsenPulang) {
      setAttendanceType('Pulang');
    } else if (!sudahAbsenMasuk) {
      setAttendanceType('Masuk');
    }
  }, [sudahAbsenMasuk, sudahAbsenPulang]);

  // Submit Presensi (Pagi Masuk / Sore Pulang)
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

    if (attendanceType === 'Masuk' && sudahAbsenMasuk) {
      alert(`Anda sudah melakukan Absen Masuk (Pagi) hari ini pukul ${logMasukHariIni.jam}.\nSilakan beralih ke "Absen Pulang (Sore)" saat jam kepulangan.`);
      return;
    }

    if (attendanceType === 'Pulang' && sudahAbsenPulang) {
      alert(`Anda sudah melakukan Absen Pulang (Sore) hari ini pukul ${logPulangHariIni.jam}.`);
      return;
    }

    setIsSubmitting(true);

    // Label watermark foto: MASUK (PAGI) atau PULANG (SORE)
    const typeLabel = attendanceType === 'Pulang' ? 'PULANG (SORE)' : 'MASUK (PAGI)';

    // Ambil foto dengan watermark resmi berbasis koordinat riil perangkat
    const photoDataUrl = captureWithWatermark(videoRef.current, {
      internName: currentUser.nama,
      internNim: currentUser.username,
      attendanceType: typeLabel,
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
      tipe: attendanceType,
      hari: dayName,
      tanggal: fullDate,
      rawTanggal: todayRaw,
      jam: timeString,
      status: `${attendanceType === 'Pulang' ? 'Pulang (Sore)' : 'Masuk (Pagi)'} • Hadir (Area PTPN IV)`,
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
        colors: attendanceType === 'Pulang'
          ? ['#d97706', '#f59e0b', '#1e3a8a', '#ffffff']
          : ['#1e3a8a', '#2563eb', '#10b981', '#ffffff'],
      });
    }, 500);
  };

  // Filter logs untuk tabel riwayat
  const filteredLogs = logs.filter(l => {
    if (historyFilter === 'Semua') return true;
    return (l.tipe || '').toLowerCase() === historyFilter.toLowerCase();
  });

  const totalMasuk = logs.filter(l => (l.tipe || '').toLowerCase() === 'masuk').length;
  const totalPulang = logs.filter(l => (l.tipe || '').toLowerCase() === 'pulang').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* 1. HEADER UTAMA */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 16px',
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
          gap: 10,
        }}>
          {/* Logo & Info Perusahaan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Building2 size={19} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                SIA-MAGANG PTPN IV
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Regional 3 Pekanbaru
              </div>
            </div>
          </div>

          {/* Info Peserta Magang & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="desktop-only" style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                {currentUser.nama}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#1e40af' }}>
                {currentUser.bagianMagang}
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#dc2626',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <LogOut size={14} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. KONTEN UTAMA */}
      <main style={{ maxWidth: 960, margin: '0 auto', width: '100%', padding: '16px 14px', flex: 1 }}>
        {/* Banner Profil Singkat Mahasiswa */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '16px',
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ flex: '1 1 240px' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Data Peserta Magang:</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>{currentUser.nama}</div>
            <div style={{ fontSize: '0.8rem', color: '#1e40af' }}>
              Jurusan: <strong>{currentUser.jurusan}</strong> • Bagian: <strong>{currentUser.bagianMagang}</strong>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
              Mentor: {currentUser.namaMentor}
            </div>
          </div>

          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '8px 12px',
            borderRadius: 10,
            flex: '0 1 auto',
          }}>
            <div style={{ fontSize: '0.68rem', color: '#1e40af', fontWeight: 700 }}>AREA KANTOR WAJIB</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>PTPN IV Regional 3</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Batas Radius: 250 Meter</div>
          </div>
        </div>

        {/* STATUS PRESENSI HARI INI (PAGI & SORE) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}>
          {/* KARTU 1: STATUS ABSEN MASUK (PAGI) */}
          <div
            onClick={() => {
              if (!sudahAbsenMasuk) setAttendanceType('Masuk');
            }}
            style={{
              background: sudahAbsenMasuk ? '#f0fdf4' : (attendanceType === 'Masuk' ? '#eff6ff' : '#ffffff'),
              border: `1.5px solid ${
                sudahAbsenMasuk
                  ? '#86efac'
                  : (attendanceType === 'Masuk' ? '#2563eb' : '#e2e8f0')
              }`,
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: attendanceType === 'Masuk' && !sudahAbsenMasuk
                ? '0 4px 14px rgba(37, 99, 235, 0.15)'
                : '0 2px 6px rgba(15, 23, 42, 0.04)',
              cursor: !sudahAbsenMasuk ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: sudahAbsenMasuk ? '#dcfce7' : '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Sunrise size={18} color={sudahAbsenMasuk ? '#16a34a' : '#1e40af'} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                    Absen Masuk (Pagi)
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Kedatangan di Kantor
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <span style={{
                padding: '3px 9px',
                borderRadius: 999,
                fontSize: '0.72rem',
                fontWeight: 700,
                background: sudahAbsenMasuk ? '#ecfdf5' : '#f1f5f9',
                color: sudahAbsenMasuk ? '#065f46' : '#64748b',
                border: `1px solid ${sudahAbsenMasuk ? '#a7f3d0' : '#cbd5e1'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                {sudahAbsenMasuk ? <CheckCircle2 size={12} color="#059669" /> : <Clock size={12} />}
                <span>{sudahAbsenMasuk ? 'Sudah Tercatat' : 'Belum Absen'}</span>
              </span>
            </div>

            {sudahAbsenMasuk ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.76rem',
                color: '#166534',
                paddingTop: 6,
                borderTop: '1px dashed #bbf7d0',
                marginTop: 6,
              }}>
                <div>
                  Tercatat: <strong>{logMasukHariIni.jam}</strong> ({logMasukHariIni.jarak})
                </div>
                {logMasukHariIni.fotoUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewPhotoModal(logMasukHariIni);
                    }}
                    style={{
                      background: '#dcfce7',
                      border: '1px solid #86efac',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#15803d',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <Eye size={11} />
                    <span>Lihat Foto</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.74rem',
                color: attendanceType === 'Masuk' ? '#1e40af' : '#64748b',
                paddingTop: 6,
                borderTop: '1px dashed #cbd5e1',
                marginTop: 6,
              }}>
                <span>{attendanceType === 'Masuk' ? '👉 Sedang dipilih di kamera' : 'Klik kartu ini untuk Absen Masuk'}</span>
                {attendanceType !== 'Masuk' && (
                  <span style={{ fontWeight: 700, color: '#2563eb' }}>Pilih Mode</span>
                )}
              </div>
            )}
          </div>

          {/* KARTU 2: STATUS ABSEN PULANG (SORE) */}
          <div
            onClick={() => {
              if (!sudahAbsenPulang) setAttendanceType('Pulang');
            }}
            style={{
              background: sudahAbsenPulang ? '#f0fdf4' : (attendanceType === 'Pulang' ? '#fffbeb' : '#ffffff'),
              border: `1.5px solid ${
                sudahAbsenPulang
                  ? '#86efac'
                  : (attendanceType === 'Pulang' ? '#d97706' : '#e2e8f0')
              }`,
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: attendanceType === 'Pulang' && !sudahAbsenPulang
                ? '0 4px 14px rgba(217, 119, 6, 0.18)'
                : '0 2px 6px rgba(15, 23, 42, 0.04)',
              cursor: !sudahAbsenPulang ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: sudahAbsenPulang ? '#dcfce7' : '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Sunset size={18} color={sudahAbsenPulang ? '#16a34a' : '#d97706'} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                    Absen Pulang (Sore)
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Kepulangan Selesai Magang
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <span style={{
                padding: '3px 9px',
                borderRadius: 999,
                fontSize: '0.72rem',
                fontWeight: 700,
                background: sudahAbsenPulang ? '#ecfdf5' : '#f1f5f9',
                color: sudahAbsenPulang ? '#065f46' : '#64748b',
                border: `1px solid ${sudahAbsenPulang ? '#a7f3d0' : '#cbd5e1'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                {sudahAbsenPulang ? <CheckCircle2 size={12} color="#059669" /> : <Clock size={12} />}
                <span>{sudahAbsenPulang ? 'Sudah Tercatat' : 'Belum Absen'}</span>
              </span>
            </div>

            {sudahAbsenPulang ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.76rem',
                color: '#166534',
                paddingTop: 6,
                borderTop: '1px dashed #bbf7d0',
                marginTop: 6,
              }}>
                <div>
                  Tercatat: <strong>{logPulangHariIni.jam}</strong> ({logPulangHariIni.jarak})
                </div>
                {logPulangHariIni.fotoUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewPhotoModal(logPulangHariIni);
                    }}
                    style={{
                      background: '#dcfce7',
                      border: '1px solid #86efac',
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#15803d',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <Eye size={11} />
                    <span>Lihat Foto</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.74rem',
                color: attendanceType === 'Pulang' ? '#b45309' : '#64748b',
                paddingTop: 6,
                borderTop: '1px dashed #cbd5e1',
                marginTop: 6,
              }}>
                <span>{attendanceType === 'Pulang' ? '👉 Sedang dipilih di kamera' : 'Klik kartu ini untuk Absen Pulang'}</span>
                {attendanceType !== 'Pulang' && (
                  <span style={{ fontWeight: 700, color: '#d97706' }}>Pilih Mode</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notifikasi Selebrasi Jika Sudah Lengkap Masuk & Pulang */}
        {sudahLengkapHariIni && (
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #e0f2fe 100%)',
            border: '1px solid #a7f3d0',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#065f46',
            fontSize: '0.84rem',
          }}>
            <Sparkles size={20} color="#059669" style={{ flexShrink: 0 }} />
            <div>
              <strong>Lengkap! Presensi Hari Ini ({todayDateString}) Telah Selesai:</strong>
              <div style={{ fontSize: '0.76rem', color: '#047857', marginTop: 2 }}>
                ✓ Masuk (Pagi): <strong>{logMasukHariIni.jam}</strong> • ✓ Pulang (Sore): <strong>{logPulangHariIni.jam}</strong>. Terima kasih atas dedikasi Anda!
              </div>
            </div>
          </div>
        )}

        {/* Grid: 2 Kolom Responsif (Kamera Tampak Muka & Status Lokasi GPS Riil) */}
        <div className="app-two-col-grid" style={{ marginBottom: 24 }}>
          
          {/* KOTAK 1: KAMERA TAMPAK MUKA */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '18px',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
          }}>
            {/* Header Kamera & Pilihan Mode Absen (Pagi vs Sore) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={18} color="#1e3a8a" />
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Kamera Selfie Presensi
                </h2>
              </div>

              {/* Segmented Control Pill: Pilihan Absen Masuk atau Pulang */}
              <div style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                gap: 2,
              }}>
                <button
                  type="button"
                  onClick={() => setAttendanceType('Masuk')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: attendanceType === 'Masuk' ? '#1e3a8a' : 'transparent',
                    color: attendanceType === 'Masuk' ? '#ffffff' : '#475569',
                  }}
                >
                  <Sunrise size={13} />
                  <span>Pagi (Masuk)</span>
                  {sudahAbsenMasuk && <Check size={11} color={attendanceType === 'Masuk' ? '#86efac' : '#16a34a'} />}
                </button>

                <button
                  type="button"
                  onClick={() => setAttendanceType('Pulang')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: attendanceType === 'Pulang' ? '#d97706' : 'transparent',
                    color: attendanceType === 'Pulang' ? '#ffffff' : '#475569',
                  }}
                >
                  <Sunset size={13} />
                  <span>Sore (Pulang)</span>
                  {sudahAbsenPulang && <Check size={11} color={attendanceType === 'Pulang' ? '#fef08a' : '#d97706'} />}
                </button>
              </div>
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

              {/* Watermark Tag Mode di Atas Kamera */}
              <div style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: attendanceType === 'Pulang' ? 'rgba(217, 119, 6, 0.88)' : 'rgba(30, 58, 138, 0.88)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.7rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                backdropFilter: 'blur(4px)',
                letterSpacing: '0.04em',
              }}>
                {attendanceType === 'Pulang' ? <Sunset size={12} /> : <Sunrise size={12} />}
                <span>MODE: ABSEN {attendanceType.toUpperCase()} ({attendanceType === 'Pulang' ? 'SORE' : 'PAGI'})</span>
              </div>

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

            {/* Tombol Ambil Foto & Catat Kehadiran (Dinamis: Masuk / Pulang) */}
            {attendanceType === 'Masuk' ? (
              <button
                type="button"
                onClick={handleCaptureAndSubmit}
                disabled={isSubmitting || !isInGeofence || userLat === null || sudahAbsenMasuk}
                style={{
                  marginTop: 14,
                  width: '100%',
                  padding: '13px',
                  borderRadius: 10,
                  border: 'none',
                  background: sudahAbsenMasuk
                    ? '#cbd5e1'
                    : (isInGeofence && userLat !== null
                        ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
                        : '#cbd5e1'),
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: (isInGeofence && userLat !== null && !sudahAbsenMasuk) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: (isInGeofence && userLat !== null && !sudahAbsenMasuk)
                    ? '0 4px 12px rgba(30, 58, 138, 0.25)'
                    : 'none',
                }}
              >
                {sudahAbsenMasuk ? (
                  <>
                    <CheckCircle2 size={18} color="#15803d" />
                    <span>Absen Masuk (Pagi) Sudah Dicatat ({logMasukHariIni?.jam})</span>
                  </>
                ) : (
                  <>
                    <Sunrise size={18} />
                    <span>{isSubmitting ? 'Menyimpan Absen Masuk...' : 'Ambil Foto & Catat Absen Masuk (Pagi)'}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCaptureAndSubmit}
                disabled={isSubmitting || !isInGeofence || userLat === null || sudahAbsenPulang}
                style={{
                  marginTop: 14,
                  width: '100%',
                  padding: '13px',
                  borderRadius: 10,
                  border: 'none',
                  background: sudahAbsenPulang
                    ? '#cbd5e1'
                    : (isInGeofence && userLat !== null
                        ? 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)'
                        : '#cbd5e1'),
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: (isInGeofence && userLat !== null && !sudahAbsenPulang) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: (isInGeofence && userLat !== null && !sudahAbsenPulang)
                    ? '0 4px 12px rgba(217, 119, 6, 0.28)'
                    : 'none',
                }}
              >
                {sudahAbsenPulang ? (
                  <>
                    <CheckCircle2 size={18} color="#15803d" />
                    <span>Absen Pulang (Sore) Sudah Dicatat ({logPulangHariIni?.jam})</span>
                  </>
                ) : (
                  <>
                    <Sunset size={18} />
                    <span>{isSubmitting ? 'Menyimpan Absen Pulang...' : 'Ambil Foto & Catat Absen Pulang (Sore)'}</span>
                  </>
                )}
              </button>
            )}

            {/* Hint jika mode yang dipilih sudah selesai */}
            {attendanceType === 'Masuk' && sudahAbsenMasuk && !sudahAbsenPulang && (
              <div style={{
                marginTop: 8,
                fontSize: '0.74rem',
                color: '#1e40af',
                textAlign: 'center',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              onClick={() => setAttendanceType('Pulang')}>
                👉 Ingin absen pulang sore? <u>Klik di sini untuk beralih ke Absen Pulang</u>
              </div>
            )}
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

            {/* Catatan Bantuan Sistem Pagi & Sore */}
            <div style={{
              marginTop: 12,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: '0.74rem',
              color: '#475569',
              lineHeight: 1.45,
            }}>
              💡 <strong>Presensi Masuk & Pulang:</strong>
              <div style={{ marginTop: 2, color: '#64748b' }}>
                • <strong>Pagi:</strong> Lakukan <em>Absen Masuk</em> saat tiba di area kantor PTPN IV.
                <br />
                • <strong>Sore:</strong> Lakukan <em>Absen Pulang</em> saat jam kerja magang berakhir.
              </div>
            </div>
          </div>
        </div>

        {/* 3. RIWAYAT HARI-HARI PRESENSI MAGANG */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '20px',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
        }}>
          {/* Header Riwayat, Filter, & Statistik */}
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
                  Riwayat Presensi Magang
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  Daftar rekap kehadiran masuk & pulang: <strong>{currentUser.nama}</strong>
                </p>
              </div>
            </div>

            {/* Filter Tabs & Counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                gap: 2,
              }}>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('Semua')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: historyFilter === 'Semua' ? '#1e3a8a' : 'transparent',
                    color: historyFilter === 'Semua' ? '#ffffff' : '#475569',
                  }}
                >
                  Semua ({logs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('Masuk')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: historyFilter === 'Masuk' ? '#1e3a8a' : 'transparent',
                    color: historyFilter === 'Masuk' ? '#ffffff' : '#475569',
                  }}
                >
                  <Sunrise size={12} />
                  <span>Masuk ({totalMasuk})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('Pulang')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: historyFilter === 'Pulang' ? '#d97706' : 'transparent',
                    color: historyFilter === 'Pulang' ? '#ffffff' : '#475569',
                  }}
                >
                  <Sunset size={12} />
                  <span>Pulang ({totalPulang})</span>
                </button>
              </div>
            </div>
          </div>

          {/* TAMPILAN DESKTOP: Tabel Riwayat Kehadiran */}
          <div className="desktop-table table-responsive">
            <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 12px', width: '45px' }}>No</th>
                  <th style={{ padding: '10px 12px' }}>Hari & Tanggal</th>
                  <th style={{ padding: '10px 12px' }}>Tipe Presensi</th>
                  <th style={{ padding: '10px 12px' }}>Jam</th>
                  <th style={{ padding: '10px 12px' }}>Status Lokasi</th>
                  <th style={{ padding: '10px 12px' }}>Jarak GPS</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Foto Selfie</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      Belum ada catatan presensi {historyFilter !== 'Semua' ? `(${historyFilter})` : ''}.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => {
                    const isPulang = (log.tipe || '').toLowerCase() === 'pulang';
                    return (
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
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Hari {log.hari || 'Kerja'}
                          </div>
                        </td>

                        {/* Tipe Presensi (Masuk vs Pulang) */}
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: isPulang ? '#fef3c7' : '#eff6ff',
                            color: isPulang ? '#92400e' : '#1e40af',
                            border: `1px solid ${isPulang ? '#fde68a' : '#bfdbfe'}`,
                          }}>
                            {isPulang ? <Sunset size={12} /> : <Sunrise size={12} />}
                            <span>{isPulang ? 'Pulang (Sore)' : 'Masuk (Pagi)'}</span>
                          </span>
                        </td>

                        {/* Jam Presensi */}
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#0f172a',
                            fontWeight: 600,
                          }}>
                            <Clock size={13} color={isPulang ? '#d97706' : '#2563eb'} />
                            <span>{log.jam}</span>
                          </span>
                        </td>

                        {/* Status */}
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
                            ✅ Hadir PTPN IV
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* TAMPILAN MOBILE: List Kartu Presensi Responsif untuk Layar HP */}
          <div className="mobile-only">
            {filteredLogs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                Belum ada catatan presensi.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredLogs.map((log) => {
                  const isPulang = (log.tipe || '').toLowerCase() === 'pulang';
                  return (
                    <div
                      key={log.id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                            {log.tanggal}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Hari {log.hari || 'Kerja'}
                          </div>
                        </div>

                        {/* Badge Tipe Presensi */}
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: isPulang ? '#fef3c7' : '#eff6ff',
                          color: isPulang ? '#92400e' : '#1e40af',
                          border: `1px solid ${isPulang ? '#fde68a' : '#bfdbfe'}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {isPulang ? <Sunset size={11} /> : <Sunrise size={11} />}
                          <span>{isPulang ? 'Pulang' : 'Masuk'}</span>
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #e2e8f0',
                        paddingTop: 8,
                        fontSize: '0.76rem',
                        color: '#475569',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={13} color={isPulang ? '#d97706' : '#2563eb'} />
                          <span>Pukul: <strong>{log.jam}</strong></span>
                        </div>
                        <div style={{ color: '#64748b' }}>
                          Jarak: <strong>{log.jarak}</strong>
                        </div>
                      </div>

                      {log.fotoUrl && (
                        <button
                          type="button"
                          onClick={() => setViewPhotoModal(log)}
                          style={{
                            marginTop: 4,
                            width: '100%',
                            padding: '8px',
                            borderRadius: 8,
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1e40af',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={14} />
                          <span>Lihat Bukti Foto Selfie Ber-Watermark</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
              background: successModal.tipe === 'Pulang' ? '#fef3c7' : '#ecfdf5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
              {successModal.tipe === 'Pulang' ? (
                <Sunset size={30} color="#d97706" />
              ) : (
                <Sunrise size={30} color="#059669" />
              )}
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              Absen {successModal.tipe === 'Pulang' ? 'Pulang (Sore)' : 'Masuk (Pagi)'} Berhasil!
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px' }}>
              Tercatat pada <strong>{successModal.tanggal}</strong> pukul <strong>{successModal.jam}</strong> di PTPN IV Regional 3.
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
                background: successModal.tipe === 'Pulang' ? '#d97706' : '#1e3a8a',
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
              <div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                  Bukti Foto Absen: {viewPhotoModal.tipe === 'Pulang' ? 'Pulang (Sore)' : 'Masuk (Pagi)'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {viewPhotoModal.tanggal}
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
              <span>Waktu: <strong>{viewPhotoModal.jam}</strong></span>
              <span>Lokasi: <strong>{viewPhotoModal.jarak} dari Kantor</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { DashboardAbsensiMagang as SimpleAttendanceDashboard };
export default DashboardAbsensiMagang;
