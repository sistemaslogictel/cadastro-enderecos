// ============================================
// LOGIN COM SUPABASE AUTH
// ============================================

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('userInput').value.trim();
    const pass = document.getElementById('passInput').value.trim();
    const errorBox = document.getElementById('loginError');

    errorBox.style.display = 'none';
    errorBox.textContent = '';

    // Converte usuário em pseudo-email
    const email = `${user}@logictel.local`;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });

    if (error) {
        console.error('Erro login:', error);
        errorBox.textContent = '❌ Usuário ou senha inválidos. (' + error.message + ')';
        errorBox.style.display = 'block';
        return;
    }

    sessionStorage.setItem('usuarioLogado', user);
    window.location.href = 'index.html';
});