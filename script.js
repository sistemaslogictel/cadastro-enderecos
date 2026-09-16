// ============================================
// PROTEÇÃO DE ROTA
// ============================================
if (!sessionStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

let usuarioAtual = null;

// ============================================
// COORDENADA DEFAULT (fallback quando OSM não acha o logradouro)
// ============================================
const COORD_DEFAULT_FALLBACK = {
    lat: -22.857891546641735,
    lng: -43.35499423386818
};

// ============================================
// TÉCNICO FIXO (padrão do XML)
// ============================================
const TECNICO_FIXO_NOME = 'Osvaldo Miguel Magalhães';
const TECNICO_FIXO_ID = '';

// ============================================
// TABELA DE IDS DE COMPLEMENTO
// ============================================
const COMPLEMENTO_IDS = {
    'academia': 121, 'acampamento': 1, 'administração': 114, 'administracao': 114,
    'ala': 2, 'almoxarifado': 3, 'alto': 4, 'altos': 5, 'ambulatório': 6, 'ambulatorio': 6,
    'andar': 7, 'anexo': 8, 'apartamento': 9, 'armazém': 10, 'armazem': 10,
    'ate': 11, 'baixos': 12, 'banca': 13, 'barrão': 14, 'barrao': 14, 'beco': 15,
    'bloco': 16, 'box': 17, 'brigada de incêncio': 115, 'brigada de incendio': 115,
    'cais': 18, 'carpintaria': 20, 'casa': 22, 'cela': 23, 'central': 24, 'chácara': 124, 'chacara': 124,
    'cobertura': 25, 'colina': 26, 'condomínio': 27, 'condominio': 27,
    'conjunto': 28, 'conjunto residencial': 29, 'corredor': 30,
    'depósito': 31, 'deposito': 31, 'diretoria': 32, 'divisão': 34, 'divisao': 34,
    'edifício': 35, 'edificio': 35, 'entrada': 36, 'escritório': 37, 'escritorio': 37,
    'espaço de convivência': 38, 'espaco de convivencia': 38, 'estação': 39, 'estacao': 39,
    'etapa': 40, 'frente': 43, 'fundos': 44, 'fórum': 42, 'forum': 42,
    'galeria': 45, 'galpão': 46, 'galpao': 46, 'garagem': 47, 'gleba': 48, 'granja': 49,
    'grupo': 50, 'guichê': 52, 'guiche': 52, 'hagar': 53, 'lado': 55, 'lanchonete': 56,
    'letra': 57, 'loja': 58, 'lote': 59, 'loteamento': 60, 'lâmina': 56, 'lamina': 56,
    'mansão': 62, 'mansao': 62, 'mart': 63, 'mercado': 64, 'mezanino': 65, 'módulo': 66, 'modulo': 66,
    'não disponível': 119, 'nao disponivel': 119, 'não se aplica': 117, 'nao se aplica': 117,
    'núcleo': 67, 'nucleo': 67, 'oficina mecânica': 68, 'oficina mecanica': 68,
    'orgão': 69, 'orgao': 69, 'palácio': 70, 'palacio': 70, 'parada': 71,
    'pavilhão': 73, 'pavilhao': 73, 'pavimento': 74, 'pilotis': 75, 'piso': 76, 'plataforma': 77,
    'portão': 81, 'portao': 81, 'porão': 80, 'porao': 80, 'poço': 78, 'poco': 78,
    'presidência': 83, 'presidencia': 83, 'prédio': 82, 'predio': 82, 'pátio': 72, 'patio': 72,
    'quadra': 85, 'quarto': 86, 'quilômetro': 87, 'quilometro': 87,
    'quinta': 88, 'quiosque': 89, 'ramal': 90, 'recepção': 91, 'recepcao': 91,
    'refeitório': 92, 'refeitorio': 92, 'restaurante': 93, 'rótula': 95, 'rotula': 95,
    'sala': 96, 'sala técnica': 116, 'sala tecnica': 116,
    'salão de eventos': 120, 'salao de eventos': 120,
    'sem complemento': 118, 'setor': 98, 'seção': 97, 'secao': 97,
    'sobrado': 100, 'sobreloja': 101, 'stand': 102, 'sub número': 122, 'sub numero': 122,
    'subestação': 103, 'subestacao': 103, 'subsolo': 104, 'super quadra': 105,
    'terreno': 106, 'torre': 109, 'travessa': 110, 'trecho': 111, 'térreo': 107, 'terreo': 107,
    'vila': 112, 'vizinho': 113, 'xx': 99
};

function getIdComplemento(tipo) {
    if (!tipo) return '';
    const k = String(tipo).trim().toLowerCase();
    return COMPLEMENTO_IDS[k] ?? '';
}

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
// PERMISSÕES
// ============================================
function usuarioEhAdm() {
    const login = (sessionStorage.getItem('usuarioLogado') || '').trim().toUpperCase();
    const email = (usuarioAtual && usuarioAtual.email ? usuarioAtual.email : '').toUpperCase();
    const regex = /^A[A-Z]{2,}\d+/;
    return regex.test(login) || regex.test(email);
}

function aplicarPermissoes() {
    const adm = usuarioEhAdm();
    const panel5 = document.getElementById('uploadPanel');
    const nav5 = document.getElementById('navUploadBtn');
    if (panel5) panel5.style.display = adm ? '' : 'none';
    if (nav5) nav5.style.display = adm ? '' : 'none';
    console.log('[PERMISSÃO] adm?', adm, '| login:', sessionStorage.getItem('usuarioLogado'));
}

// ============================================
// SURVEYS EM MEMÓRIA
// ============================================
let surveysMemoria = [];
let _surveyIdSeq = 0;
let _iaJaDisparou = false;
let _surveyEditandoIdx = null;

// ============================================
// INICIAR
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
    inicializarChatIA();

    document.getElementById('exportHeaderBtn')?.addEventListener('click', () => {
        document.getElementById('exportBtn')?.click();
    });
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
const houseIconIA = L.divIcon({
    className: 'house-marker',
    html: houseSVG.replace(/#2a4fd6/g, '#16a34a').replace(/#1e3c72/g, '#15803d'),
    iconSize: [14, 18], iconAnchor: [7, 18], popupAnchor: [0, -18]
});

// ============================================
// HELPERS DE CARD
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
// HEADER NAV
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
// TRAVAR ZOOM
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
// MOTOR DE BUSCA
// ============================================
const searchInput = document.getElementById('searchInput');
const suggestionsBox = document.getElementById('suggestions');
let debounceTimer = null;
let ultimoQuery = '';

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);
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
    if (query) {
        buscarSugestoes(query);
        recolherCard('panel1');
        expandirCard('resultsPanel');
        irParaCard('resultsPanel');
    }
    suggestionsBox.style.display = 'none';
});

