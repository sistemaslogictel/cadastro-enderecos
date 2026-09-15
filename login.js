// ============================================
// LOGIN COM SUPABASE AUTH
// Usuário é o código TR (ex.: TR682238)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const userInput = document.getElementById('userInput');
    const passInput = document.getElementById('passInput');
    const errorBox = document.getElementById('loginError');
    const diagBox = document.getElementById('diagBox');

    function mostrarErro(msg) {
        errorBox.textContent = msg;
        errorBox.style.display = 'block';
    }

    function limparErro() {
        errorBox.textContent = '';
        errorBox.style.display = 'none';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        limparErro();

        // 1. Verifica se o Supabase está carregado
        if (typeof supabase === 'undefined' || !supabase) {
            mostrarErro('Erro: Supabase não carregado. Recarregue a página (Ctrl+F5).');
            if (diagBox) {
                diagBox.textContent = 'O objeto "supabase" não existe. Verifique se supabase-config.js foi carregado corretamente.';
                diagBox.style.display = 'block';
            }
            return;
        }

        const userRaw = userInput.value.trim();
        const user = userRaw.toUpperCase();
        const pass = passInput.value.trim();

        if (!user || !pass) {
            mostrarErro('Preencha o código TR e a senha.');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Entrando...';

        const email = `${user.toLowerCase()}@logictel.local`;

        try {
            console.log('[LOGIN] Tentando login:', { user, email });

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: pass
            });

            console.log('[LOGIN] Resposta Supabase:', { data, error });

            if (error) {
                const msg = (error.message || '').toLowerCase();
                if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
                    mostrarErro('Código TR ou senha inválidos. Verifique e tente novamente.');
                } else if (msg.includes('email not confirmed')) {
                    mostrarErro('Usuário não confirmado. Contate o administrador.');
                } else if (msg.includes('too many requests') || msg.includes('rate limit')) {
                    mostrarErro('Muitas tentativas. Aguarde alguns minutos.');
                } else if (msg.includes('network') || msg.includes('failed to fetch')) {
                    mostrarErro('Falha de conexão. Verifique sua internet.');
                } else {
                    mostrarErro('Erro ao entrar: ' + (error.message || 'desconhecido'));
                }
                return;
            }

            if (!data || !data.user) {
                mostrarErro('Usuário não cadastrado no sistema.');
                return;
            }

            sessionStorage.setItem('usuarioLogado', user);
            sessionStorage.setItem('usuarioNome', data.user.user_metadata?.nome || user);
            window.location.href = 'index.html';

        } catch (err) {
            console.error('[LOGIN] Erro inesperado:', err);
            mostrarErro('Erro inesperado: ' + (err.message || err));
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar';
        }
    });
});