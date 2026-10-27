// Utilitas untuk menggambar foto selfie absensi beserta Watermark Digital Resmi PTPN IV Regional 3 (Tema Biru Tua & Putih)

/**
 * Mengambil frame dari video dan menambahkan watermark metadata absensi (waktu, koordinat, nama, status geofence)
 * @param {HTMLVideoElement} videoElement
 * @param {Object} metadata
 * @param {string} metadata.internName
 * @param {string} metadata.internNim
 * @param {string} metadata.attendanceType 'Masuk' | 'Pulang'
 * @param {number} metadata.lat
 * @param {number} metadata.lng
 * @param {number} metadata.distanceMeters
 * @param {boolean} metadata.isValidGeofence
 * @returns {string} Base64 Data URL image/jpeg
 */
export function captureWithWatermark(videoElement, metadata) {
  const canvas = document.createElement('canvas');
  const width = videoElement.videoWidth || 640;
  const height = videoElement.videoHeight || 480;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Gambar frame video asli
  ctx.drawImage(videoElement, 0, 0, width, height);

  // Gradient overlay bagian bawah untuk watermark teks agar kontras dan sangat jelas dibaca (Tema Navy Deep Blue)
  const gradientHeight = Math.max(160, height * 0.32);
  const gradient = ctx.createLinearGradient(0, height - gradientHeight, 0, height);
  gradient.addColorStop(0, 'rgba(6, 13, 31, 0)');
  gradient.addColorStop(0.3, 'rgba(10, 21, 45, 0.75)');
  gradient.addColorStop(1, 'rgba(6, 13, 31, 0.96)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - gradientHeight, width, gradientHeight);

  // Top header banner watermark kecil
  const topGrad = ctx.createLinearGradient(0, 0, 0, 48);
  topGrad.addColorStop(0, 'rgba(6, 13, 31, 0.88)');
  topGrad.addColorStop(1, 'rgba(6, 13, 31, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, 48);

  // Top Header Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PT PERKEBUNAN NUSANTARA IV (REGIONAL 3)', 16, 22);

  ctx.font = '10px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#93c5fd';
  ctx.fillText('SISTEM INFORMASI PRESENSI MAGANG & PKL', 16, 36);

  // Badge Status Kehadiran di Pojok Kanan Atas
  const statusText = metadata.isValidGeofence ? 'AREA VALID (PTPN IV)' : 'DILUAR RADIUS KANTOR';
  const badgeColor = metadata.isValidGeofence ? '#3b82f6' : '#ef4444';
  
  ctx.fillStyle = 'rgba(6, 13, 31, 0.85)';
  ctx.roundRect ? ctx.roundRect(width - 170, 10, 158, 26, 6) : ctx.fillRect(width - 170, 10, 158, 26);
  ctx.fill();

  ctx.fillStyle = badgeColor;
  ctx.beginPath();
  ctx.arc(width - 156, 23, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(statusText, width - 146, 26);

  // Bottom Watermark Content
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ' WIB';

  const bottomY = height - 16;
  
  // Baris 1 (Paling bawah): Alamat / Tag
  ctx.font = '10px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('Lokasi Resmi: Jl. Rambutan No. 43 Pekanbaru, Riau 28284', 16, bottomY);

  // Baris 2: Koordinat & Jarak
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#93c5fd';
  const coordText = `GPS: ${metadata.lat.toFixed(6)}, ${metadata.lng.toFixed(6)} • Jarak: ${Math.round(metadata.distanceMeters)}m`;
  ctx.fillText(coordText, 16, bottomY - 18);

  // Baris 3: Tipe Absensi & Waktu
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  const typeBadge = `[ABSEN ${metadata.attendanceType.toUpperCase()}]`;
  ctx.fillText(`${typeBadge} ${dateFormatted} - ${timeFormatted}`, 16, bottomY - 38);

  // Baris 4: Nama & NIM Peserta
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${metadata.internName} (${metadata.internNim})`, 16, bottomY - 60);

  return canvas.toDataURL('image/jpeg', 0.92);
}
