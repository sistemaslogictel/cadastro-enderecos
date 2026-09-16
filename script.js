// ============================================
// PROTEÇÃO DE ROTA
// ============================================
if (!sessionStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

let usuarioAtual = null;

// ============================================
// TEMA CLARO / ESCURO
// ============================================
(function initTheme() {
    const html = document.documentElement;
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    html.setAttribute('data-theme', theme);

    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('themeToggle');
        if (!btn) return;
        const update = () => {
            const isDark = html.getAttribute('data-theme') === 'dark';
            btn.innerHTML = `<span aria-hidden="true">${isDark ? '☀️' : '🌙'}</span>`;
            btn.setAttribute('aria-label', isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro');
        };
        update();
        btn.addEventListener('click', () => {
            const isDark = html.getAttribute('data-theme') === 'dark';
            const novo = isDark ? 'light' : 'dark';
            html.setAttribute('data-theme', novo);
            localStorage.setItem('theme', novo);
            update();
        });
    });
})();

// ============================================
// TOASTS
// ============================================
function showToast(titulo, mensagem = '', tipo = 'info', duracao = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'i' };
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
    toast.innerHTML = `
        <span class="toast-icon" aria-hidden="true">${icons[tipo] || icons.info}</span>
        <div class="toast-content">
            <div class="toast-title">${titulo}</div>
            ${mensagem ? `<div class="toast-message">${mensagem}</div>` : ''}
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duracao);
}

// ============================================
// VERIFICAR SE USUÁRIO É "ADM" (prefixo A)
// ============================================
function usuarioEhAdm() {
    const login = (sessionStorage.getItem('usuarioLogado') || '').trim().toUpperCase();
    const email = (usuarioAtual && usuarioAtual.email ? usuarioAtual.email : '').toUpperCase();
    const regex = /^A[A-Z]{2,}\d+/;
    return regex.test(login) || regex.test(email);
}

// ============================================
// APLICAR PERMISSÕES
// ============================================
function aplicarPermissoes() {
    const adm = usuarioEhAdm();
    const panel5 = document.getElementById('uploadPanel');
    const nav5 = document.getElementById('navUploadBtn');
    if (panel5) panel5.style.display = adm ? '' : 'none';
    if (nav5) nav5.style.display = adm ? '' : 'none';
    console.log('[PERMISSÃO] adm?', adm, '| login:', sessionStorage.getItem('usuarioLogado'));
}

// ============================================
// SURVEYS EM MEMÓRIA (não vai pro banco)
// ============================================
let surveysMemoria = [];
let _surveyIdSeq = 0;

// ============================================
// ESTADO GLOBAL
// ============================================
async function iniciar() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        showToast('Erro', 'Supabase não carregado. Abra o console (F12).', 'error', 8000);
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    usuarioAtual = user;

    const nome = sessionStorage.getItem('usuarioNome') || sessionStorage.getItem('usuarioLogado') || '-';
    document.getElementById('userLabel').textContent = nome;

    aplicarPermissoes();
    setTimeout(() => map.invalidateSize(), 400);
    renderizarSurveys();
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    sessionStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('usuarioNome');
    window.location.href = 'login.html';
});

// ============================================
// MAPA
// ============================================
const map = L.map('map', { maxZoom: 22, minZoom: 3, zoomControl: false }).setView([-22.90200282, -43.27065822], 15);

const camadas = {
    map: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri', maxZoom: 22, maxNativeZoom: 19
    }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri', maxZoom: 22, maxNativeZoom: 19
    })
};
camadas.map.addTo(map);
let camadaAtual = 'map';
L.control.zoom({ position: 'bottomright' }).addTo(map);

let marcadorAtual = null;
let marcadoresSurveys = [];
let enderecoBaseSelecionado = null;

// ============================================
// CASINHA SVG
// ============================================
const houseSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42"><path d="M16 1 L1 15 L1 17 L5 17 L5 33 L12 33 L12 24 L20 24 L20 33 L27 33 L27 17 L31 17 L31 15 Z" fill="#2a4fd6" stroke="#1e3c72" stroke-width="0.6" stroke-linejoin="round"/><rect x="7" y="5" width="4" height="7" fill="#2a4fd6" stroke="#1e3c72" stroke-width="0.6"/><ellipse cx="16" cy="41" rx="9" ry="1.2" fill="rgba(0,0,0,0.25)"/></svg>`;
const houseIcon = L.divIcon({ className: 'house-marker', html: houseSVG, iconSize: [14, 18], iconAnchor: [7, 18], popupAnchor: [0, -18] });

// ============================================
// HELPER: RECOLHER / EXPANDIR CARD
// ============================================
function recolherCard(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const body = panel.querySelector('.card-body');
    const toggle = panel.querySelector('.toggle-btn');
    if (body && !body.classList.contains('collapsed')) {
        body.classList.add('collapsed');
        if (toggle) { toggle.classList.add('collapsed'); toggle.setAttribute('aria-expanded', 'false'); }
    }
}
function expandirCard(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const body = panel.querySelector('.card-body');
    const toggle = panel.querySelector('.toggle-btn');
    if (body && body.classList.contains('collapsed')) {
        body.classList.remove('collapsed');
        if (toggle) { toggle.classList.remove('collapsed'); toggle.setAttribute('aria-expanded', 'true'); }
    }
}
function irParaCard(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    panel.classList.add('highlight');
    setTimeout(() => panel.classList.remove('highlight'), 1200);
}

// ============================================
// TOGGLE PAINÉIS
// ============================================
document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const t = document.getElementById(btn.dataset.target);
        if (!t) return;
        t.classList.toggle('collapsed');
        btn.classList.toggle('collapsed');
        btn.setAttribute('aria-expanded', String(!t.classList.contains('collapsed')));
        btn.innerHTML = '&#9660;';
    });
});

