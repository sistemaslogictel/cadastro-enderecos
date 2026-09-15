// ============================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================

const SUPABASE_URL = 'https://bxhgrkfbeupvpenizfeh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aCs8dPFX7o6Axk-eKXTQ1g_TSGDfs8o';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);