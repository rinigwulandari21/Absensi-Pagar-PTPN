import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://bvqrcskjdcktnxmjbxcq.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_AZY_N5S1G_moY-n_h89HtQ_br_1rASP';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