document.querySelectorAll('.card-header').forEach(h => {
    h.addEventListener('click', (e) => {
        if (e.target.closest('.toggle-btn') || e.target.closest('.map-tab') || e.target.closest('.icon-btn-sm')) return;
        const btn = h.querySelector('.toggle-btn');
        if (btn) btn.click();
    });
});

// ============================================
// ABAS DO MAPA
// ============================================
document.querySelectorAll('.map-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.stopPropagation();
        const alvo = tab.dataset.layer;
        if (alvo === camadaAtual) return;
        map.removeLayer(camadas[camadaAtual]);
        camadas[alvo].addTo(map);
        camadaAtual = alvo;
        document.querySelectorAll('.map-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

// ============================================
// TELA CHEIA
// ============================================
document.getElementById('fullscreenBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const el = document.getElementById('map').parentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
});

// ============================================
// HEADER NAV — botões fixos no topo
// ============================================
document.querySelectorAll('.header-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.goto);
        if (!target) return;
        expandirCard(btn.dataset.goto);
        irParaCard(btn.dataset.goto);
        document.querySelectorAll('.header-nav button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// ============================================
// TRAVAR ZOOM (Ctrl + B)
// ============================================
let zoomTravado = false;

const zoomLockControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function () {
        const btn = L.DomUtil.create('button', 'zoom-lock-btn');
        btn.innerHTML = '🔓';
        btn.title = 'Travar zoom (Ctrl + B)';
        btn.type = 'button';
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.disableScrollPropagation(btn);
        btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleZoomLock(); });
        zoomLockControl._btn = btn;
        return btn;
    }
});
map.addControl(new zoomLockControl());

function mostrarToastZoom(msg) { showToast('Zoom', msg, 'info', 1800); }

function aplicarTravamento() {
    map.scrollWheelZoom.disable(); map.doubleClickZoom.disable();
    map.touchZoom.disable(); map.boxZoom.disable(); map.keyboard.disable();
    const btn = zoomLockControl._btn;
    if (btn) { btn.innerHTML = '🔒'; btn.title = 'Destravar zoom (Ctrl + B)'; btn.classList.add('locked'); }
}
function aplicarDestravamento() {
    map.scrollWheelZoom.enable(); map.doubleClickZoom.enable();
    map.touchZoom.enable(); map.boxZoom.enable(); map.keyboard.enable();
    const btn = zoomLockControl._btn;
    if (btn) { btn.innerHTML = '🔓'; btn.title = 'Travar zoom (Ctrl + B)'; btn.classList.remove('locked'); }
}
function toggleZoomLock() {
    zoomTravado = !zoomTravado;
    if (zoomTravado) { aplicarTravamento(); mostrarToastZoom('Zoom travado'); }
    else { aplicarDestravamento(); mostrarToastZoom('Zoom destravado'); }
}
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); toggleZoomLock(); }
});
aplicarDestravamento();

// ============================================
// PARSER DE COORDENADAS
// ============================================
function tentarParseCoordenadas(query) {
    const limpo = query.replace(/[()\[\]]/g, '').trim();
    const match = limpo.match(/^(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)$/);
    if (!match) return null;
    const lat = parseFloat(match[1].replace(',', '.'));
    const lng = parseFloat(match[2].replace(',', '.'));
    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90) return null;
    if (lng < -180 || lng > 180) return null;
    return { lat, lng };
}

// ============================================
// MOTOR DE BUSCA
// ============================================
const searchInput = document.getElementById('searchInput');
const suggestionsBox = document.getElementById('suggestions');
let debounceTimer = null;
let ultimoQuery = '';

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);
    if (tentarParseCoordenadas(query)) {
        suggestionsBox.innerHTML = ''; suggestionsBox.style.display = 'none'; return;
    }
    if (query.length < 2) { suggestionsBox.innerHTML = ''; suggestionsBox.style.display = 'none'; return; }
    debounceTimer = setTimeout(() => buscarSugestoes(query), 400);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) buscarSugestoes(query);
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) suggestionsBox.style.display = 'none';
});

document.getElementById('searchClearBtn')?.addEventListener('click', () => {
    searchInput.value = '';
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'none';
    searchInput.focus();
});

async function buscarSugestoes(query) {
    if (query === ultimoQuery) return;
    ultimoQuery = query;

    suggestionsBox.innerHTML = '<div class="suggestion-item empty"><span class="loading"></span>Buscando no roteiro...</div>';
    suggestionsBox.style.display = 'block';

    try {
        const cepDigitos = query.replace(/\D/g, '');

        if (cepDigitos.length === 8) {
            const { data, error } = await supabaseClient
                .from('logradouros').select('*')
                .eq('origem', 'Roteiro XML')
                .ilike('cep', `%${cepDigitos}%`)
                .limit(30);
            if (error) throw error;
            renderizarSugestoes(data || [], query);
            return;
        }

        const normalizar = (s) => (s || '')
            .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ').trim();

        const queryNorm = normalizar(query)
            .replace(/^(rua|r\.?|avenida|av\.?|travessa|tv\.?|estrada|est\.?|alameda|al\.?|praca|praça|pc\.?|largo|beco|caminho)\s+/i, '')
            .trim();

        const palavras = queryNorm.split(/\s+/).filter(p => p.length >= 2);
        if (palavras.length === 0) {
            suggestionsBox.innerHTML = '<div class="suggestion-item empty">Digite ao menos 2 letras.</div>';
            return;
        }

        const palavraChave = [...palavras].sort((a, b) => b.length - a.length)[0];

        const { data, error } = await supabaseClient
            .from('logradouros').select('*')
            .eq('origem', 'Roteiro XML')
            .or(`logradouro.ilike.%${palavraChave}%,bairro.ilike.%${palavraChave}%,municipio.ilike.%${palavraChave}%,cep.ilike.%${palavraChave}%`)
            .limit(200);
        if (error) throw error;

        const concatenar = (r) => normalizar([
            r.tipo, r.logradouro, r.bairro, r.municipio, r.uf,
            r.cep ? String(r.cep).replace(/\D/g, '') : ''
        ].filter(Boolean).join(' '));

        const passaFiltro = (r) => {
            const blob = concatenar(r);
            return palavras.every(p => {
                if (blob.includes(p)) return true;
                const partes = blob.split(/\s+/);
                return partes.some(pb => pb.length >= 3 && (pb.includes(p) || p.includes(pb)));
            });
        };

        let filtrados = (data || []).filter(passaFiltro);

        if (filtrados.length === 0 && palavras.length > 1) {
            const segunda = [...palavras].sort((a, b) => b.length - a.length)[1];
            const { data: data2 } = await supabaseClient
                .from('logradouros').select('*')
                .eq('origem', 'Roteiro XML')
                .or(`logradouro.ilike.%${segunda}%,bairro.ilike.%${segunda}%,municipio.ilike.%${segunda}%,cep.ilike.%${segunda}%`)
                .limit(200);
            filtrados = (data2 || []).filter(passaFiltro);
        }

        if (filtrados.length === 0 && data && data.length > 0) filtrados = data;

        renderizarSugestoes(filtrados, query);
    } catch (err) {
        console.error('Busca falhou:', err);
        suggestionsBox.innerHTML = `<div class="suggestion-item empty">Erro ao buscar: ${escapeHtml(err.message)}</div>`;
        suggestionsBox.style.display = 'block';
    }
}

