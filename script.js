// ============================================
// PROTEÇÃO DE ROTA + DIAGNÓSTICO
// ============================================
console.log('[INDEX] supabaseClient:', typeof supabaseClient, supabaseClient);
console.log('[INDEX] usuarioLogado (sessionStorage):', sessionStorage.getItem('usuarioLogado'));

if (!sessionStorage.getItem('usuarioLogado')) {
    console.warn('[INDEX] sem usuarioLogado — redirecionando para login');
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
// ESTADO GLOBAL
// ============================================
async function iniciar() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        console.error('[INDEX] supabaseClient não definido!');
        showToast('Erro', 'Supabase não carregado. Abra o console (F12).', 'error', 8000);
        return;
    }

    console.log('[INDEX] verificando sessão...');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    console.log('[INDEX] getUser resultado:', { user, authError });

    if (authError) console.error('[AUTH] erro:', authError);

    if (!user) {
        console.warn('[INDEX] sem usuário autenticado — redirecionando para login');
        sessionStorage.removeItem('usuarioLogado');
        sessionStorage.removeItem('usuarioNome');
        window.location.href = 'login.html';
        return;
    }

    usuarioAtual = user;
    console.log('[AUTH] usuário logado:', user.id, user.email);

    const nome = sessionStorage.getItem('usuarioNome') || sessionStorage.getItem('usuarioLogado') || '-';
    document.getElementById('userLabel').textContent = nome;

    setTimeout(() => map.invalidateSize(), 200);
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
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles © Esri', maxZoom: 22, maxNativeZoom: 19 }).addTo(map);

let marcadorAtual = null;
let enderecosEncontrados = [];
let enderecoBaseSelecionado = null;

// ============================================
// CASINHA SVG
// ============================================
const houseSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42"><path d="M16 1 L1 15 L1 17 L5 17 L5 33 L12 33 L12 24 L20 24 L20 33 L27 33 L27 17 L31 17 L31 15 Z" fill="#2a4fd6" stroke="#1e3c72" stroke-width="0.6" stroke-linejoin="round"/><rect x="7" y="5" width="4" height="7" fill="#2a4fd6" stroke="#1e3c72" stroke-width="0.6"/><ellipse cx="16" cy="41" rx="9" ry="1.2" fill="rgba(0,0,0,0.25)"/></svg>`;
const houseIcon = L.divIcon({ className: 'house-marker', html: houseSVG, iconSize: [14, 18], iconAnchor: [7, 18], popupAnchor: [0, -18] });

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
        if (btn.dataset.target === 'panel2-body' && !t.classList.contains('collapsed')) {
            setTimeout(() => map.invalidateSize(), 300);
        }
    });
});

document.querySelectorAll('.panel h2').forEach(h2 => {
    h2.addEventListener('click', (e) => {
        if (e.target.closest('.toggle-btn')) return;
        const btn = h2.querySelector('.toggle-btn');
        if (btn) btn.click();
    });
});

