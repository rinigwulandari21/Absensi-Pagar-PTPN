// Penyimpanan data absensi terintegrasi Supabase
import { supabase } from '../lib/supabaseClient';

const ATTENDANCE_KEY = 'ptpn_intern_attendance_logs_v4';

const INITIAL_DAILY_LOGS = [];

export function getLocalLogs(username = null) {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    let allLogs = raw ? JSON.parse(raw) : INITIAL_DAILY_LOGS;
    if (username) {
      return allLogs.filter(l => !l.username || l.username.toLowerCase() === username.toLowerCase());
    }
    return allLogs;
  } catch {
    return INITIAL_DAILY_LOGS;
  }
}

// Ambil riwayat absensi HANYA dari Supabase (khusus Admin Dashboard, tanpa fallback browser)
export async function getSupabaseAttendanceLogsOnly(username = null) {
  try {
    let query = supabase
      .from('attendances')
      .select('*')
      .order('created_at', { ascending: false });

    if (username && username !== 'all') {
      query = query.eq('username', username.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase fetch attendances error:', error);
      return { success: false, data: [], error: error.message, rlsBlocked: error.code === '42501' };
    }

    const mapped = (data || []).map(row => ({
      id: row.id,
      hari: row.hari || '-',
      tanggal: row.tanggal ? `${row.hari ? row.hari + ', ' : ''}${row.tanggal}` : (row.hari || '-'),
      jam: row.jam || '-',
      status: row.status_lokasi || 'Hadir (Area PTPN IV)',
      koordinat: `${row.latitude ? Number(row.latitude).toFixed(6) : '-'}, ${row.longitude ? Number(row.longitude).toFixed(6) : '-'}`,
      jarak: `${Math.round(row.jarak_meter || 0)} meter`,
      lokasiValid: true,
      internName: row.intern_name,
      username: row.username,
      jurusan: row.jurusan || '-',
      bagianMagang: row.bagian_magang || '-',
      fotoUrl: row.foto_url,
    }));

    return { success: true, data: mapped, error: null };
  } catch (err) {
    console.error('Supabase attendances exception:', err);
    return { success: false, data: [], error: err.message };
  }
}

// Ambil riwayat absensi dari Supabase (dengan fallback ke lokal jika offline/error)
export async function getAttendanceLogs(username = null) {
  try {
    let query = supabase
      .from('attendances')
      .select('*')
      .order('created_at', { ascending: false });

    if (username) {
      query = query.eq('username', username.toLowerCase());
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return getLocalLogs(username);
    }

    return data.map(row => ({
      id: row.id,
      hari: row.hari,
      tanggal: row.tanggal ? `${row.hari}, ${row.tanggal}` : row.hari,
      jam: row.jam,
      status: row.status_lokasi || 'Hadir (Area PTPN IV)',
      koordinat: `${row.latitude ? row.latitude.toFixed(6) : '-'}, ${row.longitude ? row.longitude.toFixed(6) : '-'}`,
      jarak: `${Math.round(row.jarak_meter || 0)} meter`,
      lokasiValid: true,
      internName: row.intern_name,
      username: row.username,
      jurusan: row.jurusan || '-',
      bagianMagang: row.bagian_magang || '-',
      fotoUrl: row.foto_url,
    }));
  } catch (err) {
    console.warn('Gagal ambil data presensi dari Supabase, gunakan cache lokal:', err);
    return getLocalLogs(username);
  }
}

// Simpan presensi baru ke Supabase
export async function saveAttendanceLog(newEntry) {
  // Simpan ke cache lokal terlebih dahulu
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    const current = raw ? JSON.parse(raw) : INITIAL_DAILY_LOGS;
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([newEntry, ...current]));
  } catch (e) {
    console.warn('Local cache error:', e);
  }

  try {
    const lat = typeof newEntry.lat === 'number' ? newEntry.lat : (newEntry.userLat || 0.470142);
    const lng = typeof newEntry.lng === 'number' ? newEntry.lng : (newEntry.userLng || 101.42622);

    const payload = {
      username: newEntry.username.toLowerCase(),
      intern_name: newEntry.internName,
      hari: newEntry.hari,
      tanggal: new Date().toISOString().slice(0, 10),
      jam: newEntry.jam,
      latitude: lat,
      longitude: lng,
      jarak_meter: parseFloat(newEntry.jarak) || 0,
      status_lokasi: newEntry.status || 'Hadir (Area PTPN IV)',
      foto_url: newEntry.fotoUrl || null,
    };

    const { data, error } = await supabase
      .from('attendances')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Supabase attendances insert warning (RLS mungkin aktif):', error);
    } else {
      console.log('Berhasil disimpan ke Supabase attendances:', data);
    }
  } catch (err) {
    console.error('Error saat simpan presensi ke Supabase:', err);
  }

  return getLocalLogs(newEntry.username);
}

export function exportAttendanceToCSV(logs) {
  if (!logs || !logs.length) return;

  const headers = ['No', 'Nama Mahasiswa', 'Username', 'Jurusan', 'Bagian Magang', 'Hari & Tanggal', 'Jam Hadir', 'Status Lokasi', 'Jarak GPS', 'Koordinat'];
  const rows = logs.map((l, idx) => [
    `"${idx + 1}"`,
    `"${l.internName || '-'}"`,
    `"${l.username || '-'}"`,
    `"${l.jurusan || '-'}"`,
    `"${l.bagianMagang || '-'}"`,
    `"${l.tanggal || l.hari || '-'}"`,
    `"${l.jam || '-'}"`,
    `"${l.status || '-'}"`,
    `"${l.jarak || '-'}"`,
    `"${l.koordinat || '-'}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `rekap_presensi_ptpn4_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