// ============================================
// IR PARA LOCAL (marcador arrastável)
// ============================================
function irParaLocal(lat, lng, nome, origem) {
    map.setView([lat, lng], 17);
    if (marcadorAtual) map.removeLayer(marcadorAtual);
    marcadorAtual = L.marker([lat, lng], { icon: houseIcon, draggable: false }).addTo(map);
    marcadorAtual.bindPopup(`<strong>${escapeHtml(nome)}</strong>`).openPopup();
    document.getElementById('coordsDisplay').textContent = `${lat.toFixed(8)}, ${lng.toFixed(8)}`;
    document.getElementById('origemDisplay').textContent = `Roteiro (${origem || 'logradouro'})`;

    marcadorAtual.on('mousedown', () => marcadorAtual.dragging.enable());
    marcadorAtual.on('dragend', () => {
        const pos = marcadorAtual.getLatLng();
        const setH = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setH('surveyLatitude', pos.lat.toFixed(8));
        setH('surveyLongitude', pos.lng.toFixed(8));
        document.getElementById('coordsDisplay').textContent = `${pos.lat.toFixed(8)}, ${pos.lng.toFixed(8)}`;
        document.getElementById('origemDisplay').textContent = 'Ajustado manualmente (arrastado)';
        if (_surveyEditandoIdx != null && surveysMemoria[_surveyEditandoIdx]) {
            surveysMemoria[_surveyEditandoIdx].latitude = +pos.lat.toFixed(8);
            surveysMemoria[_surveyEditandoIdx].longitude = +pos.lng.toFixed(8);
        }
    });
}

// ============================================
// TORNAR MARCADOR DE SURVEY ARRASTÁVEL
// ============================================
function tornarMarcadorArrastavel(marker, surveyRef) {
    marker.on('mousedown', () => marker.dragging.enable());
    marker.on('dragend', () => {
        const pos = marker.getLatLng();
        if (surveyRef) {
            surveyRef.latitude = +pos.lat.toFixed(8);
            surveyRef.longitude = +pos.lng.toFixed(8);
            if (marcadorAtual === marker) {
                const setH = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
                setH('surveyLatitude', pos.lat.toFixed(8));
                setH('surveyLongitude', pos.lng.toFixed(8));
                document.getElementById('coordsDisplay').textContent = `${pos.lat.toFixed(8)}, ${pos.lng.toFixed(8)}`;
                document.getElementById('origemDisplay').textContent = 'Ajustado manualmente (arrastado)';
            }
        }
    });
}

// ============================================
// CLIQUE DIREITO
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
// SELECIONAR LOGRADOURO → SURVEY
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
            const lat = COORD_DEFAULT_FALLBACK.lat;
            const lng = COORD_DEFAULT_FALLBACK.lng;
            setH('surveyLatitude', lat.toFixed(8));
            setH('surveyLongitude', lng.toFixed(8));
            enderecoBaseSelecionado.lat = lat;
            enderecoBaseSelecionado.lng = lng;
            irParaLocal(lat, lng, montarTextoLogradouro(enderecoBaseSelecionado), 'Roteiro (coord. padrão)');
            showToast(
                'Coordenada padrão aplicada',
                'O logradouro não foi encontrado no OpenStreetMap. Ajuste manualmente com o botão direito no mapa se precisar.',
                'warning',
                6000
            );
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
            recolherCard('resultsPanel');
            expandirCard('formPanel');
            irParaCard('formPanel');
        });
    });
}

