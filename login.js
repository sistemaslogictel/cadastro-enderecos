// ============================================
// LOGIN COM SUPABASE AUTH
// Usuário é o código TR (ex.: TR682238)
// Aceita maiúsculas e minúsculas
// ============================================

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Normaliza: sempre maiúsculo para exibir, minúsculo para o email do Supabase
    const userRaw = document.getElementById('userInput').value.trim();
    const user = userRaw.toUpperCase();          // TR682238
    const pass = document.getElementById('passInput').value.trim();

    const errorBox = document.getElementById('loginError');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    errorBox.style.display = 'none';
    errorBox.textContent = '';

    if (!user || !pass) {
        errorBox.textContent = 'Preencha o código TR e a senha.';
        errorBox.style.display = 'block';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando...';

    // O Supabase Auth trabalha com email — usamos o TR como prefixo,
    // sempre em minúsculo para o GoTrue não diferenciar maiúsculas.
    const email = `${user.toLowerCase()}@logictel.local`;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pass
        });

        if (error) {
            console.error('Erro login:', error);
            const msg = (error.message || '').toLowerCase();

            if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
                errorBox.textContent = 'Código TR ou senha inválidos. Verifique e tente novamente.';
            } else if (msg.includes('email not confirmed')) {
                errorBox.textContent = 'Usuário não confirmado. Contate o administrador.';
            } else if (msg.includes('too many requests') || msg.includes('rate limit')) {
                errorBox.textContent = 'Muitas tentativas. Aguarde alguns minutos.';
            } else if (msg.includes('network') || msg.includes('failed to fetch')) {
                errorBox.textContent = 'Falha de conexão. Verifique sua internet.';
            } else {
                errorBox.textContent = 'Erro ao entrar: ' + (error.message || 'desconhecido');
            }
            errorBox.style.display = 'block';
            return;
        }

        if (!data || !data.user) {
            errorBox.textContent = 'Usuário não cadastrado no sistema.';
            errorBox.style.display = 'block';
            return;
        }

        sessionStorage.setItem('usuarioLogado', user);
        sessionStorage.setItem('usuarioNome', data.user.user_metadata?.nome || user);
        window.location.href = 'index.html';

    } catch (err) {
        console.error('Erro inesperado:', err);
        errorBox.textContent = 'Erro inesperado. Tente novamente.';
        errorBox.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar';
    }
});