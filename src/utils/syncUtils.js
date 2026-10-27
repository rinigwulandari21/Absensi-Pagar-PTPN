// Utilitas Pemeriksaan Status Koneksi Supabase
import { supabase } from '../lib/supabaseClient';

// Periksa apakah Supabase mengizinkan write (apakah RLS sudah dimatikan)
export async function checkSupabaseWritePermission() {
  try {
    // 1. Coba baca data
    const { error: readErr } = await supabase.from('users').select('id').limit(1);
    if (readErr) {
      return { ok: false, rlsBlocked: false, error: readErr.message };
    }

    // 2. Coba probe write permissions (RLS check)
    const { error: updateErr } = await supabase
      .from('users')
      .update({ role: 'intern' })
      .eq('username', '__non_existent_probe__');

    if (updateErr && updateErr.code === '42501') {
      return { ok: false, rlsBlocked: true, message: 'Row Level Security (RLS) Supabase aktif' };
    }

    return { ok: true, rlsBlocked: false };
  } catch (err) {
    return { ok: false, rlsBlocked: false, error: err.message };
  }
}