// ============================================
// SIDE NAV
// ============================================
document.querySelectorAll('.side-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.goto);
        if (!target) return;
        const body = target.querySelector('.panel-body');
        const toggle = target.querySelector('.toggle-btn');
        if (body && body.classList.contains('collapsed')) {
            body.classList.remove('collapsed');
            if (toggle) {
                toggle.classList.remove('collapsed');
                toggle.setAttribute('aria-expanded', 'true');
            }
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.classList.add('highlight');
        setTimeout(() => target.classList.remove('highlight'), 1000);
        document.querySelectorAll('.side-nav button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// ============================================
// TRAVAR ZOOM
// ============================================
let zoomTravado = true;

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
const zoomLockControlInstance = new zoomLockControl();
map.addControl(zoomLockControlInstance);

function mostrarToastZoom(msg) { showToast('Zoom', msg, 'info', 1800); }

function aplicarTravamento() {
    map.scrollWheelZoom.disable(); map.doubleClickZoom.disable();
    map.touchZoom.disable(); map.boxZoom.disable(); map.keyboard.disable();
    if (map.zoomControl) map.zoomControl.remove();
    const btn = zoomLockControl._btn;
    btn.innerHTML = '🔒'; btn.title = 'Destravar zoom (Ctrl + B)';
    btn.classList.add('locked');
}

function aplicarDestravamento() {
    map.scrollWheelZoom.enable(); map.doubleClickZoom.enable();
    map.touchZoom.enable(); map.boxZoom.enable(); map.keyboard.enable();
    if (!map.zoomControl) map.zoomControl = L.control.zoom({ position: 'topleft' }).addTo(map);
    const btn = zoomLockControl._btn;
    btn.innerHTML = '🔓'; btn.title = 'Travar zoom (Ctrl + B)';
    btn.classList.remove('locked');
}

function toggleZoomLock() {
    zoomTravado = !zoomTravado;
    if (zoomTravado) { aplicarTravamento(); mostrarToastZoom('Zoom travado'); }
    else { aplicarDestravamento(); mostrarToastZoom('Zoom destravado'); }
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); toggleZoomLock(); }
});
aplicarTravamento();

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
// AUTOCOMPLETE — motor de busca
// ============================================
const searchInput = document.getElementById('searchInput');
const suggestionsBox = document.getElementById('suggestions');
let debounceTimer = null;
let ultimoQuery = '';
let abortControllerAtual = null;

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);
    if (tentarParseCoordenadas(query)) {
        suggestionsBox.innerHTML = ''; suggestionsBox.style.display = 'none'; return;
    }
    if (query.length < 3) { suggestionsBox.innerHTML = ''; suggestionsBox.style.display = 'none'; return; }
    debounceTimer = setTimeout(() => buscarSugestoes(query), 350);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) buscarEndereco(query);
        suggestionsBox.style.display = 'none';
    }
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) suggestionsBox.style.display = 'none';
});

