// ============================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================

const SUPABASE_URL = 'https://bxhgrkfbeupvpenizfeh.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGdya2ZiZXVwdnBlbml6ZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTY4NzMsImV4cCI6MjEwNTAzMjg3M30.54INHSr-obYgVkOSWM2Hg_sdyIprWlhw2YL7p5BCVmI';

// Diagnóstico
console.log('[supabase-config] carregando...');
console.log('[supabase-config] window.supabase existe?', typeof window.supabase);
console.log('[supabase-config] window.supabase.createClient existe?',
    window.supabase && typeof window.supabase.createClient);

// Cria o client com verificação
let supabaseClient = null;

if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error(
        '[supabase-config] ERRO: O SDK do Supabase não foi carregado. ' +
        'Verifique se <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> ' +
        'está ANTES deste arquivo no HTML.'
    );
} else {
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[supabase-config] client criado com sucesso.');
    } catch (err) {
        console.error('[supabase-config] falha ao criar client:', err);
    }
}

// Expõe globalmente para o resto do código
window.supabaseClient = supabaseClient;