function renderizarSugestoes(lista, query) {
    suggestionsBox.innerHTML = '';
    if (!lista || lista.length === 0) {
        suggestionsBox.innerHTML = `
            <div class="suggestion-item empty">
                Nenhum logradouro encontrado no roteiro.<br>
                <small>Para incluir, envie e-mail para
                <a href="mailto:pp-logradouro@correios.com.br?subject=Inclus%C3%A3o%20de%20logradouro&body=Logradouro%3A%20${encodeURIComponent(query)}">PP-Logradouro</a>.</small>
            </div>`;
        suggestionsBox.style.display = 'block';
        return;
    }

    lista.forEach(r => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        const texto = formatarTextoLogradouro(r);
        div.innerHTML = `<span class="suggestion-icon">&#128220;</span>
            <span class="suggestion-text"><strong>Roteiro:</strong> ${escapeHtml(texto)}</span>`;
        div.addEventListener('click', () => {
            searchInput.value = texto;
            suggestionsBox.style.display = 'none';
            selecionarParaSurvey(r);
        });
        suggestionsBox.appendChild(div);
    });
    suggestionsBox.style.display = 'block';
}

function formatarTextoLogradouro(r) {
    const partes = [
        [r.tipo, r.logradouro].filter(Boolean).join(' '),
        r.bairro,
        r.municipio,
        r.uf
    ].filter(Boolean);
    const texto = partes.join(', ');
    return r.cep ? `${texto}, ${formatarCEP(r.cep)}` : texto;
}

document.getElementById('searchBtn').addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) buscarSugestoes(query);
    suggestionsBox.style.display = 'none';
});

// ============================================
// IR PARA LOCAL
// ============================================
function irParaLocal(lat, lng, nome, origem) {
    map.setView([lat, lng], 17);
    if (marcadorAtual) map.removeLayer(marcadorAtual);
    marcadorAtual = L.marker([lat, lng], { icon: houseIcon }).addTo(map);
    marcadorAtual.bindPopup(`<strong>${escapeHtml(nome)}</strong>`).openPopup();
    document.getElementById('coordsDisplay').textContent = `${lat.toFixed(8)}, ${lng.toFixed(8)}`;
    document.getElementById('origemDisplay').textContent = `Roteiro (${origem || 'logradouro'})`;
}

// ============================================
// CLIQUE DIREITO NO MAPA
// ============================================
map.on('contextmenu', (e) => {
    e.originalEvent.preventDefault();
    const { lat, lng } = e.latlng;
    if (marcadorAtual) map.removeLayer(marcadorAtual);
    marcadorAtual = L.marker([lat, lng], { icon: houseIcon }).addTo(map);
    marcadorAtual.bindPopup(`Ponto marcado<br>${lat.toFixed(8)}, ${lng.toFixed(8)}`).openPopup();
    document.getElementById('coordsDisplay').textContent = `${lat.toFixed(8)}, ${lng.toFixed(8)}`;
    document.getElementById('origemDisplay').textContent = 'Clique no mapa (botão direito)';

    const setH = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setH('surveyLatitude', lat.toFixed(8));
    setH('surveyLongitude', lng.toFixed(8));
});

// ============================================
// NORMALIZAR TIPO
// ============================================
function normalizarTipo(t) {
    if (!t) return '';
    const up = String(t).toUpperCase().replace(/\./g, '').trim();
    const mapa = {
        'R': 'Rua', 'RUA': 'Rua',
        'AV': 'Avenida', 'AVE': 'Avenida', 'AVENIDA': 'Avenida',
        'TV': 'Travessa', 'TRAV': 'Travessa', 'TRAVESSA': 'Travessa',
        'EST': 'Estrada', 'ESTRADA': 'Estrada',
        'AL': 'Alameda', 'ALAMEDA': 'Alameda',
        'PC': 'Praça', 'PRACA': 'Praça', 'PRAÇA': 'Praça',
        'LARGO': 'Largo', 'BECO': 'Beco',
        'CAM': 'Caminho', 'CAMINHO': 'Caminho'
    };
    return mapa[up] || (up.charAt(0) + up.slice(1).toLowerCase());
}