async function buscarSugestoes(query) {
    if (query === ultimoQuery) return;
    ultimoQuery = query;
    if (abortControllerAtual) abortControllerAtual.abort();
    abortControllerAtual = new AbortController();
    if (tentarParseCoordenadas(query)) return;

    const engine = document.getElementById('engineSelect').value;
    const sugestoes = [];

    // 1) OSM
    if (engine === 'osm' || engine === 'todos') {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=6&accept-language=pt-BR`;
            const res = await fetch(url, { signal: abortControllerAtual.signal });
            const data = await res.json();
            (data || []).forEach(item => {
                const a = item.address || {};
                const partes = [a.road || a.pedestrian || item.display_name.split(',')[0], a.house_number, a.suburb || a.neighbourhood, a.city || a.town || a.village, a.state, a.postcode].filter(Boolean);
                sugestoes.push({
                    origem: 'OSM',
                    texto: [...new Set(partes)].join(', '),
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    rua: a.road || a.pedestrian || '',
                    numero: a.house_number || '',
                    bairro: a.suburb || a.neighbourhood || '',
                    cidade: a.city || a.town || a.village || '',
                    estado: a.state || '',
                    cep: a.postcode || ''
                });
            });
        } catch (err) { if (err.name !== 'AbortError') console.warn('OSM falhou:', err); }
    }

    // 2) LogJáCadastrados (origem = 'Survey')
    if (engine === 'logcadastrados' || engine === 'todos') {
        try {
            const { data, error } = await supabaseClient
                .from('logradouros')
                .select('*')
                .eq('origem', 'Survey')
                .ilike('logradouro', `%${query}%`)
                .limit(10);
            if (!error && data) {
                data.forEach(r => {
                    sugestoes.push({
                        origem: 'LogJáCadastrados',
                        texto: formatarTextoLogradouro(r),
                        lat: r.latitude != null ? Number(r.latitude) : null,
                        lng: r.longitude != null ? Number(r.longitude) : null,
                        rua: r.logradouro || '',
                        numero: '',
                        bairro: r.bairro || '',
                        cidade: r.municipio || '',
                        estado: r.uf || '',
                        cep: r.cep || '',
                        tipo: r.tipo || '',
                        cod_bairro: r.cod_bairro || '',
                        cod_lograd: r.cod_lograd || '',
                        id_roteiro: r.id_roteiro || '',
                        id_localidade: r.id_localidade || '',
                        localidade: r.localidade || '',
                        localidade_abrev: r.localidade_abrev || '',
                        _registro_id: r.id
                    });
                });
            }
        } catch (err) { console.warn('logcadastrados falhou:', err); }
    }

    // 3) LogRoteiros (origem = 'Roteiro XML')
    if (engine === 'logroteiros' || engine === 'todos') {
        try {
            const { data, error } = await supabaseClient
                .from('logradouros')
                .select('*')
                .eq('origem', 'Roteiro XML')
                .ilike('logradouro', `%${query}%`)
                .limit(10);
            if (!error && data) {
                data.forEach(r => {
                    sugestoes.push({
                        origem: 'LogRoteiros',
                        texto: formatarTextoLogradouro(r),
                        lat: r.latitude != null ? Number(r.latitude) : null,
                        lng: r.longitude != null ? Number(r.longitude) : null,
                        rua: r.logradouro || '',
                        numero: '',
                        bairro: r.bairro || '',
                        cidade: r.municipio || '',
                        estado: r.uf || '',
                        cep: r.cep || '',
                        tipo: r.tipo || '',
                        cod_bairro: r.cod_bairro || '',
                        cod_lograd: r.cod_lograd || '',
                        id_roteiro: r.id_roteiro || '',
                        id_localidade: r.id_localidade || '',
                        localidade: r.localidade || '',
                        localidade_abrev: r.localidade_abrev || '',
                        _registro_id: r.id
                    });
                });
            }
        } catch (err) { console.warn('logroteiros falhou:', err); }
    }

    // 4) CEP via ViaCEP se for só número
    const cepLimpo = query.replace(/\D/g, '');
    if (cepLimpo.length === 8 && (engine === 'osm' || engine === 'todos')) {
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, { signal: abortControllerAtual.signal });
            const data = await res.json();
            if (!data.erro) {
                const texto = `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''}, ${data.cep || ''}`.replace(/^,\s*/, '');
                if (!sugestoes.find(s => s.texto === texto)) {
                    sugestoes.unshift({
                        origem: 'ViaCEP',
                        texto,
                        lat: null,
                        lng: null,
                        rua: data.logradouro || '',
                        numero: '',
                        bairro: data.bairro || '',
                        cidade: data.localidade || '',
                        estado: data.uf || '',
                        cep: data.cep || ''
                    });
                }
            }
        } catch (err) { if (err.name !== 'AbortError') console.warn(err); }
    }

    // Renderiza
    suggestionsBox.innerHTML = '';
    if (sugestoes.length === 0) {
        suggestionsBox.innerHTML = '<div class="suggestion-item empty">Nenhum resultado</div>';
        suggestionsBox.style.display = 'block';
        return;
    }
    sugestoes.forEach(s => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        const icone = s.origem === 'OSM' ? '&#128205;' :
                     s.origem === 'LogJáCadastrados' ? '&#11088;' :
                     s.origem === 'LogRoteiros' ? '&#128220;' : '&#128236;';
        div.innerHTML = `<span class="suggestion-icon">${icone}</span>
            <span class="suggestion-text"><strong>${escapeHtml(s.origem)}:</strong> ${escapeHtml(s.texto)}</span>`;
        div.addEventListener('click', () => {
            searchInput.value = s.texto;
            suggestionsBox.style.display = 'none';
            if (s.lat != null && s.lng != null) {
                irParaLocal(s.lat, s.lng, s.texto, s.origem);
                selecionarParaSurvey(s);
            } else {
                selecionarParaSurvey(s);
                showToast('Sem coordenadas', 'Endereço carregado no Survey. Marque o ponto no mapa se quiser.', 'warning', 3500);
            }
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

// ============================================
// BUSCA DIRETA (Enter)
// ============================================
async function buscarEndereco(query) {
    const coords = tentarParseCoordenadas(query);
    if (coords) {
        irParaLocal(coords.lat, coords.lng, `${coords.lat}, ${coords.lng}`, 'coordenadas');
        return;
    }
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1&accept-language=pt-BR`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data || data.length === 0) {
            showToast('Endereço não encontrado', 'Tente outro termo ou marque no mapa.', 'warning');
            return;
        }
        const item = data[0];
        irParaLocal(parseFloat(item.lat), parseFloat(item.lon), item.display_name, 'busca');
    } catch (err) {
        console.error(err);
        showToast('Erro ao buscar endereço', err.message, 'error');
    }
}

document.getElementById('searchBtn').addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) buscarEndereco(query);
    suggestionsBox.style.display = 'none';
});

