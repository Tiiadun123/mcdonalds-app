import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Thiếu cấu hình Supabase. Hãy tạo file .env từ .env.example và điền VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.'
    : null;

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey);