// ============================================
// SELECIONAR LOGRADOURO → SURVEY (AUTO-AVANÇO)
// ============================================
async function selecionarParaSurvey(r) {
    enderecoBaseSelecionado = {
        _registro_id: r.id,
        origem: 'Roteiro XML',
        tipo: normalizarTipo(r.tipo) || 'Rua',
        rua: r.logradouro || '',
        bairro: r.bairro || '',
        cidade: r.municipio || '',
        estado: r.uf || '',
        cep: r.cep || '',
        lat: r.latitude != null ? Number(r.latitude) : null,
        lng: r.longitude != null ? Number(r.longitude) : null,
        cod_bairro: r.cod_bairro || '',
        cod_lograd: r.cod_lograd || '',
        id_roteiro: r.id_roteiro || '',
        id_localidade: r.id_localidade || '',
        localidade: r.localidade || '',
        localidade_abrev: r.localidade_abrev || ''
    };

    const setH = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setH('surveyTipo', enderecoBaseSelecionado.tipo);
    setH('surveyLogradouro', enderecoBaseSelecionado.rua);
    setH('surveyBairro', enderecoBaseSelecionado.bairro);
    setH('surveyMunicipio', enderecoBaseSelecionado.cidade);
    setH('surveyUf', enderecoBaseSelecionado.estado);
    setH('surveyCep', enderecoBaseSelecionado.cep);

    const temCoordsRoteiro =
        enderecoBaseSelecionado.lat != null &&
        enderecoBaseSelecionado.lng != null &&
        enderecoBaseSelecionado.lat !== 0 &&
        enderecoBaseSelecionado.lng !== 0;

    if (temCoordsRoteiro) {
        setH('surveyLatitude', enderecoBaseSelecionado.lat.toFixed(8));
        setH('surveyLongitude', enderecoBaseSelecionado.lng.toFixed(8));
        irParaLocal(enderecoBaseSelecionado.lat, enderecoBaseSelecionado.lng,
            montarTextoLogradouro(enderecoBaseSelecionado), 'Roteiro');
    } else {
        setH('surveyLatitude', '');
        setH('surveyLongitude', '');
        showToast('Buscando no OpenStreetMap', 'Consultando o logradouro...', 'info', 3000);
        const opcoes = await buscarOpcoesOSM(enderecoBaseSelecionado);
        if (opcoes && opcoes.length > 0) {
            renderizarOpcoesOSM(opcoes, enderecoBaseSelecionado);
            showToast('Encontramos opções no OSM', 'Clique em uma opção para marcar no mapa.', 'success', 3500);
        } else {
            showToast('Sem coordenadas',
                'Não encontramos esse logradouro no OpenStreetMap. Marque manualmente com o botão direito no mapa.',
                'warning', 6000);
        }
    }

    const infoBox = document.getElementById('enderecoBaseInfo');
    if (infoBox) {
        const linha1 = [enderecoBaseSelecionado.tipo, enderecoBaseSelecionado.rua].filter(Boolean).join(' ') || '—';
        const linha2 = [
            enderecoBaseSelecionado.bairro,
            [enderecoBaseSelecionado.cidade, enderecoBaseSelecionado.estado].filter(Boolean).join('/')
        ].filter(Boolean).join(' • ');
        const linha3 = [formatarCEP(enderecoBaseSelecionado.cep), 'Brasil'].filter(Boolean).join(' • ');
        infoBox.innerHTML = `
            <div class="endereco-base-card">
                <span class="fonte-badge">Roteiro</span>
                <p class="endereco-base-linha1">${escapeHtml(linha1)}</p>
                <p class="endereco-base-linha2">${escapeHtml(linha2)}</p>
                ${linha3 ? `<p class="endereco-base-linha3">${escapeHtml(linha3)}</p>` : ''}
            </div>
        `;
    }

    // AUTO-AVANÇO: recolhe o card 2 e abre o 3
    recolherCard('resultsPanel');
    expandirCard('formPanel');
    irParaCard('formPanel');
}

function montarTextoLogradouro(end) {
    const partes = [
        [end.tipo, end.rua].filter(Boolean).join(' '),
        end.bairro,
        [end.cidade, end.estado].filter(Boolean).join(' - '),
        end.cep ? formatarCEP(end.cep) : ''
    ].filter(Boolean);
    return partes.join(', ');
}

// ============================================
// OSM
// ============================================
async function buscarOpcoesOSM(end) {
    const partes = [end.rua, end.bairro, end.cidade, end.estado].filter(Boolean);
    const query = partes.join(', ');
    if (!query) return [];

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=8&accept-language=pt-BR&countrycodes=br`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data)) return [];
        return data.map(item => {
            const a = item.address || {};
            return {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                display_name: item.display_name,
                rua: a.road || a.pedestrian || '',
                bairro: a.suburb || a.neighbourhood || '',
                cidade: a.city || a.town || a.village || '',
                estado: a.state || ''
            };
        });
    } catch (err) {
        console.warn('[OSM] erro:', err);
        return [];
    }
}

function renderizarOpcoesOSM(opcoes, end) {
    // Desmarca checkboxes de recorrência se o usuário não marcou (mantém comportamento)
    const list = document.getElementById('enderecosList');
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';

    const table = document.createElement('table');
    table.className = 'fontes-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Base</th><th>Logradouro</th><th>Bairro</th><th>Cidade/UF</th><th>Ação</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    opcoes.forEach((o, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="fonte-badge">OSM</span></td>
            <td>${escapeHtml(o.rua || '—')}</td>
            <td>${escapeHtml(o.bairro || '—')}</td>
            <td>${escapeHtml([o.cidade, o.estado].filter(Boolean).join('/') || '—')}</td>
            <td><button class="btn-usar-fonte" data-idx="${idx}" type="button">Usar esta</button></td>
        `;
        tbody.appendChild(tr);
    });

    wrapper.appendChild(table);
    list.innerHTML = '';
    list.appendChild(wrapper);

    tbody.querySelectorAll('.btn-usar-fonte').forEach(btn => {
        btn.addEventListener('click', () => {
            const o = opcoes[parseInt(btn.dataset.idx, 10)];
            if (!o) return;
            enderecoBaseSelecionado.lat = o.lat;
            enderecoBaseSelecionado.lng = o.lng;
            const setH = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
            setH('surveyLatitude', o.lat.toFixed(8));
            setH('surveyLongitude', o.lng.toFixed(8));
            irParaLocal(o.lat, o.lng, o.display_name || montarTextoLogradouro(end), 'Roteiro + OSM');
            showToast('Coordenadas aplicadas', 'Localização marcada no mapa.', 'success', 2500);
            // AUTO-AVANÇO também
            recolherCard('resultsPanel');
            expandirCard('formPanel');
            irParaCard('formPanel');
        });
    });
}