// ============================================
// IR PARA LOCAL NO MAPA
// ============================================
function irParaLocal(lat, lng, nome, origem = 'busca') {
    map.setView([lat, lng], 17);
    if (marcadorAtual) map.removeLayer(marcadorAtual);
    marcadorAtual = L.marker([lat, lng], { icon: houseIcon }).addTo(map);
    marcadorAtual.bindPopup(`<strong>${escapeHtml(nome)}</strong>`).openPopup();
    document.getElementById('coordsDisplay').textContent = `${lat.toFixed(8)}, ${lng.toFixed(8)}`;
    document.getElementById('origemDisplay').textContent =
        origem === 'busca' ? 'Busca por texto/endereço' :
        origem === 'coordenadas' ? 'Coordenadas informadas' :
        origem === 'manual' ? 'Endereço manual' :
        `Busca: ${origem}`;
    consultarFontes(lat, lng);
}

// ============================================
// CLIQUE DIREITO
// ============================================
map.on('contextmenu', async (e) => {
    e.originalEvent.preventDefault();
    const { lat, lng } = e.latlng;
    if (marcadorAtual) map.removeLayer(marcadorAtual);
    marcadorAtual = L.marker([lat, lng], { icon: houseIcon }).addTo(map);
    marcadorAtual.bindPopup(`Ponto marcado<br>${lat.toFixed(8)}, ${lng.toFixed(8)}`).openPopup();
    document.getElementById('coordsDisplay').textContent = `${lat.toFixed(8)}, ${lng.toFixed(8)}`;
    document.getElementById('origemDisplay').textContent = 'Clique no mapa (botão direito)';
    await consultarFontes(lat, lng);
});

// ============================================
// CONSULTAR FONTES — busca reversa com prioridade ViaCEP
// ============================================
async function consultarFontes(lat, lng) {
    const list = document.getElementById('enderecosList');
    if (!list) return;
    list.innerHTML = '<p class="empty-state"><span class="loading"></span>Consultando fontes...</p>';

    let osm = null;
    let cepOSM = '';
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`;
        const res = await fetch(url);
        const data = await res.json();
        const a = data.address || {};
        osm = {
            origem: 'OpenStreetMap',
            rua: a.road || a.pedestrian || '',
            numero: a.house_number || '',
            bairro: a.suburb || a.neighbourhood || '',
            cidade: a.city || a.town || a.village || '',
            estado: a.state || '',
            cep: a.postcode || '',
            pais: a.country || '',
            lat: lat,
            lng: lng,
            bruto: data.display_name || ''
        };
        cepOSM = (a.postcode || '').replace(/\D/g, '');
    } catch (e) {
        console.warn('OSM reverse falhou:', e);
    }

    const resultados = [];
    const tarefas = [];

    if (cepOSM.length === 8) {
        tarefas.push(
            fetch(`https://viacep.com.br/ws/${cepOSM}/json/`).then(r => r.json()).then(d => {
                if (d && !d.erro) {
                    resultados.push({
                        origem: 'ViaCEP (oficial)',
                        rua: d.logradouro || '',
                        numero: '',
                        bairro: d.bairro || '',
                        cidade: d.localidade || '',
                        estado: d.uf || '',
                        cep: d.cep || '',
                        pais: 'Brasil',
                        lat: lat,
                        lng: lng,
                        bruto: `${d.logradouro || ''}, ${d.bairro || ''}, ${d.localidade || ''} - ${d.uf || ''}`
                    });
                }
            }).catch(() => {})
        );
        tarefas.push(
            fetch(`https://opencep.com/v1/${cepOSM}`).then(r => r.ok ? r.json() : null).then(d => {
                if (d && !d.erro) {
                    resultados.push({
                        origem: 'OpenCEP',
                        rua: d.logradouro || '',
                        numero: '',
                        bairro: d.bairro || '',
                        cidade: d.localidade || '',
                        estado: d.uf || '',
                        cep: d.cep || '',
                        pais: 'Brasil',
                        lat: lat,
                        lng: lng,
                        bruto: `${d.logradouro || ''}, ${d.bairro || ''}, ${d.localidade || ''} - ${d.uf || ''}`
                    });
                }
            }).catch(() => {})
        );
    }

    await Promise.allSettled(tarefas);

    if (osm) resultados.push(osm);

    const vistos = new Set();
    const unicos = resultados.filter(r => {
        if (!r) return false;
        const chave = `${(r.rua || '').toLowerCase()}|${(r.cep || '').replace(/\D/g,'')}`;
        if (vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
    });

    enderecosEncontrados = unicos;

    if (unicos.length === 0) {
        list.innerHTML = '<p class="empty-state">Nenhuma fonte retornou dados para este ponto.</p>';
        return;
    }

    renderizarTabelaFontes(unicos, list);
}

