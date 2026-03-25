import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ambil variabel dari .env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Hard validation — gagal dengan pesan jelas, bukan silent broken
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        '\n⚠️  KONFIGURASI SUPABASE HILANG!\n' +
        'Pastikan file .env sudah ada dan berisi:\n' +
        '  EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co\n' +
        '  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...\n'
    );
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
