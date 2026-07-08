// Supabase設定
const SUPABASE_URL = 'https://ggogpixsrqqhypgykofh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ce6kKIraUgoWsCtzP48Icw_dgEVOu6p';

// Supabaseクライアント初期化
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabaseClient;
