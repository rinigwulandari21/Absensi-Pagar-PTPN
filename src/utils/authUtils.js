// Utilitas Autentikasi Pengguna & Admin Magang Terintegrasi Supabase
import { supabase } from '../lib/supabaseClient';

const USERS_STORAGE_KEY = 'ptpn_magang_users_v3';
const CURRENT_USER_KEY = 'ptpn_magang_current_user_v3';

// Akun bawaan (Admin & Mahasiswa Magang)
export const DEFAULT_USERS = [
  {
    id: 'admin-1',
    nama: 'Admin Pembimbing PTPN IV',
    jurusan: 'Bagian SDM & TI',
    bagian_magang: 'Kantor Direksi PTPN IV Regional 3',
    bagianMagang: 'Kantor Direksi PTPN IV Regional 3',
    nama_mentor: 'Koordinator Magang',
    namaMentor: 'Koordinator Magang',
    username: 'admin',
    password: '123',
    role: 'admin',
  },
];

export function getLocalUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Ambil seluruh anak magang HANYA dari Supabase (khusus Admin Dashboard, tanpa fallback browser)
export async function getSupabaseInternsOnly() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch interns error:', error);
      return { success: false, data: [], error: error.message };
    }

    const mapped = (data || []).map(u => ({
      ...u,
      nama: u.nama || u.username,
      jurusan: u.jurusan || '-',
      bagianMagang: u.bagian_magang || u.bagianMagang || '-',
      namaMentor: u.nama_mentor || u.namaMentor || '-',
    }));

    return { success: true, data: mapped, error: null };
  } catch (err) {
    console.error('Supabase interns exception:', err);
    return { success: false, data: [], error: err.message };
  }
}

// Ambil seluruh anak magang dari Supabase (dengan fallback untuk komponen umum)
export async function getAllInterns() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const local = getLocalUsers().filter(u => u.role !== 'admin');
      return local;
    }

    return data.map(u => ({
      ...u,
      bagianMagang: u.bagian_magang || u.bagianMagang,
      namaMentor: u.nama_mentor || u.namaMentor,
    }));
  } catch (err) {
    console.warn('Gagal mengambil data anak magang dari Supabase, menggunakan lokal:', err);
    return getLocalUsers().filter(u => u.role !== 'admin');
  }
}

// Registrasi Anak Magang ke Supabase
export async function registerUser(userData) {
  const usernameClean = userData.username.toLowerCase().trim();

  try {
    // 1. Cek apakah username sudah ada di Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', usernameClean)
      .maybeSingle();

    if (existingUser) {
      return { success: false, message: 'Username sudah digunakan, silakan pilih username lain.' };
    }

    // 2. Simpan ke Supabase tabel 'users'
    const payload = {
      nama: userData.nama.trim(),
      jurusan: userData.jurusan.trim(),
      bagian_magang: userData.bagianMagang.trim(),
      nama_mentor: userData.namaMentor.trim(),
      username: usernameClean,
      password: userData.password,
      role: 'intern',
    };

    const { data, error } = await supabase
      .from('users')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Gagal simpan ke Supabase users (RLS mungkin aktif):', error);
      // Fallback lokal jika RLS di Supabase belum dinonaktifkan
      const localUsers = getLocalUsers();
      if (localUsers.some(u => u.username.toLowerCase() === usernameClean)) {
        return { success: false, message: 'Username sudah digunakan.' };
      }
      const newUser = {
        id: `usr-${Date.now()}`,
        ...payload,
        bagianMagang: payload.bagian_magang,
        namaMentor: payload.nama_mentor,
      };
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...localUsers, newUser]));
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      return { success: true, user: newUser };
    }

    const savedUser = {
      ...data,
      bagianMagang: data.bagian_magang,
      namaMentor: data.nama_mentor,
    };

    // Simpan juga ke cache lokal
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(savedUser));
    return { success: true, user: savedUser };
  } catch (err) {
    console.error('Error saat registrasi:', err);
    return { success: false, message: 'Terjadi kesalahan koneksi saat registrasi.' };
  }
}

// Login Pengguna via Supabase
export async function loginUser(username, password) {
  const usernameClean = username.toLowerCase().trim();

  // Khusus admin bawaan cepat jika database belum terisi
  if (usernameClean === 'admin' && password === '123') {
    const adminUser = DEFAULT_USERS[0];
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
    return { success: true, user: adminUser };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', usernameClean)
      .eq('password', password)
      .maybeSingle();

    if (error || !data) {
      // Fallback cek data lokal
      const localUsers = getLocalUsers();
      const foundLocal = localUsers.find(
        u => u.username.toLowerCase() === usernameClean && u.password === password
      );
      if (foundLocal) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundLocal));
        return { success: true, user: foundLocal };
      }
      return { success: false, message: 'Username atau password salah!' };
    }

    const userObj = {
      ...data,
      bagianMagang: data.bagian_magang || data.bagianMagang,
      namaMentor: data.nama_mentor || data.namaMentor,
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userObj));
    return { success: true, user: userObj };
  } catch (err) {
    console.warn('Error login Supabase:', err);
    const localUsers = getLocalUsers();
    const foundLocal = localUsers.find(
      u => u.username.toLowerCase() === usernameClean && u.password === password
    );
    if (foundLocal) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundLocal));
      return { success: true, user: foundLocal };
    }
    return { success: false, message: 'Gagal terhubung ke database.' };
  }
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}
