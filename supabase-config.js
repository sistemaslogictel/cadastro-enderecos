// ============================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================

const SUPABASE_URL = 'https://bxhgrkfbeupvpenizfeh.supabase.co';

// Chave anon/public (JWT) — segura para uso no front-end.
// Nunca coloque a service_role ou sb_secret_ aqui.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGdya2ZiZXVwdnBlbml6ZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTY4NzMsImV4cCI6MjEwNTAzMjg3M30.54INHSr-obYgVkOSWM2Hg_sdyIprWlhw2YL7p5BCVmI';

// O SDK UMD v2 expõe o objeto global `supabase` (não `window.supabase` como namespace do SDK).
// Aqui criamos o client com um nome próprio para não colidir.
if (typeof supabase === 'undefined' || !supabase || typeof supabase.createClient !== 'function') {
    console.error('[supabase-config] SDK do Supabase não carregado. Verifique o <script> do CDN antes deste arquivo.');
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);