// ============================================
// ADICIONAR AO SURVEY (memória apenas)
// ============================================
document.getElementById('addBtn').addEventListener('click', async () => {
    if (!enderecoBaseSelecionado || !enderecoBaseSelecionado._registro_id) {
        showToast('Sem logradouro do roteiro', 'Selecione um logradouro na busca primeiro.', 'warning', 6000);
        return;
    }

    const numero = document.getElementById('numeroInput').value.trim();
    if (!numero) { showToast('Número obrigatório', 'Informe o Nº da fachada.', 'warning'); return; }

    const pisos = (document.getElementById('pisosInput')?.value || '').trim();

    const comp1Tipo = document.getElementById('comp1Tipo').value;
    const comp1Valor = document.getElementById('comp1Valor').value.trim();
    const comp2Tipo = document.getElementById('comp2Tipo').value;
    const comp2Valor = document.getElementById('comp2Valor').value.trim();
    const comp3Tipo = document.getElementById('comp3Tipo').value;
    const comp3Valor = document.getElementById('comp3Valor').value.trim();

    const latStr = (document.getElementById('surveyLatitude')?.value || '').trim();
    const lngStr = (document.getElementById('surveyLongitude')?.value || '').trim();
    const lat = latStr && !isNaN(parseFloat(latStr)) ? parseFloat(latStr) : null;
    const lng = lngStr && !isNaN(parseFloat(lngStr)) ? parseFloat(lngStr) : null;

    const complementos = [];
    if (comp1Tipo || comp1Valor) complementos.push({ tipo: comp1Tipo || '', valor: comp1Valor || '' });
    if (comp2Tipo || comp2Valor) complementos.push({ tipo: comp2Tipo || '', valor: comp2Valor || '' });
    if (comp3Tipo || comp3Valor) complementos.push({ tipo: comp3Tipo || '', valor: comp3Valor || '' });

    // Guarda em MEMÓRIA (não vai pro banco)
    _surveyIdSeq += 1;
    surveysMemoria.push({
        _id: 'mem_' + _surveyIdSeq,
                logradouro: { ...enderecoBaseSelecionado },
        numero: numero,
        pisos: pisos || null,
        complementos: complementos,
        latitude: lat,
        longitude: lng
    });

    showToast('Survey salvo', 'Nº e complementos adicionados à lista.', 'success', 2500);

    // Limpa respeitando as checkboxes "Recorrência"
    const limpar = (id, manterId) => {
        const manter = manterId ? document.getElementById(manterId) : null;
        if (manter && manter.checked) return;
        const el = document.getElementById(id);
        if (el) el.value = '';
    };

    limpar('numeroInput', 'numeroRecorrente');
    limpar('pisosInput', 'pisosRecorrente');
    limpar('comp1Tipo', 'comp1Recorrente');
    limpar('comp1Valor', 'comp1Recorrente');
    limpar('comp2Tipo', 'comp2Recorrente');
    limpar('comp2Valor', 'comp2Recorrente');
    limpar('comp3Tipo', 'comp3Recorrente');
    limpar('comp3Valor', 'comp3Recorrente');

    renderizarSurveys();

    // AUTO-AVANÇO: recolhe o card 3 (Survey) e abre o card 4 (Surveys Salvos)
    recolherCard('formPanel');
    expandirCard('listPanel');
    irParaCard('listPanel');
});

// ============================================
// RENDERIZAR SURVEYS SALVOS (em memória)
// ============================================
function renderizarSurveys() {
    const panel = document.getElementById('listPanel');
    const tbody = document.querySelector('#surveysTable tbody');
    if (!panel || !tbody) return;

    tbody.innerHTML = '';

    if (surveysMemoria.length === 0) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';

    surveysMemoria.forEach((s, idx) => {
        const l = s.logradouro || {};
        const comps = Array.isArray(s.complementos) ? s.complementos : [];
        const compTexto = comps.length
            ? comps.map(c => `${c.tipo || '?'}: ${c.valor || ''}`).join(' | ')
            : '—';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml([l.tipo, l.rua].filter(Boolean).join(' ') || '—')}</td>
            <td>${escapeHtml(s.numero || '')}</td>
            <td>${escapeHtml(compTexto)}</td>
            <td>${escapeHtml(l.bairro || '')}</td>
            <td>${escapeHtml([l.cidade, l.estado].filter(Boolean).join('/') || '')}</td>
            <td class="mono">${escapeHtml(formatarCEP(l.cep || ''))}</td>
            <td class="acoes-cell">
                <button class="btn-ir" data-idx="${idx}" title="Centralizar no mapa" type="button">🗺️</button>
                <button class="btn-remover" data-id="${s._id}" title="Remover" type="button">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Botão "ir" (centralizar no mapa)
    tbody.querySelectorAll('.btn-ir').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = surveysMemoria[parseInt(btn.dataset.idx, 10)];
            if (!s) return;
            const lat = s.latitude != null ? Number(s.latitude) : (s.logradouro && s.logradouro.lat);
            const lng = s.longitude != null ? Number(s.longitude) : (s.logradouro && s.logradouro.lng);
            if (lat == null || lng == null) {
                showToast('Sem coordenadas', 'Este survey não possui coordenadas.', 'warning', 3000);
                return;
            }
            map.setView([lat, lng], 18);
            if (marcadorAtual) map.removeLayer(marcadorAtual);
            marcadorAtual = L.marker([lat, lng], { icon: houseIcon }).addTo(map);
            const nome = s.logradouro ? s.logradouro.rua : '';
            marcadorAtual.bindPopup(`<strong>${escapeHtml(nome)}, ${escapeHtml(s.numero || '')}</strong>`).openPopup();
            document.getElementById('panel2').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Botão remover
    tbody.querySelectorAll('.btn-remover').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (!confirm('Remover este survey da lista?')) return;
            surveysMemoria = surveysMemoria.filter(s => s._id !== id);
            showToast('Removido', 'Survey excluído da lista.', 'success', 2000);
            renderizarSurveys();
            renderizarMarcadoresSurveys();
        });
    });

    renderizarMarcadoresSurveys();
}