// ============================================
// ADICIONAR AO SURVEY / SALVAR EDIÇÃO
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

    // ===== CASO 1: SALVAR EDIÇÃO =====
    if (_surveyEditandoIdx != null && surveysMemoria[_surveyEditandoIdx]) {
        const s = surveysMemoria[_surveyEditandoIdx];
        s.logradouro = { ...enderecoBaseSelecionado };
        s.numero = numero;
        s.pisos = pisos || null;
        s.complementos = complementos;
        s.latitude = lat;
        s.longitude = lng;
        s._ia = false;

        showToast('Edição salva', 'Survey atualizado.', 'success', 2500);

        ['numeroInput','pisosInput','comp1Tipo','comp1Valor','comp2Tipo','comp2Valor','comp3Tipo','comp3Valor'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        cancelarEdicaoSurvey();
        renderizarSurveys();
        return;
    }

    // ===== CASO 2: ADICIONAR NOVO =====
    _surveyIdSeq += 1;
    surveysMemoria.push({
        _id: 'mem_' + _surveyIdSeq,
        _ia: false,
        logradouro: { ...enderecoBaseSelecionado },
        numero: numero,
        pisos: pisos || null,
        complementos: complementos,
        latitude: lat,
        longitude: lng,
        created_at: new Date().toISOString()
    });

    showToast('Survey salvo', 'Nº e complementos adicionados à lista.', 'success', 2500);

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
    verificarIAAutomatica();
});

// ============================================
// EDITAR SURVEY EXISTENTE
// ============================================
function abrirEdicaoSurvey(idx) {
    const s = surveysMemoria[idx];
    if (!s) return;

    _surveyEditandoIdx = idx;
    const l = s.logradouro || {};

    const setH = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setH('surveyTipo', l.tipo || 'Rua');
    setH('surveyLogradouro', l.rua || '');
    setH('surveyBairro', l.bairro || '');
    setH('surveyMunicipio', l.cidade || '');
    setH('surveyUf', l.estado || '');
    setH('surveyCep', l.cep || '');

    setH('numeroInput', s.numero || '');
    setH('pisosInput', s.pisos || '');

    const comps = Array.isArray(s.complementos) ? s.complementos : [];
    setH('comp1Tipo', comps[0] ? comps[0].tipo : '');
    setH('comp1Valor', comps[0] ? comps[0].valor : '');
    setH('comp2Tipo', comps[1] ? comps[1].tipo : '');
    setH('comp2Valor', comps[1] ? comps[1].valor : '');
    setH('comp3Tipo', comps[2] ? comps[2].tipo : '');
    setH('comp3Valor', comps[2] ? comps[2].valor : '');

    setH('surveyLatitude', s.latitude != null ? Number(s.latitude).toFixed(8) : '');
    setH('surveyLongitude', s.longitude != null ? Number(s.longitude).toFixed(8) : '');

    const infoBox = document.getElementById('enderecoBaseInfo');
    if (infoBox) {
        const linha1 = [l.tipo, l.rua].filter(Boolean).join(' ') || '—';
        const linha2 = [
            l.bairro,
            [l.cidade, l.estado].filter(Boolean).join('/')
        ].filter(Boolean).join(' • ');
        infoBox.innerHTML = `
            <div class="endereco-base-card" style="border-left:3px solid var(--warning);">
                <span class="fonte-badge" style="background:var(--warning);">✏️ Editando</span>
                <p class="endereco-base-linha1">${escapeHtml(linha1)}</p>
                <p class="endereco-base-linha2">${escapeHtml(linha2)}</p>
            </div>
        `;
    }

    enderecoBaseSelecionado = { ...l, _registro_id: l._registro_id };

    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Salvar edição
        `;
        addBtn.style.background = 'var(--warning)';
    }

    let cancelBtn = document.getElementById('cancelarEdicaoBtn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelarEdicaoBtn';
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancelar edição';
        cancelBtn.style.cssText = 'margin-top:8px;padding:10px;background:transparent;color:var(--text-secondary);border:1px solid var(--border-medium);border-radius:8px;cursor:pointer;font-family:inherit;font-weight:500;width:100%;';
        cancelBtn.addEventListener('click', cancelarEdicaoSurvey);
        addBtn.parentNode.insertBefore(cancelBtn, addBtn.nextSibling);
    }
    cancelBtn.style.display = '';

    expandirCard('formPanel');
    irParaCard('formPanel');
    showToast('Modo edição', 'Ajuste os dados e clique em "Salvar edição".', 'info', 3000);
}

function cancelarEdicaoSurvey() {
    _surveyEditandoIdx = null;
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Adicionar ao Survey
        `;
        addBtn.style.background = '';
    }
    const cancelBtn = document.getElementById('cancelarEdicaoBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';

    const infoBox = document.getElementById('enderecoBaseInfo');
    if (infoBox) {
        infoBox.innerHTML = '<p class="empty-state-sm">Selecione uma fonte em "Endereços Encontrados".</p>';
    }
    enderecoBaseSelecionado = null;
}

