// ============================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================

const SUPABASE_URL = 'https://bxhgrkfbeupvpenizfeh.supabase.co';

// Chave anon/public (JWT) — segura para uso no front-end.
// Nunca coloque a service_role ou sb_secret_ aqui.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGdya2ZiZXVwdnBlbml6ZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTY4NzMsImV4cCI6MjEwNTAzMjg3M30.54INHSr-obYgVkOSWM2Hg_sdyIprWlhw2YL7p5BCVmI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);