// ============================================
// MARCADORES DOS SURVEYS NO MAPA
// ============================================
function renderizarMarcadoresSurveys() {
    marcadoresSurveys.forEach(m => map.removeLayer(m));
    marcadoresSurveys = [];

    surveysMemoria.forEach(s => {
        const lat = s.latitude != null ? Number(s.latitude) : (s.logradouro && s.logradouro.lat);
        const lng = s.longitude != null ? Number(s.longitude) : (s.logradouro && s.logradouro.lng);
        if (lat == null || lng == null) return;
        const m = L.marker([lat, lng], { icon: houseIcon }).addTo(map);
        const nome = s.logradouro ? s.logradouro.rua : '';
        m.bindPopup(`<strong>${escapeHtml(nome)}, ${escapeHtml(s.numero || '')}</strong>`);
        marcadoresSurveys.push(m);
    });
}

// ============================================
// LIMPAR TUDO (botão dentro da seção 4)
// ============================================
document.getElementById('clearBtn')?.addEventListener('click', () => {
    if (surveysMemoria.length === 0) {
        showToast('Nada para limpar', 'Não há surveys salvos.', 'info', 2000);
        return;
    }
    if (!confirm('Apagar TODOS os surveys da lista? (não afeta o roteiro)')) return;
    surveysMemoria = [];
    marcadoresSurveys.forEach(m => map.removeLayer(m));
    marcadoresSurveys = [];
    showToast('Lista limpa', 'Todos os surveys foram removidos.', 'success', 2500);
    renderizarSurveys();
});