// ============================================
// RENDERIZAR SURVEYS SALVOS
// ============================================
function renderizarSurveys() {
    const panel = document.getElementById('listPanel');
    const tbody = document.querySelector('#surveysTable tbody');
    if (!panel || !tbody) return;

    tbody.innerHTML = '';

    const exportHeader = document.getElementById('exportHeaderBtn');
    if (exportHeader) exportHeader.style.display = surveysMemoria.length > 0 ? '' : 'none';

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
        if (s._ia) tr.className = 'linha-ia';
        tr.innerHTML = `
            <td title="${escapeHtml([l.tipo, l.rua].filter(Boolean).join(' '))}">${escapeHtml([l.tipo, l.rua].filter(Boolean).join(' ') || '—')}${s._ia ? '<span class="ia-tag">🤖 IA</span>' : ''}</td>
            <td>${escapeHtml(s.numero || '')}</td>
            <td title="${escapeHtml(compTexto)}">${escapeHtml(compTexto)}</td>
            <td>${escapeHtml(l.bairro || '')}</td>
            <td>${escapeHtml([l.cidade, l.estado].filter(Boolean).join('/') || '')}</td>
            <td class="mono">${escapeHtml(formatarCEP(l.cep || ''))}</td>
            <td class="acoes-cell">
                <button class="btn-editar" data-idx="${idx}" title="Editar" type="button">✏️</button>
                <button class="btn-ir" data-idx="${idx}" title="Centralizar no mapa" type="button">🗺️</button>
                <button class="btn-remover" data-id="${s._id}" title="Remover" type="button">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => abrirEdicaoSurvey(parseInt(btn.dataset.idx, 10)));
    });

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
            marcadorAtual = L.marker([lat, lng], { icon: s._ia ? houseIconIA : houseIcon, draggable: false }).addTo(map);
            const nome = s.logradouro ? s.logradouro.rua : '';
            marcadorAtual.bindPopup(`<strong>${escapeHtml(nome)}, ${escapeHtml(s.numero || '')}</strong>`).openPopup();
            tornarMarcadorArrastavel(marcadorAtual, s);
            document.getElementById('panel2').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

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

function renderizarMarcadoresSurveys() {
    marcadoresSurveys.forEach(m => map.removeLayer(m));
    marcadoresSurveys = [];

    surveysMemoria.forEach(s => {
        const lat = s.latitude != null ? Number(s.latitude) : (s.logradouro && s.logradouro.lat);
        const lng = s.longitude != null ? Number(s.longitude) : (s.logradouro && s.logradouro.lng);
        if (lat == null || lng == null) return;
        const icon = s._ia ? houseIconIA : houseIcon;
        const m = L.marker([lat, lng], { icon: icon, draggable: false }).addTo(map);
        const nome = s.logradouro ? s.logradouro.rua : '';
        m.bindPopup(`<strong>${escapeHtml(nome)}, ${escapeHtml(s.numero || '')}</strong>`);
        tornarMarcadorArrastavel(m, s);
        marcadoresSurveys.push(m);
    });
}

// ============================================
// LIMPAR TUDO
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
    _iaJaDisparou = false;
    showToast('Lista limpa', 'Todos os surveys foram removidos.', 'success', 2500);
    renderizarSurveys();
});

// ============================================
// EXPORTAR XMLs (ZIP)
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
        const pad = (n) => String(n).padStart(2, '0');
        const carimbo = `${agora.getFullYear()}${pad(agora.getMonth()+1)}${pad(agora.getDate())}${pad(agora.getHours())}${pad(agora.getMinutes())}${pad(agora.getSeconds())}`;
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

        surveysMemoria = [];
        marcadoresSurveys.forEach(m => map.removeLayer(m));
        marcadoresSurveys = [];
        _iaJaDisparou = false;

        showToast('ZIP gerado', `${total} moradia(s) exportada(s). Lista limpa.`, 'success', 4000);
        renderizarSurveys();
    } catch (err) {
        console.error(err);
        showToast('Erro ao gerar ZIP', err.message, 'error');
    }
});

// ============================================
// GERAR XML NO FORMATO "edificio" (novo padrão)
// - Tags vazias SEMPRE com forma longa: <tag></tag>
// - Complementos vazios são OMITIDOS do XML
// ============================================
// ============================================
// GERAR XML NO FORMATO "edificio" (novo padrão)
// - Tags vazias SEMPRE com forma longa: <tag></tag>
// - Complementos vazios são OMITIDOS do XML
// - Sem auto-fechamento em nenhuma hipótese
// ============================================
function gerarXMLEdificio(survey, logradouro, numero) {
    const l = logradouro || {};
    const xmlEscape = (v) => {
        if (v == null) return '';
        return String(v)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    // Helper: garante SEMPRE a forma <tag>valor</tag>, sem abreviar
    const tag = (nome, valor) => {
        const v = (valor == null ? '' : String(valor));
        // Usa interpolação simples — a string resultante é literalmente `<tag>valor</tag>`
        return '<' + nome + '>' + xmlEscape(v) + '</' + nome + '>';
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

    const nEdificio = '';
    const codigoZona = 'Neutra';
    const nomeZona = 'Neutra';
    const localidade = l.localidade || l.cidade || '';
    const idEdificio = '';
    const numeroFachada = survey.numero || 'SN';

    // ===== COMPLEMENTOS: só os que têm tipo E valor =====
    const comps = Array.isArray(survey.complementos) ? survey.complementos : [];
    const compsValidos = comps
        .map(c => ({
            tipo: (c.tipo || '').trim(),
            valor: (c.valor || '').trim()
        }))
        .filter(c => c.tipo && c.valor);

    // Bloco de complementos (só emite as linhas dos que existem)
    let blocoComplementos = '';
    compsValidos.forEach((c, i) => {
        const n = i + 1;
        blocoComplementos += '    ' + tag('id_complemento' + n, getIdComplemento(c.tipo)) + '\n';
        blocoComplementos += '    ' + tag('argumento' + n, c.valor) + '\n';
    });

    const cep = (l.cep || '').toString().replace(/\D/g, '');
    const idRoteiro = l.id_roteiro || l._registro_id || '';
    const idLocalidade = l.id_localidade || '';
    const numPisos = survey.pisos && !isNaN(parseInt(survey.pisos, 10)) ? String(parseInt(survey.pisos, 10)) : '1';

    // ===== MONTA A STRING FINAL (sem parser intermediário) =====
    // Cada linha é concatenada manualmente para evitar qualquer transformação
    let xml = '';
    xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<edificio tipo="M" versao="7.9.2">\n';
    xml += '  ' + tag('gravado', 'false') + '\n';
    xml += '  ' + tag('nEdificio', nEdificio) + '\n';
    xml += '  ' + tag('coordX', coordX) + '\n';
    xml += '  ' + tag('coordY', coordY) + '\n';
    xml += '  ' + tag('codigoZona', codigoZona) + '\n';
    xml += '  ' + tag('nomeZona', nomeZona) + '\n';
    xml += '  ' + tag('localidade', localidade) + '\n';
    xml += '  <enderecoEdificio>\n';
    xml += '    ' + tag('id', idEdificio) + '\n';
    xml += '    ' + tag('logradouro', logradouroCompleto) + '\n';
    xml += '    ' + tag('numero_fachada', numeroFachada) + '\n';
    xml += blocoComplementos; // já vem com 4 espaços e \n
    xml += '    ' + tag('cep', cep) + '\n';
    xml += '    ' + tag('bairro', bairro) + '\n';
    xml += '    ' + tag('id_roteiro', idRoteiro) + '\n';
    xml += '    ' + tag('id_localidade', idLocalidade) + '\n';
    xml += '    ' + tag('cod_lograd', codLograd) + '\n';
    xml += '  </enderecoEdificio>\n';
    xml += '  <tecnico>\n';
    xml += '    ' + tag('id', TECNICO_FIXO_ID) + '\n';
    xml += '    ' + tag('nome', TECNICO_FIXO_NOME) + '\n';
    xml += '  </tecnico>\n';
    xml += '  <empresa>\n';
    xml += '    ' + tag('id', '6') + '\n';
    xml += '    ' + tag('nome', 'LOGICTEL') + '\n';
    xml += '  </empresa>\n';
    xml += '  ' + tag('data', dataFormatada) + '\n';
    xml += '  ' + tag('totalUCs', '1') + '\n';
    xml += '  ' + tag('ocupacao', 'EDIFICACAOCOMPLETA') + '\n';
    xml += '  ' + tag('numPisos', numPisos) + '\n';
    xml += '  ' + tag('destinacao', 'RESIDENCIA') + '\n';
    xml += '</edificio>\n';

    return xml;
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
// IA LOGICTEL — CHAT CONTROLLER
// ============================================
const iaChatEl = document.getElementById('iaChat');
const iaFabEl = document.getElementById('iaFab');
const iaFabBadge = document.getElementById('iaFabBadge');
const iaChatBody = document.getElementById('iaChatBody');
const iaChatHeader = document.getElementById('iaChatHeader');
const iaMinimizeBtn = document.getElementById('iaMinimizeBtn');
const iaCloseBtn = document.getElementById('iaCloseBtn');

let iaPendencia = null;
let iaNaoLidas = 0;

function inicializarChatIA() {
    if (!iaChatEl) return;

    iaChatHeader?.addEventListener('click', (e) => {
        if (e.target.closest('.ia-chat-actions')) return;
        abrirChatIA();
    });

    iaMinimizeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        minimizarChatIA();
    });

    iaCloseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        fecharChatIA();
    });

    iaFabEl?.addEventListener('click', abrirChatIA);

    document.getElementById('detectarPadroesBtn')?.addEventListener('click', () => {
        abrirChatIA();
        detectarPadroes(true);
    });
}

function abrirChatIA() {
    if (!iaChatEl) return;
    iaChatEl.dataset.state = 'open';
    if (iaFabEl) iaFabEl.style.display = 'none';
    iaNaoLidas = 0;
    if (iaFabBadge) iaFabBadge.style.display = 'none';
    iaChatBody.scrollTop = iaChatBody.scrollHeight;
}

function minimizarChatIA() {
    if (!iaChatEl) return;
    iaChatEl.dataset.state = 'minimized';
    if (iaFabEl) iaFabEl.style.display = 'none';
}

function fecharChatIA() {
    if (!iaChatEl) return;
    iaChatEl.dataset.state = 'closed';
    if (iaFabEl) iaFabEl.style.display = '';
    if (iaNaoLidas > 0 && iaFabBadge) {
        iaFabBadge.style.display = '';
        iaFabBadge.textContent = String(iaNaoLidas);
    }
}

function adicionarTypingIA() {
    if (!iaChatBody) return;
    const typing = document.createElement('div');
    typing.className = 'ia-msg ia-msg-ia';
    typing.id = 'iaTyping';
    typing.innerHTML = '<div class="ia-typing"><span></span><span></span><span></span></div>';
    iaChatBody.appendChild(typing);
    iaChatBody.scrollTop = iaChatBody.scrollHeight;
}

function escreverMensagemIA(html, delay = 500) {
    adicionarTypingIA();
    setTimeout(() => {
        const typing = document.getElementById('iaTyping');
        if (typing) typing.remove();
        const div = document.createElement('div');
        div.className = 'ia-msg ia-msg-ia';
        div.innerHTML = html;
        iaChatBody.appendChild(div);
        iaChatBody.scrollTop = iaChatBody.scrollHeight;
        if (iaChatEl.dataset.state !== 'open') {
            iaNaoLidas++;
            if (iaFabBadge) {
                iaFabBadge.style.display = '';
                iaFabBadge.textContent = String(iaNaoLidas);
            }
        }
    }, delay);
}

function escreverMensagemUser(texto) {
    if (!iaChatBody) return;
    const div = document.createElement('div');
    div.className = 'ia-msg ia-msg-user';
    div.textContent = texto;
    iaChatBody.appendChild(div);
    iaChatBody.scrollTop = iaChatBody.scrollHeight;
}

// ============================================
// IA — VERIFICAR SE DEVE DISPARAR APÓS 5 SURVEYS
// ============================================
function verificarIAAutomatica() {
    if (_iaJaDisparou) return;
    if (surveysMemoria.length < 5) return;

    const grupos = {};
    surveysMemoria.forEach(s => {
        const key = (s.logradouro && s.logradouro.rua) ? s.logradouro.rua.toUpperCase() : '—';
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(s);
    });

    let grupoValido = null;
    for (const key in grupos) {
        if (grupos[key].length >= 5) { grupoValido = grupos[key]; break; }
    }
    if (!grupoValido) return;

    _iaJaDisparou = true;
    abrirChatIA();
    setTimeout(() => detectarPadroes(false), 800);
}

// ============================================
// IA — DETECÇÃO DE PADRÕES
// ============================================
function detectarPadroes(manual) {
    if (!surveysMemoria || surveysMemoria.length < 5) {
        escreverMensagemIA(
            `Olá! Eu sou a <strong>IA Logictel</strong>.<br><br>
            Para detectar padrões, preciso de pelo menos <strong>5 surveys</strong> cadastrados.
            Você tem <strong>${surveysMemoria ? surveysMemoria.length : 0}</strong> até agora.<br><br>
            Cadastre mais alguns e clique em <strong>🔍 Detectar Padrões</strong> novamente.`
        );
        return;
    }

    const lista = [...surveysMemoria].sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
    );

    const padrao = encontrarPadrao(lista);

    if (!padrao) {
        const grupos = {};
        lista.forEach(s => {
            const key = (s.logradouro && s.logradouro.rua) ? s.logradouro.rua.toUpperCase() : '—';
            if (!grupos[key]) grupos[key] = [];
            grupos[key].push(s);
        });

        let grupo = null;
        for (const k in grupos) if (grupos[k].length >= 5) { grupo = grupos[k]; break; }

        if (grupo) {
            iaPendencia = {
                tipo: 'generico',
                quantidade: grupo.length,
                descricao: 'registros no mesmo logradouro',
                enderecoResumo: `${grupo[0].logradouro.tipo || ''} ${grupo[0].logradouro.rua}, ${grupo[0].logradouro.bairro || ''}`.trim(),
                campo: null,
                ultimoValor: null,
                delta: null,
                ultimos: grupo.slice(-5)
            };

            escreverMensagemIA(
                `IA Logictel observou que você cadastrou <strong>${grupo.length} surveys</strong> no mesmo endereço 
                <strong>${escapeHtml(iaPendencia.enderecoResumo)}</strong>.<br><br>
                Não consegui identificar automaticamente um campo com progressão clara. 
                Ainda assim, <strong>deseja criar um sequencial automático</strong> para esse endereço?`,
                false
            );

            setTimeout(() => {
                const wrapper = document.createElement('div');
                wrapper.className = 'ia-msg ia-msg-ia';
                wrapper.innerHTML = `
                    <div class="ia-msg-actions">
                        <button class="ia-btn ia-btn-success" id="iaSimBtn" type="button">Sim</button>
                        <button class="ia-btn ia-btn-secondary" id="iaNaoBtn" type="button">Não</button>
                    </div>
                `;
                iaChatBody.appendChild(wrapper);
                iaChatBody.scrollTop = iaChatBody.scrollHeight;

                document.getElementById('iaSimBtn').addEventListener('click', () => {
                    escreverMensagemUser('Sim');
                    wrapper.querySelector('.ia-msg-actions').remove();
                    perguntarTipoIncremento();
                });
                document.getElementById('iaNaoBtn').addEventListener('click', () => {
                    escreverMensagemUser('Não');
                    wrapper.querySelector('.ia-msg-actions').remove();
                    escreverMensagemIA('Tudo bem! Continue cadastrando manualmente.');
                    iaPendencia = null;
                    _iaJaDisparou = false;
                });
            }, 500);

            return;
        }

        escreverMensagemIA(
            `Analisei seus <strong>${lista.length}</strong> surveys e <strong>não encontrei um padrão claro</strong>.<br><br>
            Para eu detectar, os 5 últimos precisam ter:
            <ul style="margin:8px 0 8px 16px;font-size:0.8rem;">
                <li>Mesmo logradouro e mesma fachada; ou</li>
                <li>Mesmo logradouro e mesma combinação de complementos fixos, com <strong>1 valor incrementando</strong> (1,2,3,4,5).</li>
            </ul>`
        );
        return;
    }

    iaPendencia = padrao;
    escreverMensagemIA(
        `IA Logictel observou um <strong>padrão de ${padrao.quantidade} ${padrao.descricao}</strong> 
        no endereço <strong>${escapeHtml(padrao.enderecoResumo)}</strong>.<br><br>
        Deseja continuar a sequência automaticamente?`,
        false
    );

    setTimeout(() => {
        const wrapper = document.createElement('div');
        wrapper.className = 'ia-msg ia-msg-ia';
        wrapper.innerHTML = `
            <div class="ia-msg-actions">
                <button class="ia-btn ia-btn-success" id="iaSimBtn" type="button">Sim</button>
                <button class="ia-btn ia-btn-secondary" id="iaNaoBtn" type="button">Não</button>
            </div>
        `;
        iaChatBody.appendChild(wrapper);
        iaChatBody.scrollTop = iaChatBody.scrollHeight;

        document.getElementById('iaSimBtn').addEventListener('click', () => {
            escreverMensagemUser('Sim');
            wrapper.querySelector('.ia-msg-actions').remove();
            perguntarQuantidade();
        });
        document.getElementById('iaNaoBtn').addEventListener('click', () => {
            escreverMensagemUser('Não');
            wrapper.querySelector('.ia-msg-actions').remove();
            escreverMensagemIA('Tudo bem! Se precisar, é só clicar em <strong>🔍 Detectar Padrões</strong> novamente.');
            iaPendencia = null;
            _iaJaDisparou = false;
        });
    }, 500);
}

// ============================================
// IA — PERGUNTAR QUAL CAMPO INCREMENTAR
// ============================================
function perguntarTipoIncremento() {
    if (!iaPendencia) return;

    const div = document.createElement('div');
    div.className = 'ia-msg ia-msg-ia';
    div.id = 'iaPerguntaTipo';
    div.innerHTML = `
        Qual campo devo incrementar automaticamente?<br>
        <small style="color:var(--text-tertiary)">Vou continuar a sequência a partir do último valor.</small>
        <div class="ia-msg-actions" style="margin-top:8px;">
            <button class="ia-btn" data-campo="numero" type="button">Nº Fachada</button>
            <button class="ia-btn" data-campo="comp0" type="button">Complemento 1</button>
            <button class="ia-btn" data-campo="comp1" type="button">Complemento 2</button>
            <button class="ia-btn" data-campo="comp2" type="button">Complemento 3</button>
        </div>
    `;
    iaChatBody.appendChild(div);
    iaChatBody.scrollTop = iaChatBody.scrollHeight;

    div.querySelectorAll('button[data-campo]').forEach(btn => {
        btn.addEventListener('click', () => {
            const campo = btn.dataset.campo;
            escreverMensagemUser(btn.textContent);
            div.remove();

            const ultimos = iaPendencia.ultimos;
            const ultimo = ultimos[ultimos.length - 1];

            if (campo === 'numero') {
                const n = parseInt(String(ultimo.numero).replace(/\D/g, ''), 10);
                iaPendencia.tipo = 'fachada';
                iaPendencia.campo = 'numero';
                iaPendencia.ultimoValor = isNaN(n) ? 0 : n;
                iaPendencia.delta = 1;
                iaPendencia.descricao = 'fachadas';
            } else {
                const idx = parseInt(campo.replace('comp', ''), 10);
                const comp = (ultimo.complementos || [])[idx];
                if (!comp) {
                    escreverMensagemIA('Esse complemento está vazio no último survey. Escolha outro.');
                    return;
                }
                const n = parseInt(String(comp.valor).replace(/\D/g, ''), 10);
                iaPendencia.tipo = 'complemento';
                iaPendencia.campo = 'complemento_' + idx;
                iaPendencia.compIndex = idx;
                iaPendencia.ultimoValor = isNaN(n) ? 0 : n;
                iaPendencia.delta = 1;
                iaPendencia.descricao = (comp.tipo || 'complemento').toLowerCase();
            }

            perguntarQuantidade();
        });
    });
}

// ============================================
// IA — PERGUNTAR QUANTIDADE
// ============================================
function perguntarQuantidade() {
    if (!iaPendencia) return;

    const div = document.createElement('div');
    div.className = 'ia-msg ia-msg-ia';
    div.id = 'iaPerguntaQuantidade';
    div.innerHTML = `
        Quantas residências devo cadastrar nesse padrão?<br>
        <small style="color:var(--text-tertiary)">Máximo: 100.</small>
        <div class="ia-msg-input-group">
            <input type="number" id="iaQtdInput" min="1" max="100" placeholder="Ex: 20">
            <button class="ia-btn ia-btn-success" id="iaCriarBtn" type="button">Criar</button>
        </div>
    `;
    iaChatBody.appendChild(div);
    iaChatBody.scrollTop = iaChatBody.scrollHeight;

    const input = document.getElementById('iaQtdInput');
    const btn = document.getElementById('iaCriarBtn');
    input?.focus();

    const executar = () => {
        const qtd = parseInt(input.value, 10);
        if (isNaN(qtd) || qtd < 1) {
            showToast('Valor inválido', 'Informe um número entre 1 e 100.', 'warning');
            return;
        }
        if (qtd > 100) {
            showToast('Limite excedido', 'O máximo é 100 por vez.', 'warning');
            return;
        }
        div.remove();
        escreverMensagemUser(String(qtd));
        gerarSequenciaIA(qtd);
    };

    btn?.addEventListener('click', executar);
    input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); executar(); }
    });
}

// ============================================
// IA — ENCONTRAR PADRÃO
// ============================================
function encontrarPadrao(lista) {
    if (lista.length < 5) return null;

    const ultimos = lista.slice(-5);
    if (ultimos.length < 5) return null;

    const logradouroRef = ultimos[0].logradouro && ultimos[0].logradouro.rua;
    if (!logradouroRef) return null;
    const mesmoLogradouro = ultimos.every(s => s.logradouro && s.logradouro.rua === logradouroRef);
    if (!mesmoLogradouro) return null;

    const l0 = ultimos[0].logradouro;
    const mesmoLocal = ultimos.every(s =>
        s.logradouro &&
        s.logradouro.bairro === l0.bairro &&
        s.logradouro.cidade === l0.cidade &&
        s.logradouro.estado === l0.estado
    );
    if (!mesmoLocal) return null;

    const numeros = ultimos.map(s => parseInt(String(s.numero || '').replace(/\D/g, ''), 10));
    const numsValidos = numeros.every(n => !isNaN(n));
    if (numsValidos) {
        const d1 = numeros[1] - numeros[0];
        const mesmoDelta = d1 !== 0 && numeros.every((n, i) => i === 0 || (n - numeros[i-1]) === d1);
        if (mesmoDelta) {
            return {
                tipo: 'fachada',
                quantidade: 5,
                descricao: 'fachadas',
                enderecoResumo: `${l0.tipo || ''} ${l0.rua}, ${l0.bairro || ''}`.trim(),
                campo: 'numero',
                ultimoValor: numeros[numeros.length - 1],
                delta: d1,
                ultimos: ultimos
            };
        }
    }

    const numComps = Math.max(...ultimos.map(s => (s.complementos || []).length));
    for (let c = 0; c < numComps; c++) {
        const valores = ultimos.map(s => {
            const comp = (s.complementos || [])[c];
            return comp ? parseInt(String(comp.valor).replace(/\D/g, ''), 10) : NaN;
        });
        if (valores.some(v => isNaN(v))) continue;

        const d1 = valores[1] - valores[0];
        const mesmoDelta = d1 !== 0 && valores.every((v, i) => i === 0 || (v - valores[i-1]) === d1);
        if (!mesmoDelta) continue;

        const outrosFixos = ultimos.every(s => {
            if (s.numero !== ultimos[0].numero) return false;
            const comps = s.complementos || [];
            for (let k = 0; k < numComps; k++) {
                if (k === c) continue;
                const a = (comps[k] || {}).valor;
                const b = (ultimos[0].complementos[k] || {}).valor;
                if (a !== b) return false;
                const ta = (comps[k] || {}).tipo;
                const tb = (ultimos[0].complementos[k] || {}).tipo;
                if (ta !== tb) return false;
            }
            return true;
        });
        if (!outrosFixos) continue;

        const tipoRef = (ultimos[0].complementos[c] || {}).tipo || 'complemento';
        return {
            tipo: 'complemento',
            quantidade: 5,
            descricao: tipoRef.toLowerCase(),
            enderecoResumo: `${l0.tipo || ''} ${l0.rua}, ${ultimos[0].numero}, ${l0.bairro || ''}`.trim(),
            campo: 'complemento_' + c,
            compIndex: c,
            ultimoValor: valores[valores.length - 1],
            delta: d1,
            ultimos: ultimos
        };
    }

    return null;
}

// ============================================
// IA — GERAR SEQUÊNCIA
// ============================================
function gerarSequenciaIA(quantidade) {
    if (!iaPendencia) return;

    const pad = iaPendencia;
    const ultimos = pad.ultimos;

    let deltaLat = 0, deltaLng = 0, contDelta = 0;
    for (let i = 1; i < ultimos.length; i++) {
        const a = ultimos[i - 1];
        const b = ultimos[i];
        const latA = a.latitude != null ? Number(a.latitude) : (a.logradouro && a.logradouro.lat);
        const lngA = a.longitude != null ? Number(a.longitude) : (a.logradouro && a.logradouro.lng);
        const latB = b.latitude != null ? Number(b.latitude) : (b.logradouro && b.logradouro.lat);
        const lngB = b.longitude != null ? Number(b.longitude) : (b.logradouro && b.logradouro.lng);
        if (latA != null && lngA != null && latB != null && lngB != null) {
            deltaLat += (latB - latA);
            deltaLng += (lngB - lngA);
            contDelta++;
        }
    }
    if (contDelta > 0) {
        deltaLat /= contDelta;
        deltaLng /= contDelta;
    }

    const ultimoSurvey = ultimos[ultimos.length - 1];
    const ultLat = ultimoSurvey.latitude != null ? Number(ultimoSurvey.latitude) : (ultimoSurvey.logradouro && ultimoSurvey.logradouro.lat);
    const ultLng = ultimoSurvey.longitude != null ? Number(ultimoSurvey.longitude) : (ultimoSurvey.logradouro && ultimoSurvey.logradouro.lng);

    let criados = 0;

    for (let i = 1; i <= quantidade; i++) {
        const novo = JSON.parse(JSON.stringify(ultimoSurvey));
        novo._id = 'ia_' + (++_surveyIdSeq);
        novo._ia = true;
        novo.created_at = new Date().toISOString();

        if (pad.tipo === 'fachada') {
            novo.numero = String(pad.ultimoValor + pad.delta * i);
        } else if (pad.tipo === 'complemento') {
            const comp = novo.complementos[pad.compIndex];
            if (comp) {
                const prefixo = String(comp.valor).replace(/\d+$/, '');
                comp.valor = prefixo + String(pad.ultimoValor + pad.delta * i);
            }
        }

        if (ultLat != null && ultLng != null && (deltaLat !== 0 || deltaLng !== 0)) {
            novo.latitude = +(ultLat + deltaLat * i).toFixed(8);
            novo.longitude = +(ultLng + deltaLng * i).toFixed(8);
        }

        surveysMemoria.push(novo);
        criados++;
    }

    renderizarSurveys();
    expandirCard('listPanel');

    escreverMensagemIA(
        `✅ Pronto! Criei <strong>${criados} novos surveys</strong> continuando o padrão.<br><br>
        Eles aparecem na lista com <strong>fundo verde</strong> e a etiqueta <strong>🤖 IA</strong> para você diferenciar.`
    );

    iaPendencia = null;
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