// ============================================
// RENDERIZAR TABELA DE FONTES
// ============================================
function renderizarTabelaFontes(unicos, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';

    const table = document.createElement('table');
    table.className = 'fontes-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Base/Fonte</th>
                <th>Logradouro</th>
                <th>Nº</th>
                <th>Bairro</th>
                <th>Cidade/UF</th>
                <th>CEP</th>
                <th>Ação</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    unicos.forEach((r, idx) => {
        const tr = document.createElement('tr');
        const badgeClass = (r.origem || '').toLowerCase().includes('viacep')
            ? 'fonte-badge oficial'
            : 'fonte-badge';
        tr.innerHTML = `
            <td><span class="${badgeClass}">${escapeHtml(r.origem || r.fonte || '')}</span></td>
            <td>${escapeHtml(r.rua || '—')}</td>
            <td>${escapeHtml(r.numero || '—')}</td>
            <td>${escapeHtml(r.bairro || '—')}</td>
            <td>${escapeHtml([r.cidade, r.estado].filter(Boolean).join('/') || '—')}</td>
            <td class="mono">${escapeHtml(formatarCEP(r.cep))}</td>
            <td><button class="btn-usar-fonte" data-idx="${idx}" type="button">Usar esta fonte</button></td>
        `;
        tbody.appendChild(tr);
    });

    wrapper.appendChild(table);
    container.innerHTML = '';
    container.appendChild(wrapper);

    tbody.querySelectorAll('.btn-usar-fonte').forEach(btn => {
        btn.addEventListener('click', () => {
            const r = unicos[parseInt(btn.dataset.idx, 10)];
            if (!r) return;
            preencherFormulario(r);
            showToast('Fonte aplicada', `Dados de ${r.origem || r.fonte} carregados no Survey.`, 'success', 2500);
        });
    });
}