// ============================================
// EXPORTAR XMLs (ZIP) — e limpa a lista
// ============================================
document.getElementById('exportBtn')?.addEventListener('click', async () => {
    if (surveysMemoria.length === 0) {
        showToast('Nada para exportar', 'Salve ao menos um survey.', 'warning');
        return;
    }

    try {
        if (typeof JSZip === 'undefined') throw new Error('JSZip não carregado.');
        const zip = new JSZip();

        const primeiroLog = surveysMemoria[0].logradouro || {};
        const localidade = (primeiroLog.localidade || primeiroLog.cidade || 'localidade')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_').toUpperCase();
        const agora = new Date();
        const carimbo = `${agora.getFullYear()}${String(agora.getMonth()+1).padStart(2,'0')}${String(agora.getDate()).padStart(2,'0')}${String(agora.getHours()).padStart(2,'0')}${String(agora.getMinutes()).padStart(2,'0')}`;
        const nomeZipBase = `${localidade}_${carimbo}`;

        surveysMemoria.forEach((s, idx) => {
            const numero = idx + 1;
            const nomePasta = `moradia${numero}`;
            const nomeArquivo = `moradia${numero}.xml`;
            zip.folder(nomePasta).file(nomeArquivo, gerarXMLEdificio(s, s.logradouro, numero));
        });

        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nomeZipBase}.zip`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const total = surveysMemoria.length;

        // Limpa memória após exportar
        surveysMemoria = [];
        marcadoresSurveys.forEach(m => map.removeLayer(m));
        marcadoresSurveys = [];

        showToast('ZIP gerado', `${total} moradia(s) exportada(s). Lista limpa.`, 'success', 4000);
        renderizarSurveys();
    } catch (err) {
        console.error(err);
        showToast('Erro ao gerar ZIP', err.message, 'error');
    }
});

// ============================================
// GERAR XML NO FORMATO "edificio"
// ============================================
function gerarXMLEdificio(survey, logradouro, numero) {
    const l = logradouro || {};
    const xmlEscape = (v) => {
        if (v == null) return '';
        return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    };

    const agora = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dataFormatada = `${agora.getFullYear()}${pad(agora.getMonth()+1)}${pad(agora.getDate())}${pad(agora.getHours())}${pad(agora.getMinutes())}${pad(agora.getSeconds())}`;

    const tipo = (l.tipo || 'Rua').toString().toUpperCase();
    const nomeLograd = (l.rua || '').toString().toUpperCase();
    const bairro = (l.bairro || '').toString().toUpperCase();
    const municipio = (l.cidade || l.localidade || '').toString().toUpperCase();
    const uf = (l.estado || '').toString().toUpperCase();
    const codLograd = l.cod_lograd || l.id_roteiro || '0';

    const logradouroCompleto = `${tipo} ${nomeLograd}, ${bairro}, ${municipio}, ${municipio} - ${uf} (${codLograd})`;

    const lat = survey.latitude != null ? Number(survey.latitude) : (l.lat != null ? Number(l.lat) : null);
    const lng = survey.longitude != null ? Number(survey.longitude) : (l.lng != null ? Number(l.lng) : null);

    const coordX = lng != null ? lng.toFixed(6) : '';
    const coordY = lat != null ? lat.toFixed(6) : '';
    const codigoZona = l.codigo_zona || '';
    const nomeZona = l.nome_zona || codigoZona;
    const localidade = l.localidade || l.cidade || '';
    const idEdificio = l.id_roteiro || l._registro_id || numero;
    const numeroFachada = survey.numero || '';
    const cep = (l.cep || '').toString().replace(/\D/g, '');
    const codBairro = l.cod_bairro || '';
    const idRoteiro = l.id_roteiro || l._registro_id || '';
    const idLocalidade = l.id_localidade || '';
    const tecnicoNome = (usuarioAtual && usuarioAtual.user_metadata && usuarioAtual.user_metadata.nome) || '';
    const tecnicoId = (usuarioAtual && usuarioAtual.id) || '';
    const empresaId = '6';
    const empresaNome = 'LOGICTEL';
    const numPisos = survey.pisos && !isNaN(parseInt(survey.pisos, 10)) ? String(parseInt(survey.pisos, 10)) : '1';

    return `<?xml version="1.0" encoding="UTF-8"?><edificio tipo="M" versao="7.9.2">
  <gravado>false</gravado>
  <nEdificio></nEdificio>
  <coordX>${xmlEscape(coordX)}</coordX>
  <coordY>${xmlEscape(coordY)}</coordY>
  <codigoZona>${xmlEscape(codigoZona)}</codigoZona>
  <nomeZona>${xmlEscape(nomeZona)}</nomeZona>
  <localidade>${xmlEscape(localidade)}</localidade>
  <enderecoEdificio>
    <id>${xmlEscape(idEdificio)}</id>
    <logradouro>${xmlEscape(logradouroCompleto)}</logradouro>
    <numero_fachada>${xmlEscape(numeroFachada)}</numero_fachada>
    <cep>${xmlEscape(cep)}</cep>
    <cod_bairro>${xmlEscape(codBairro)}</cod_bairro>
    <bairro>${xmlEscape(bairro)}</bairro>
    <id_roteiro>${xmlEscape(idRoteiro)}</id_roteiro>
    <id_localidade>${xmlEscape(idLocalidade)}</id_localidade>
    <cod_lograd>${xmlEscape(codLograd)}</cod_lograd>
  </enderecoEdificio>
  <tecnico>
    <id>${xmlEscape(tecnicoId)}</id>
    <nome>${xmlEscape(tecnicoNome)}</nome>
  </tecnico>
  <empresa>
    <id>${xmlEscape(empresaId)}</id>
    <nome>${xmlEscape(empresaNome)}</nome>
  </empresa>
  <data>${dataFormatada}</data>
  <observacoes></observacoes>
  <totalUCs>1</totalUCs>
  <ocupacao>EDIFICACAOCOMPLETA</ocupacao>
  <numPisos>${xmlEscape(numPisos)}</numPisos>
  <destinacao>RESIDENCIA</destinacao>
</edificio>
`;
}

// ============================================
// UPLOAD DE ROTEIRO (só ADM)
// ============================================
document.getElementById('uploadBtn')?.addEventListener('click', async () => {
    if (!usuarioEhAdm()) {
        showToast('Sem permissão', 'Apenas usuários ATR/ATT/ADD podem importar roteiros.', 'error', 5000);
        return;
    }

    const fileInput = document.getElementById('roteiroFile');
    const status = document.getElementById('uploadStatus');
    const file = fileInput.files[0];
    if (!file) { showToast('Nenhum arquivo', 'Selecione um arquivo .xml ou .csv.', 'warning'); return; }

    status.textContent = 'Processando arquivo...';

    try {
        const texto = await file.text();
        let registros = [];
        const nomeLower = file.name.toLowerCase();

        if (nomeLower.endsWith('.csv')) registros = parseCSV(texto);
        else if (nomeLower.endsWith('.xml')) registros = parseXMLRoteiro(texto);
        else throw new Error('Formato não suportado. Use .csv ou .xml');

        if (registros.length === 0) {
            status.textContent = 'Nenhum registro válido.';
            showToast('Sem registros', 'O arquivo não continha dados válidos.', 'warning');
            return;
        }

        const normalizados = registros.map(r => ({
            tipo: normalizarTipo(r.tipo) || null,
            logradouro: (r.rua || r.logradouro || '').trim(),
            bairro: (r.bairro || '').trim() || null,
            municipio: (r.cidade || r.municipio || '').trim() || null,
            uf: (r.estado || r.uf || '').trim().toUpperCase() || null,
            cep: (r.cep || '').replace(/\D/g, '') || null,
            latitude: r.latitude != null ? r.latitude : null,
            longitude: r.longitude != null ? r.longitude : null,
            cod_bairro: r.cod_bairro || null,
            cod_lograd: r.cod_lograd || null,
            id_roteiro: r.id_roteiro || null,
            id_localidade: r.id_localidade || null,
            localidade: r.localidade || null,
            localidade_abrev: r.localidade_abrev || null,
            codigo_zona: r.codigo_zona || null,
            nome_zona: r.nome_zona || null,
            origem: 'Roteiro XML',
            usuario_id: usuarioAtual ? usuarioAtual.id : null
        })).filter(r => r.logradouro);

        status.textContent = `Verificando duplicados... (${normalizados.length} registros)`;

        const chaveDe = (r) =>
            [r.logradouro, r.bairro, r.municipio, r.uf, r.cep]
                .map(v => (v || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim())
                .join('|');

        const { data: existentes, error: errBusca } = await supabaseClient
            .from('logradouros').select('logradouro, bairro, municipio, uf, cep')
            .eq('origem', 'Roteiro XML');
        if (errBusca) throw errBusca;

        const chavesExistentes = new Set((existentes || []).map(chaveDe));
        const chavesNovas = new Set();
        const novos = normalizados.filter(r => {
            const k = chaveDe(r);
            if (chavesExistentes.has(k)) return false;
            if (chavesNovas.has(k)) return false;
            chavesNovas.add(k);
            return true;
        });

        const ignorados = normalizados.length - novos.length;

        if (novos.length === 0) {
            status.textContent = `Nada novo para importar (${ignorados} duplicado(s) ignorado(s)).`;
            showToast('Sem novidades', `${ignorados} registro(s) já existiam.`, 'info', 3500);
            fileInput.value = '';
            return;
        }

        const TAM = 500;
        let inseridos = 0;
        for (let i = 0; i < novos.length; i += TAM) {
            const lote = novos.slice(i, i + TAM);
            const { error } = await supabaseClient.from('logradouros').insert(lote);
            if (error) throw error;
            inseridos += lote.length;
            status.textContent = `Importando... ${inseridos}/${novos.length}`;
        }

        status.textContent = `${inseridos} novo(s) importado(s). ${ignorados} duplicado(s) ignorado(s).`;
        showToast('Roteiro importado', `${inseridos} novo(s) | ${ignorados} duplicado(s) ignorado(s).`, 'success', 4000);
        fileInput.value = '';
    } catch (err) {
        console.error('[UPLOAD] Erro:', err);
        status.textContent = `Erro: ${err.message}`;
        showToast('Erro na importação', err.message, 'error', 8000);
    }
});

// ============================================
// PARSERS
// ============================================
function parseCSV(texto) {
    const linhas = texto.split(/\r?\n/).filter(l => l.trim());
    if (linhas.length < 2) return [];
    const sep = linhas[0].includes(';') ? ';' : ',';
    const headers = linhas[0].split(sep).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    const idx = (nome) => headers.indexOf(nome);
    return linhas.slice(1).map(linha => {
        const cols = linha.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
        const get = (campo) => { const i = idx(campo); return i >= 0 ? cols[i] : ''; };
        const lat = parseFloat(get('latitude'));
        const lng = parseFloat(get('longitude'));
        return {
            tipo: get('tipo') || get('tipo_lograd') || '',
            rua: get('rua') || get('logradouro'),
            bairro: get('bairro'),
            cidade: get('cidade') || get('municipio') || get('localidade'),
            estado: get('estado') || get('uf'),
            cep: get('cep'),
            latitude: isNaN(lat) ? null : lat,
            longitude: isNaN(lng) ? null : lng,
            cod_bairro: get('cod_bairro') || '',
            cod_lograd: get('cod_lograd') || '',
            id_roteiro: get('id_roteiro') || '',
            id_localidade: get('id_localidade') || '',
            localidade: get('localidade') || '',
            localidade_abrev: get('localidade_abrev') || '',
            codigo_zona: get('codigo_zona') || '',
            nome_zona: get('nome_zona') || ''
        };
    }).filter(r => r.rua || r.cep);
}

function parseXMLRoteiro(texto) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(texto, 'text/xml');

    const parserError = xml.querySelector('parsererror');
    if (parserError) throw new Error('XML inválido: ' + parserError.textContent.substring(0, 200));

    let nodes = Array.from(xml.getElementsByTagName('roteiro'));
    if (nodes.length === 0) nodes = Array.from(xml.querySelectorAll('endereco, address, registro, item, linha, edificio'));
    if (nodes.length === 0) throw new Error('Nenhum elemento reconhecido no arquivo.');

    const getText = (node, tag) => {
        const el = node.getElementsByTagName(tag)[0];
        return el && el.textContent ? el.textContent.trim() : '';
    };

    const registros = nodes.map(node => {
        const tipo = getText(node, 'tipo_lograd');
        const titulo = getText(node, 'titulo');
        const nomeBase = getText(node, 'nome_lograd') || getText(node, 'logradouro');

        let nomeLograd = nomeBase;
        if (titulo && nomeBase && !nomeBase.toUpperCase().startsWith(titulo.toUpperCase())) {
            nomeLograd = `${titulo} ${nomeBase}`.trim();
        }

        return {
            tipo: tipo || 'Rua',
            rua: nomeLograd,
            bairro: getText(node, 'bairro'),
            cidade: getText(node, 'municipio') || getText(node, 'localidade'),
            estado: getText(node, 'uf_abrev') || getText(node, 'uf'),
            cep: getText(node, 'cep'),
            latitude: parseFloat(getText(node, 'coordY')) || null,
            longitude: parseFloat(getText(node, 'coordX')) || null,
            cod_bairro: getText(node, 'cod_bairro'),
            cod_lograd: getText(node, 'cod_lograd'),
            id_roteiro: getText(node, 'id_roteiro') || getText(node, 'id'),
            id_localidade: getText(node, 'id_localidade'),
            localidade: getText(node, 'localidade'),
            localidade_abrev: getText(node, 'localidade_abrev'),
            codigo_zona: getText(node, 'codigo_zona'),
            nome_zona: getText(node, 'nome_zona')
        };
    });

    return registros.filter(r => r.rua || r.cep);
}

// ============================================
// UTILITÁRIOS
// ============================================
function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatarCEP(cep) {
    if (!cep) return '';
    const clean = String(cep).replace(/\D/g, '');
    if (clean.length !== 8) return clean;
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
}

// ============================================
// RESIZE MAPA
// ============================================
window.addEventListener('resize', () => setTimeout(() => map.invalidateSize(), 200));

if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => setTimeout(() => map.invalidateSize(), 100));
    const mapEl = document.getElementById('map');
    if (mapEl) ro.observe(mapEl);
    const containerEl = document.querySelector('.layout-2col');
    if (containerEl) ro.observe(containerEl);
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    iniciar().catch(err => {
        console.error('Erro na inicialização:', err);
        showToast('Erro ao iniciar', err.message, 'error');
    });
});