// ============================================
// PREENCHER SURVEY (seção 4)
// ============================================
function preencherFormulario(r) {
    enderecoBaseSelecionado = {
        origem: r.origem || r.fonte || '',
        rua: r.rua || '',
        numero: r.numero || '',
        bairro: r.bairro || '',
        cidade: r.cidade || '',
        estado: r.estado || '',
        cep: r.cep || '',
        pais: r.pais || 'Brasil',
        lat: r.lat != null ? r.lat : null,
        lng: r.lng != null ? r.lng : null,
        tipo: r.tipo || 'Rua',
        cod_bairro: r.cod_bairro || '',
        cod_lograd: r.cod_lograd || '',
        id_roteiro: r.id_roteiro || '',
        id_localidade: r.id_localidade || '',
        localidade: r.localidade || '',
        localidade_abrev: r.localidade_abrev || '',
        _registro_id: r._registro_id || null
    };

    document.getElementById('surveyTipo').value = r.tipo || 'Rua';
    document.getElementById('surveyLogradouro').value = r.rua || '';
    document.getElementById('surveyBairro').value = r.bairro || '';
    document.getElementById('surveyMunicipio').value = r.cidade || '';
    document.getElementById('surveyUf').value = r.estado || '';
    document.getElementById('surveyCep').value = formatarCEP(r.cep || '');
    document.getElementById('surveyLatitude').value = r.lat != null ? Number(r.lat).toFixed(8) : '';
    document.getElementById('surveyLongitude').value = r.lng != null ? Number(r.lng).toFixed(8) : '';

    const infoBox = document.getElementById('enderecoBaseInfo');
    if (infoBox) {
        const linha1 = [r.tipo, r.rua].filter(Boolean).join(' ') || '—';
        const linha2 = [r.bairro, [r.cidade, r.estado].filter(Boolean).join('/')].filter(Boolean).join(' • ');
        const linha3 = [formatarCEP(r.cep), r.pais].filter(Boolean).join(' • ');
        infoBox.innerHTML = `
            <div class="endereco-base-card">
                <span class="fonte-badge">${escapeHtml(r.origem || r.fonte || '')}</span>
                <p class="endereco-base-linha1">${escapeHtml(linha1)}</p>
                <p class="endereco-base-linha2">${escapeHtml(linha2)}</p>
                ${linha3 ? `<p class="endereco-base-linha3">${escapeHtml(linha3)}</p>` : ''}
            </div>
        `;
    }

    document.getElementById('formPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// SELECIONAR DIRETO DO MOTOR DE BUSCA
// ============================================
function selecionarParaSurvey(s) {
    const r = {
        origem: s.origem,
        tipo: s.tipo || 'Rua',
        rua: s.rua || '',
        numero: s.numero || '',
        bairro: s.bairro || '',
        cidade: s.cidade || '',
        estado: s.estado || '',
        cep: s.cep || '',
        pais: 'Brasil',
        lat: s.lat != null ? s.lat : null,
        lng: s.lng != null ? s.lng : null,
        cod_bairro: s.cod_bairro || '',
        cod_lograd: s.cod_lograd || '',
        id_roteiro: s.id_roteiro || '',
        id_localidade: s.id_localidade || '',
        localidade: s.localidade || '',
        localidade_abrev: s.localidade_abrev || '',
        _registro_id: s._registro_id || null
    };
    enderecoBaseSelecionado = r;

    document.getElementById('surveyTipo').value = r.tipo || 'Rua';
    document.getElementById('surveyLogradouro').value = r.rua || '';
    document.getElementById('surveyBairro').value = r.bairro || '';
    document.getElementById('surveyMunicipio').value = r.cidade || '';
    document.getElementById('surveyUf').value = r.estado || '';
    document.getElementById('surveyCep').value = formatarCEP(r.cep || '');
    document.getElementById('surveyLatitude').value = r.lat != null ? Number(r.lat).toFixed(8) : '';
    document.getElementById('surveyLongitude').value = r.lng != null ? Number(r.lng).toFixed(8) : '';

    const infoBox = document.getElementById('enderecoBaseInfo');
    if (infoBox) {
        const linha1 = [r.tipo, r.rua].filter(Boolean).join(' ') || '—';
        const linha2 = [r.bairro, [r.cidade, r.estado].filter(Boolean).join('/')].filter(Boolean).join(' • ');
        const linha3 = [formatarCEP(r.cep), r.pais].filter(Boolean).join(' • ');
        infoBox.innerHTML = `
            <div class="endereco-base-card">
                <span class="fonte-badge">${escapeHtml(r.origem)}</span>
                <p class="endereco-base-linha1">${escapeHtml(linha1)}</p>
                <p class="endereco-base-linha2">${escapeHtml(linha2)}</p>
                ${linha3 ? `<p class="endereco-base-linha3">${escapeHtml(linha3)}</p>` : ''}
            </div>
        `;
    }

    document.getElementById('formPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// NOVO LOGRADOURO MANUAL
// ============================================
document.getElementById('btnNovoEnderecoManual').addEventListener('click', () => {
    const form = document.getElementById('novoEnderecoForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});
document.getElementById('btnCancelarNovoEndereco').addEventListener('click', () => {
    document.getElementById('novoEnderecoForm').style.display = 'none';
});

document.getElementById('novoCep').addEventListener('blur', async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (data.erro) return;
        if (data.logradouro) document.getElementById('novoLogradouro').value = data.logradouro;
        if (data.bairro) document.getElementById('novoBairro').value = data.bairro;
        if (data.localidade) document.getElementById('novoCidade').value = data.localidade;
        if (data.uf) document.getElementById('novoUf').value = data.uf;
    } catch (err) { console.warn('ViaCEP indisponível', err); }
});

document.getElementById('btnSalvarNovoEndereco').addEventListener('click', () => {
    const cep = document.getElementById('novoCep').value.replace(/\D/g, '');
    const logradouro = document.getElementById('novoLogradouro').value.trim();
    if (cep.length !== 8) { showToast('CEP inválido', 'Informe um CEP com 8 dígitos.', 'warning'); return; }
    if (!logradouro) { showToast('Logradouro obrigatório', 'Informe o logradouro.', 'warning'); return; }

    const tipo = document.getElementById('novoTipo').value;
    const numero = document.getElementById('novoNumero').value.trim();
    const bairro = document.getElementById('novoBairro').value.trim();
    const cidade = document.getElementById('novoCidade').value.trim();
    const uf = document.getElementById('novoUf').value.trim().toUpperCase();

    const novoRegistro = {
        origem: 'Manual',
        tipo: tipo,
        rua: logradouro,
        numero: numero,
        bairro: bairro,
        cidade: cidade,
        estado: uf,
        cep: cep,
        pais: 'Brasil',
        lat: null,
        lng: null
    };

    selecionarParaSurvey(novoRegistro);

    ['novoCep','novoLogradouro','novoNumero','novoBairro','novoCidade','novoUf'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('novoEnderecoForm').style.display = 'none';

    showToast('Endereço carregado no Survey', 'Confira e clique em "Salvar logradouro".', 'success', 3000);
});

// ============================================
// SALVAR LOGRADOURO (botão do Survey)
// ============================================
document.getElementById('addBtn').addEventListener('click', async () => {
    const tipo = document.getElementById('surveyTipo').value.trim();
    const logradouro = document.getElementById('surveyLogradouro').value.trim();
    const bairro = document.getElementById('surveyBairro').value.trim();
    const municipio = document.getElementById('surveyMunicipio').value.trim();
    const uf = document.getElementById('surveyUf').value.trim().toUpperCase();
    const cepRaw = document.getElementById('surveyCep').value.trim();
    const cep = cepRaw.replace(/\D/g, '');
    const latStr = document.getElementById('surveyLatitude').value.trim();
    const lngStr = document.getElementById('surveyLongitude').value.trim();

    if (!logradouro) { showToast('Logradouro obrigatório', 'Informe o nome do logradouro.', 'warning'); return; }
    if (uf && uf.length !== 2) { showToast('UF inválida', 'UF deve ter 2 letras.', 'warning'); return; }

    const lat = latStr && !isNaN(parseFloat(latStr)) ? parseFloat(latStr) : null;
    const lng = lngStr && !isNaN(parseFloat(lngStr)) ? parseFloat(lngStr) : null;

    const registro = {
        tipo: tipo || null,
        logradouro: logradouro,
        bairro: bairro || null,
        municipio: municipio || null,
        uf: uf || null,
        cep: cep || null,
        latitude: lat,
        longitude: lng,
        cod_bairro: (enderecoBaseSelecionado && enderecoBaseSelecionado.cod_bairro) || null,
        cod_lograd: (enderecoBaseSelecionado && enderecoBaseSelecionado.cod_lograd) || null,
        id_roteiro: (enderecoBaseSelecionado && enderecoBaseSelecionado.id_roteiro) || null,
        id_localidade: (enderecoBaseSelecionado && enderecoBaseSelecionado.id_localidade) || null,
        localidade: (enderecoBaseSelecionado && enderecoBaseSelecionado.localidade) || null,
        localidade_abrev: (enderecoBaseSelecionado && enderecoBaseSelecionado.localidade_abrev) || null,
        codigo_zona: null,
        nome_zona: null,
        origem: 'Survey',
        usuario_id: usuarioAtual ? usuarioAtual.id : null
    };

    try {
        if (enderecoBaseSelecionado && enderecoBaseSelecionado._registro_id) {
            const { error } = await supabaseClient
                .from('logradouros')
                .update({ ...registro, updated_at: new Date().toISOString() })
                .eq('id', enderecoBaseSelecionado._registro_id);
            if (error) throw error;
            showToast('Logradouro atualizado', 'Registro atualizado em LogJáCadastrados.', 'success', 3000);
        } else {
            const { data, error } = await supabaseClient
                .from('logradouros')
                .insert([registro])
                .select().single();
            if (error) throw error;
            enderecoBaseSelecionado = { ...enderecoBaseSelecionado, _registro_id: data.id };
            showToast('Logradouro salvo', 'Registro salvo em LogJáCadastrados.', 'success', 3000);
        }

        if (lat != null && lng != null) {
            if (marcadorAtual) map.removeLayer(marcadorAtual);
            marcadorAtual = L.marker([lat, lng], { icon: houseIcon }).addTo(map);
            marcadorAtual.bindPopup(`<strong>${escapeHtml(logradouro)}</strong>`).openPopup();
        }

    } catch (err) {
        console.error('[SALVAR LOGRADOURO] erro:', err);
        showToast('Erro ao salvar', err.message, 'error', 8000);
    }
});

// ============================================
// LIMPAR LISTA (botão do topo)
// ============================================
document.getElementById('novaAreaBtn').addEventListener('click', async () => {
    if (!confirm('Apagar TODOS os logradouros salvos como Survey? (os do roteiro serão mantidos)')) return;
    try {
        const { error } = await supabaseClient
            .from('logradouros')
            .delete()
            .eq('origem', 'Survey');
        if (error) throw error;
        enderecosEncontrados = [];
        document.getElementById('enderecosList').innerHTML =
            '<p class="empty-state">Nenhum endereço consultado ainda.</p>';
        showToast('Lista limpa', 'Logradouros do tipo Survey foram removidos.', 'success', 2500);
    } catch (err) {
        console.error(err);
        showToast('Erro ao limpar', err.message, 'error');
    }
});

// ============================================
// UPLOAD DE ROTEIRO → tabela logradouros (origem='Roteiro XML')
// ============================================
document.getElementById('uploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('roteiroFile');
    const status = document.getElementById('uploadStatus');
    const file = fileInput.files[0];
    if (!file) { showToast('Nenhum arquivo', 'Selecione um arquivo .xml ou .csv.', 'warning'); return; }

    status.textContent = 'Processando arquivo...';

    try {
        const texto = await file.text();
        console.log('[UPLOAD] Arquivo lido. Tamanho:', texto.length, 'bytes.');

        let registros = [];
        const nomeLower = file.name.toLowerCase();

        if (nomeLower.endsWith('.csv')) {
            registros = parseCSV(texto);
        } else if (nomeLower.endsWith('.xml')) {
            registros = parseXMLRoteiro(texto);
        } else {
            throw new Error('Formato não suportado. Use .csv ou .xml');
        }

        console.log('[UPLOAD] Registros parseados:', registros.length);

        if (registros.length === 0) {
            status.textContent = 'Nenhum registro válido.';
            showToast('Sem registros', 'O arquivo não continha dados válidos.', 'warning');
            return;
        }

        const payload = registros.map(r => ({
            tipo: r.tipo || null,
            logradouro: r.rua || r.logradouro || '',
            bairro: r.bairro || null,
            municipio: r.cidade || r.municipio || null,
            uf: r.estado || r.uf || null,
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

        const TAM = 500;
        let inseridos = 0;
        for (let i = 0; i < payload.length; i += TAM) {
            const lote = payload.slice(i, i + TAM);
            const { error } = await supabaseClient.from('logradouros').insert(lote);
            if (error) throw error;
            inseridos += lote.length;
            status.textContent = `Importando... ${inseridos}/${payload.length}`;
        }

        status.textContent = `${inseridos} logradouro(s) importado(s).`;
        showToast('Roteiro importado', `${inseridos} logradouro(s) em LogRoteiros.`, 'success', 3500);
        fileInput.value = '';
    } catch (err) {
        console.error('[UPLOAD] Erro:', err);
        status.textContent = `Erro: ${err.message}`;
        showToast('Erro na importação', err.message, 'error', 8000);
    }
});

// ============================================
// PARSER DE CSV
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
            numero: get('numero') || get('número'),
            bairro: get('bairro'),
            cidade: get('cidade') || get('municipio') || get('localidade'),
            estado: get('estado') || get('uf'),
            cep: get('cep'),
            latitude: isNaN(lat) ? null : lat,
            longitude: isNaN(lng) ? null : lng,
            tipo_lograd: get('tipo_lograd') || '',
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

// ============================================
// PARSER XML (roteiro.xml dos Correios)
// ============================================
function parseXMLRoteiro(texto) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(texto, 'text/xml');

    const parserError = xml.querySelector('parsererror');
    if (parserError) {
        console.error('[XML] Erro de parse:', parserError.textContent);
        throw new Error('XML inválido: ' + parserError.textContent.substring(0, 200));
    }

    let nodes = Array.from(xml.getElementsByTagName('roteiro'));
    if (nodes.length === 0) {
        nodes = Array.from(xml.querySelectorAll('endereco, address, registro, item, linha, edificio'));
    }

    console.log('[XML] Encontrados', nodes.length, 'nós');

    if (nodes.length === 0) {
        throw new Error('Nenhum elemento reconhecido no arquivo.');
    }

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
            tipo_lograd: tipo,
            rua: nomeLograd,
            numero: getText(node, 'numero_fachada') || getText(node, 'numero'),
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
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatarCEP(cep) {
    if (!cep) return '';
    const clean = String(cep).replace(/\D/g, '');
    if (clean.length !== 8) return clean;
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
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