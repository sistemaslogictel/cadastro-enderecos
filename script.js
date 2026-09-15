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
// ÁREA PADRÃO — garante que existe uma área
// ============================================
async function garantirAreaPadrao(forcar = false) {
    let id = sessionStorage.getItem('areaAtualId');
    if (id && !forcar) { areaAtualId = id; return id; }

    try {
        const { data: existentes, error: errBusca } = await supabaseClient
            .from('areas')
            .select('id, nome')
            .eq('nome', 'Geral')
            .limit(1);

        if (errBusca) {
            console.warn('[ÁREA PADRÃO] erro ao buscar:', errBusca);
        }

        if (existentes && existentes.length > 0) {
            id = existentes[0].id;
            sessionStorage.setItem('areaAtualId', id);
            areaAtualId = id;
            return id;
        }

        const { data, error } = await supabaseClient
            .from('areas')
            .insert([{ nome: 'Geral', usuario_id: usuarioAtual ? usuarioAtual.id : null }])
            .select().single();

        if (error) {
            console.error('[ÁREA PADRÃO] erro no INSERT:', error);
            showToast(
                'Erro no banco',
                'INSERT em areas falhou: ' + (error.message || JSON.stringify(error)),
                'error',
                10000
            );
            throw error;
        }

        id = data.id;
        sessionStorage.setItem('areaAtualId', id);
        areaAtualId = id;
        console.log('[ÁREA PADRÃO] criada com id:', id);
        return id;
    } catch (err) {
        console.error('[ÁREA PADRÃO] Erro:', err);
        return null;
    }
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

    await garantirAreaPadrao();
    await carregarAreaAtual();
    await carregarCadastrados();
    setTimeout(() => map.invalidateSize(), 200);
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    sessionStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('usuarioNome');
    sessionStorage.removeItem('areaAtualId');
    window.location.href = 'login.html';
});

// ============================================
// MAPA
// ============================================
const map = L.map('map', { maxZoom: 22, minZoom: 3, zoomControl: false }).setView([-22.90200282, -43.27065822], 15);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles © Esri', maxZoom: 22, maxNativeZoom: 19 }).addTo(map);

let marcadorAtual = null;
let marcadoresSalvos = [];
let enderecosEncontrados = [];
let cadastrados = [];
let areaAtualId = null;
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
// AUTOCOMPLETE
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

    const cepLimpo = query.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, { signal: abortControllerAtual.signal });
            const data = await res.json();
            if (data.erro) {
                suggestionsBox.innerHTML = '<div class="suggestion-item empty">CEP não encontrado</div>';
                suggestionsBox.style.display = 'block';
                return;
            }
            suggestionsBox.innerHTML = '';
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            const texto = `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''}, ${data.cep || ''}`.replace(/^,\s*/, '');
            div.innerHTML = `<span class="suggestion-icon">&#128236;</span><span class="suggestion-text">${escapeHtml(texto)}</span>`;
            div.addEventListener('click', () => {
                searchInput.value = texto;
                suggestionsBox.style.display = 'none';
                buscarEndereco(texto);
            });
            suggestionsBox.appendChild(div);
            suggestionsBox.style.display = 'block';
            return;
        } catch (err) { if (err.name !== 'AbortError') console.error(err); }
    }

    const engine = document.getElementById('engineSelect').value;
    if (engine === 'netwin') return buscarSugestoesNetwin(query, abortControllerAtual.signal);

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=6&accept-language=pt-BR`;
        const res = await fetch(url, { signal: abortControllerAtual.signal });
        const data = await res.json();
        if (!data || data.length === 0) {
            suggestionsBox.innerHTML = '<div class="suggestion-item empty">Nenhum resultado</div>';
            suggestionsBox.style.display = 'block';
            return;
        }
        suggestionsBox.innerHTML = '';
        data.forEach(item => {
            const a = item.address || {};
            const partes = [a.road || a.pedestrian || item.display_name.split(',')[0], a.house_number, a.suburb || a.neighbourhood, a.city || a.town || a.village, a.state, a.postcode].filter(Boolean);
            const texto = [...new Set(partes)].join(', ');
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `<span class="suggestion-icon">&#128205;</span><span class="suggestion-text">${escapeHtml(texto)}</span>`;
            div.addEventListener('click', () => {
                searchInput.value = texto;
                suggestionsBox.style.display = 'none';
                irParaLocal(lat, lng, texto, 'busca');
            });
            suggestionsBox.appendChild(div);
        });
        suggestionsBox.style.display = 'block';
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Erro no autocomplete:', err);
            suggestionsBox.innerHTML = '<div class="suggestion-item empty">Erro ao buscar sugestões</div>';
            suggestionsBox.style.display = 'block';
        }
    }
}

async function buscarSugestoesNetwin(query, signal) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=6&accept-language=pt-BR`;
        const res = await fetch(url, { signal });
        const data = await res.json();
        if (!data || data.length === 0) {
            suggestionsBox.innerHTML = '<div class="suggestion-item empty">Nenhum resultado no Netwin (modo offline)</div>';
            suggestionsBox.style.display = 'block';
            return;
        }
        suggestionsBox.innerHTML = '';
        data.forEach(item => {
            const a = item.address || {};
            const texto = [a.road, a.house_number, a.suburb, a.city, a.state].filter(Boolean).join(', ');
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `<span class="suggestion-icon">&#127760;</span><span class="suggestion-text"><strong>Netwin:</strong> ${escapeHtml(texto)}</span>`;
            div.addEventListener('click', () => {
                searchInput.value = texto;
                suggestionsBox.style.display = 'none';
                irParaLocal(lat, lng, texto, 'netwin');
            });
            suggestionsBox.appendChild(div);
        });
        suggestionsBox.style.display = 'block';
    } catch (err) { if (err.name !== 'AbortError') console.error(err); }
}

function irParaLocal(lat, lng, nome, origem = 'busca') {
    map.setView([lat, lng], 17);
    if (marcadorAtual) map.removeLayer(marcadorAtual);
    marcadorAtual = L.marker([lat, lng], { icon: houseIcon }).addTo(map);
    marcadorAtual.bindPopup(`<strong>${escapeHtml(nome)}</strong>`).openPopup();
    document.getElementById('coordsDisplay').textContent = `${lat.toFixed(8)}, ${lng.toFixed(8)}`;
    document.getElementById('origemDisplay').textContent =
        origem === 'busca' ? 'Busca por texto/endereço' :
        origem === 'coordenadas' ? 'Coordenadas informadas' :
        origem === 'netwin' ? 'Netwin' :
        origem === 'manual' ? 'Endereço manual' :
        'Clique no mapa (botão direito)';
    consultarFontes(lat, lng);
}

async function buscarEndereco(query) {
    const coords = tentarParseCoordenadas(query);
    if (coords) {
        irParaLocal(coords.lat, coords.lng, `${coords.lat}, ${coords.lng}`, 'coordenadas');
        return;
    }
    try {
        const cepLimpo = query.replace(/\D/g, '');
        if (cepLimpo.length === 8 && !isNaN(cepLimpo)) {
            const resCep = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const dataCep = await resCep.json();
            if (!dataCep.erro) {
                const textoCep = `${dataCep.logradouro || ''}, ${dataCep.localidade || ''} - ${dataCep.uf || ''}`;
                return buscarEndereco(textoCep);
            }
        }
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
// CONSULTAR FONTES — prioridade ViaCEP > OpenCEP > OSM
// ============================================
async function consultarFontes(lat, lng) {
    const list = document.getElementById('enderecosList');
    list.innerHTML = '<p class="empty-state"><span class="loading"></span>Consultando fontes...</p>';

    // 1) Primeiro consulta OSM para saber o CEP (aproximado)
    let osm = null;
    let cepOSM = '';
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`;
        const res = await fetch(url);
        const data = await res.json();
        const a = data.address || {};
        osm = {
            fonte: 'OpenStreetMap',
            rua: a.road || a.pedestrian || '',
            numero: a.house_number || '',
            bairro: a.suburb || a.neighbourhood || '',
            cidade: a.city || a.town || a.village || '',
            estado: a.state || '',
            cep: a.postcode || '',
            pais: a.country || '',
            bruto: data.display_name || ''
        };
        cepOSM = (a.postcode || '').replace(/\D/g, '');
    } catch (e) {
        console.warn('OSM falhou:', e);
    }

    // 2) Com o CEP do OSM, consulta ViaCEP e OpenCEP (fontes oficiais)
    const resultados = [];
    const tarefas = [];

    if (cepOSM.length === 8) {
        tarefas.push(
            fetch(`https://viacep.com.br/ws/${cepOSM}/json/`).then(r => r.json()).then(d => {
                if (d && !d.erro) {
                    resultados.push({
                        fonte: 'ViaCEP (oficial)',
                        rua: d.logradouro || '',
                        numero: '',
                        bairro: d.bairro || '',
                        cidade: d.localidade || '',
                        estado: d.uf || '',
                        cep: d.cep || '',
                        pais: 'Brasil',
                        bruto: `${d.logradouro || ''}, ${d.bairro || ''}, ${d.localidade || ''} - ${d.uf || ''}`
                    });
                }
            }).catch(() => {})
        );
        tarefas.push(
            fetch(`https://opencep.com/v1/${cepOSM}`).then(r => r.ok ? r.json() : null).then(d => {
                if (d && !d.erro) {
                    resultados.push({
                        fonte: 'OpenCEP',
                        rua: d.logradouro || '',
                        numero: '',
                        bairro: d.bairro || '',
                        cidade: d.localidade || '',
                        estado: d.uf || '',
                        cep: d.cep || '',
                        pais: 'Brasil',
                        bruto: `${d.logradouro || ''}, ${d.bairro || ''}, ${d.localidade || ''} - ${d.uf || ''}`
                    });
                }
            }).catch(() => {})
        );
    }

    await Promise.allSettled(tarefas);

    // 3) Adiciona OSM por último
    if (osm) resultados.push(osm);

    // 4) Deduplica
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
        if (r.error) {
            tr.innerHTML = `
                <td><span class="fonte-badge error">${escapeHtml(r.fonte)}</span></td>
                <td colspan="5" class="erro-cell">${escapeHtml(r.error)}</td>
                <td>—</td>
            `;
        } else {
            const badgeClass = (r.fonte || '').toLowerCase().includes('viacep') ? 'fonte-badge oficial' : 'fonte-badge';
            tr.innerHTML = `
                <td><span class="${badgeClass}">${escapeHtml(r.fonte)}</span></td>
                <td>${escapeHtml(r.rua || '—')}</td>
                <td>${escapeHtml(r.numero || '—')}</td>
                <td>${escapeHtml(r.bairro || '—')}</td>
                <td>${escapeHtml([r.cidade, r.estado].filter(Boolean).join('/') || '—')}</td>
                <td class="mono">${escapeHtml(formatarCEP(r.cep))}</td>
                <td><button class="btn-usar-fonte" data-idx="${idx}" type="button">Usar esta fonte</button></td>
            `;
        }
        tbody.appendChild(tr);
    });

    wrapper.appendChild(table);
    container.innerHTML = '';
    container.appendChild(wrapper);

    tbody.querySelectorAll('.btn-usar-fonte').forEach(btn => {
        btn.addEventListener('click', () => {
            const r = unicos[parseInt(btn.dataset.idx, 10)];
            if (!r || r.error) return;
            preencherFormulario(r);
            showToast('Fonte aplicada', `Dados de ${r.fonte} carregados.`, 'success', 2500);
        });
    });
}

// ============================================
// PREENCHER FORMULÁRIO
// ============================================
function preencherFormulario(r) {
    enderecoBaseSelecionado = {
        fonte: r.fonte,
        rua: r.rua || '',
        numero: r.numero || '',
        bairro: r.bairro || '',
        cidade: r.cidade || '',
        estado: r.estado || '',
        cep: r.cep || '',
        pais: r.pais || 'Brasil',
        bruto: r.bruto || '',
        cod_bairro: r.cod_bairro || '',
        cod_lograd: r.cod_lograd || '',
        id_roteiro: r.id_roteiro || '',
        id_localidade: r.id_localidade || '',
        localidade: r.localidade || '',
        localidade_abrev: r.localidade_abrev || '',
        tipo_lograd: r.tipo_lograd || ''
    };

    const fonteSelect = document.getElementById('fonteSelect');
    let option = Array.from(fonteSelect.options).find(o => o.value === r.fonte);
    if (!option) {
        option = document.createElement('option');
        option.value = r.fonte;
        option.textContent = r.fonte;
        fonteSelect.appendChild(option);
    }
    fonteSelect.value = r.fonte;

    if (r.numero && !document.getElementById('numeroInput').value) {
        document.getElementById('numeroInput').value = r.numero;
    }

    const infoBox = document.getElementById('enderecoBaseInfo');
    if (infoBox) {
        const linha1 = [r.rua, r.numero].filter(Boolean).join(', ') || '—';
        const linha2 = [r.bairro, [r.cidade, r.estado].filter(Boolean).join('/')].filter(Boolean).join(' • ');
        const linha3 = [formatarCEP(r.cep), r.pais].filter(Boolean).join(' • ');
        infoBox.innerHTML = `
            <div class="endereco-base-card">
                <span class="fonte-badge">${escapeHtml(r.fonte)}</span>
                <p class="endereco-base-linha1">${escapeHtml(linha1)}</p>
                <p class="endereco-base-linha2">${escapeHtml(linha2)}</p>
                ${linha3 ? `<p class="endereco-base-linha3">${escapeHtml(linha3)}</p>` : ''}
            </div>
        `;
    }

    const formBody = document.getElementById('formBody');
    if (formBody && formBody.classList.contains('collapsed')) {
        formBody.classList.remove('collapsed');
        const toggle = document.querySelector('#formPanel .toggle-btn');
        if (toggle) { toggle.classList.remove('collapsed'); toggle.setAttribute('aria-expanded', 'true'); }
    }
    document.getElementById('formPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// NOVO ENDEREÇO MANUAL
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

document.getElementById('btnSalvarNovoEndereco').addEventListener('click', async () => {
    const cep = document.getElementById('novoCep').value.replace(/\D/g, '');
    const logradouro = document.getElementById('novoLogradouro').value.trim();
    if (cep.length !== 8) { showToast('CEP inválido', 'Informe um CEP com 8 dígitos.', 'warning'); return; }
    if (!logradouro) { showToast('Logradouro obrigatório', 'Informe o logradouro.', 'warning'); return; }

    const tipo = document.getElementById('novoTipo').value;
    const numero = document.getElementById('novoNumero').value.trim();
    const complemento = document.getElementById('novoComplemento').value.trim();
    const bairro = document.getElementById('novoBairro').value.trim();
    const cidade = document.getElementById('novoCidade').value.trim();
    const uf = document.getElementById('novoUf').value.trim().toUpperCase();

    let latitude = null, longitude = null;
    try {
        const q = encodeURIComponent(`${logradouro}, ${numero}, ${bairro}, ${cidade} - ${uf}, ${cep}`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&addressdetails=1&limit=1&accept-language=pt-BR`);
        const data = await res.json();
        if (data && data.length > 0) {
            latitude = parseFloat(data[0].lat);
            longitude = parseFloat(data[0].lon);
        }
    } catch (err) { console.warn('Geocoding falhou', err); }

    const novoRegistro = {
        fonte: 'Manual',
        rua: logradouro,
        numero: numero,
        tipo_complemento: '',
        complemento: complemento,
        bairro: bairro,
        cidade: cidade,
        estado: uf,
        cep: cep,
        pais: 'Brasil',
        latitude,
        longitude,
        bruto: `${tipo} ${logradouro}, ${numero}, ${bairro}, ${cidade} - ${uf}, ${formatarCEP(cep)}`,
        tipo_lograd: tipo
    };

    enderecosEncontrados.push(novoRegistro);
    renderizarTabelaFontes(enderecosEncontrados, document.getElementById('enderecosList'));

    if (latitude != null && longitude != null) {
        irParaLocal(latitude, longitude, novoRegistro.bruto, 'manual');
    }

    ['novoCep','novoLogradouro','novoNumero','novoComplemento','novoBairro','novoCidade','novoUf'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('novoEnderecoForm').style.display = 'none';

    showToast('Endereço adicionado', 'Clique em "Usar esta fonte" para preencher os detalhes.', 'success', 3000);
});

// ============================================
// ADICIONAR À LISTA
// ============================================
document.getElementById('addBtn').addEventListener('click', async () => {
    if (!enderecoBaseSelecionado) {
        showToast('Sem endereço base', 'Escolha uma fonte na seção 3 primeiro.', 'warning');
        return;
    }

    const numero = document.getElementById('numeroInput').value.trim();
    if (!numero) { showToast('Número obrigatório', 'Informe o número do imóvel.', 'warning'); return; }

    // Força nova tentativa de criar área, se não tiver
    if (!areaAtualId) {
        await garantirAreaPadrao(true);
    }
    if (!areaAtualId) {
        showToast('Sem área', 'Não foi possível criar a área padrão. Verifique as policies no Supabase.', 'error', 8000);
        return;
    }

    const coordsTexto = document.getElementById('coordsDisplay').textContent;
    const [latStr, lngStr] = coordsTexto.split(',').map(s => s.trim());
    const latitude = !isNaN(parseFloat(latStr)) ? parseFloat(latStr) : (enderecoBaseSelecionado.latitude ?? null);
    const longitude = !isNaN(parseFloat(lngStr)) ? parseFloat(lngStr) : (enderecoBaseSelecionado.longitude ?? null);

    const comp1Tipo = document.getElementById('comp1Tipo').value;
    const comp1Valor = document.getElementById('comp1Valor').value.trim();
    const comp2Tipo = document.getElementById('comp2Tipo').value;
    const comp2Valor = document.getElementById('comp2Valor').value.trim();
    const comp3Tipo = document.getElementById('comp3Tipo').value;
    const comp3Valor = document.getElementById('comp3Valor').value.trim();

    const complementos = [];
    if (comp1Tipo || comp1Valor) complementos.push({ tipo: comp1Tipo, valor: comp1Valor });
    if (comp2Tipo || comp2Valor) complementos.push({ tipo: comp2Tipo, valor: comp2Valor });
    if (comp3Tipo || comp3Valor) complementos.push({ tipo: comp3Tipo, valor: comp3Valor });

    const registro = {
        area_id: areaAtualId,
        rua: enderecoBaseSelecionado.rua || '',
        numero: numero,
        tipo_complemento: complementos.map(c => c.tipo).filter(Boolean).join(' / '),
        complemento: complementos.map(c => c.valor).filter(Boolean).join(' / '),
        complemento_extra: '',
        andar: '',
        bairro: enderecoBaseSelecionado.bairro || '',
        cidade: enderecoBaseSelecionado.cidade || '',
        estado: enderecoBaseSelecionado.estado || '',
        cep: enderecoBaseSelecionado.cep || '',
        pais: enderecoBaseSelecionado.pais || 'Brasil',
        latitude,
        longitude,
        fonte: enderecoBaseSelecionado.fonte || '',
        tipo_lograd: enderecoBaseSelecionado.tipo_lograd || '',
        cod_bairro: enderecoBaseSelecionado.cod_bairro || '',
        cod_lograd: enderecoBaseSelecionado.cod_lograd || '',
        id_roteiro: enderecoBaseSelecionado.id_roteiro || '',
        id_localidade: enderecoBaseSelecionado.id_localidade || '',
        localidade: enderecoBaseSelecionado.localidade || '',
        localidade_abrev: enderecoBaseSelecionado.localidade_abrev || '',
        usuario_id: usuarioAtual ? usuarioAtual.id : null
    };

    try {
        console.log('[ADD] inserindo:', registro);
        const { error } = await supabaseClient.from('enderecos').insert([registro]);
        if (error) {
            console.error('[ADD] erro:', error);
            throw error;
        }

        showToast('Endereço adicionado', 'Registro salvo com sucesso.', 'success', 2500);

        const limpar = (id, manterId) => {
            const manter = manterId ? document.getElementById(manterId) : null;
            if (manter && manter.checked) return;
            const el = document.getElementById(id);
            if (el) el.value = '';
        };

        limpar('numeroInput', 'numeroRecorrente');
        limpar('comp1Tipo',   'comp1Recorrente');
        limpar('comp1Valor',  'comp1Recorrente');
        limpar('comp2Tipo',   'comp2Recorrente');
        limpar('comp2Valor',  'comp2Recorrente');
        limpar('comp3Tipo',   'comp3Recorrente');
        limpar('comp3Valor',  'comp3Recorrente');

        await carregarCadastrados();
    } catch (err) {
        console.error(err);
        showToast('Erro ao salvar', err.message, 'error', 8000);
    }
});

// ============================================
// CARREGAR CADASTRADOS
// ============================================
async function carregarCadastrados() {
    if (!areaAtualId) { document.getElementById('cadastradosPanel').style.display = 'none'; return; }
    try {
        const { data, error } = await supabaseClient
            .from('enderecos').select('*').eq('area_id', areaAtualId).order('id', { ascending: true });
        if (error) throw error;
        cadastrados = data || [];
        const panel = document.getElementById('cadastradosPanel');
        const tbody = document.querySelector('#cadastradosTable tbody');
        tbody.innerHTML = '';
        if (cadastrados.length === 0) { panel.style.display = 'none'; return; }
        panel.style.display = 'block';
        cadastrados.forEach((r, idx) => {
            const tr = document.createElement('tr');
            const tipos = (r.tipo_complemento || '').split(' / ').filter(Boolean);
            const valores = (r.complemento || '').split(' / ').filter(Boolean);
            const complTexto = tipos.map((t, i) => `${t}: ${valores[i] || ''}`.trim()).join(' | ') || '—';
            tr.innerHTML = `
                <td>${escapeHtml(r.rua || '')}</td>
                <td>${escapeHtml(r.numero || '')}</td>
                <td>${escapeHtml(complTexto)}</td>
                <td>${escapeHtml(r.bairro || '')}</td>
                <td>${escapeHtml(r.cidade || '')}</td>
                <td class="mono">${escapeHtml(formatarCEP(r.cep || ''))}</td>
                <td class="coords-cell">${r.latitude != null ? r.latitude.toFixed(6) : ''}, ${r.longitude != null ? r.longitude.toFixed(6) : ''}</td>
                <td>${escapeHtml(r.fonte || '')}</td>
                <td class="acoes-cell">
                    <button class="btn-ir" data-idx="${idx}" title="Centralizar no mapa" type="button">🗺️</button>
                    <button class="btn-remover" data-id="${r.id}" title="Remover" type="button">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll('.btn-ir').forEach(btn => {
            btn.addEventListener('click', () => {
                const r = cadastrados[parseInt(btn.dataset.idx, 10)];
                if (!r || r.latitude == null) return;
                map.setView([r.latitude, r.longitude], 18);
                if (marcadorAtual) map.removeLayer(marcadorAtual);
                marcadorAtual = L.marker([r.latitude, r.longitude], { icon: houseIcon }).addTo(map);
                marcadorAtual.bindPopup(`<strong>${escapeHtml(r.rua)}, ${escapeHtml(r.numero)}</strong>`).openPopup();
                document.getElementById('panel2').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
        tbody.querySelectorAll('.btn-remover').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if (!confirm('Remover este endereço?')) return;
                try {
                    const { error } = await supabaseClient.from('enderecos').delete().eq('id', id);
                    if (error) throw error;
                    showToast('Removido', 'Endereço excluído.', 'success', 2000);
                    await carregarCadastrados();
                } catch (err) {
                    console.error(err);
                    showToast('Erro ao remover', err.message, 'error');
                }
            });
        });
        marcadoresSalvos.forEach(m => map.removeLayer(m));
        marcadoresSalvos = [];
        cadastrados.forEach(r => {
            if (r.latitude == null || r.longitude == null) return;
            const m = L.marker([r.latitude, r.longitude], { icon: houseIcon }).addTo(map);
            m.bindPopup(`<strong>${escapeHtml(r.rua)}, ${escapeHtml(r.numero)}</strong>`);
            marcadoresSalvos.push(m);
        });
    } catch (err) {
        console.error(err);
        showToast('Erro ao carregar', err.message, 'error');
    }
}

// ============================================
// ÁREA ATUAL
// ============================================
async function carregarAreaAtual() {
    areaAtualId = sessionStorage.getItem('areaAtualId');
    const label = document.getElementById('areaLabel');
    if (!areaAtualId) { label.textContent = ''; return; }
    try {
        const { data, error } = await supabaseClient.from('areas').select('*').eq('id', areaAtualId).single();
        if (error) throw error;
        label.textContent = `Área: ${data.nome || data.descricao || areaAtualId}`;
    } catch (err) {
        console.error(err);
        label.textContent = '';
    }
}

// ============================================
// BOTÃO "LIMPAR LISTA"
// ============================================
document.getElementById('novaAreaBtn').addEventListener('click', async () => {
    if (!areaAtualId) {
        showToast('Nada para limpar', 'Não há endereços cadastrados.', 'info', 2000);
        return;
    }
    if (!confirm('Apagar TODOS os endereços cadastrados? Esta ação não pode ser desfeita.')) return;
    try {
        const { error } = await supabaseClient.from('enderecos').delete().eq('area_id', areaAtualId);
        if (error) throw error;
        marcadoresSalvos.forEach(m => map.removeLayer(m));
        marcadoresSalvos = [];
        cadastrados = [];
        showToast('Lista limpa', 'Todos os endereços foram removidos.', 'success', 2500);
        await carregarCadastrados();
    } catch (err) {
        console.error(err);
        showToast('Erro ao limpar', err.message, 'error');
    }
});

// ============================================
// EXPORTAR — ZIP COM XMLs (formato edificio)
// ============================================
document.getElementById('exportBtn').addEventListener('click', async () => {
    if (cadastrados.length === 0) {
        showToast('Nada para exportar', 'Cadastre ao menos um endereço.', 'warning');
        return;
    }

    try {
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip não carregado. Adicione o script no index.html.');
        }

        const zip = new JSZip();

        const localidade = (cadastrados[0].localidade || cadastrados[0].cidade || 'localidade')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_')
            .toUpperCase();
        const agora = new Date();
        const carimbo = `${agora.getFullYear()}${String(agora.getMonth()+1).padStart(2,'0')}${String(agora.getDate()).padStart(2,'0')}${String(agora.getHours()).padStart(2,'0')}${String(agora.getMinutes()).padStart(2,'0')}`;
        const nomeZipBase = `${localidade}_${carimbo}`;

        cadastrados.forEach((r, idx) => {
            const numero = idx + 1;
            const nomePasta = `moradia${numero}`;
            const nomeArquivo = `moradia${numero}.xml`;
            const xmlConteudo = gerarXMLEdificio(r, numero);
            zip.folder(nomePasta).file(nomeArquivo, xmlConteudo);
        });

        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nomeZipBase}.zip`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('ZIP gerado', `${cadastrados.length} moradia(s) empacotada(s).`, 'success', 3000);
    } catch (err) {
        console.error(err);
        showToast('Erro ao gerar ZIP', err.message, 'error');
    }
});

// ============================================
// GERAR XML NO FORMATO "edificio"
// ============================================
function gerarXMLEdificio(r, numero) {
    const xmlEscape = (v) => {
        if (v == null) return '';
        return String(v)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    const agora = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dataFormatada =
        `${agora.getFullYear()}${pad(agora.getMonth()+1)}${pad(agora.getDate())}` +
        `${pad(agora.getHours())}${pad(agora.getMinutes())}${pad(agora.getSeconds())}`;

    const tipo = (r.tipo_lograd || 'RUA').toString().toUpperCase();
    const nomeLograd = (r.rua || '').toString().toUpperCase();
    const bairro = (r.bairro || '').toString().toUpperCase();
    const municipio = (r.cidade || r.localidade || '').toString().toUpperCase();
    const uf = (r.estado || '').toString().toUpperCase();
    const codLograd = r.cod_lograd || r.id_roteiro || '0';

    const logradouroCompleto =
        `${tipo} ${nomeLograd}, ${bairro}, ${municipio}, ${municipio} - ${uf} (${codLograd})`;

    const coordX = r.longitude != null ? Number(r.longitude).toFixed(6) : '';
    const coordY = r.latitude != null ? Number(r.latitude).toFixed(6) : '';

    const codigoZona = r.codigo_zona || '';
    const nomeZona = r.nome_zona || codigoZona;
    const localidade = r.localidade || r.cidade || '';

    const idEdificio = r.id_roteiro || r.id || numero;
    const numeroFachada = r.numero || '';
    const cep = (r.cep || '').toString().replace(/\D/g, '');
    const codBairro = r.cod_bairro || '';
    const idRoteiro = r.id_roteiro || r.id || '';
    const idLocalidade = r.id_localidade || '';

    const tecnicoNome = (usuarioAtual && usuarioAtual.user_metadata && usuarioAtual.user_metadata.nome) || '';
    const tecnicoId = (usuarioAtual && usuarioAtual.id) || '';

    const empresaId = '6';
    const empresaNome = 'LOGICTEL';

    const destinacaoMap = {
        'Residencial': 'RESIDENCIA',
        'Comercial': 'COMERCIO',
        'Industrial': 'INDUSTRIA',
        'Rural': 'RURAL',
        'Misto': 'MISTO'
    };
    const destinacao = destinacaoMap[r.finalidade] || 'RESIDENCIA';
    const numPisos = r.andar && !isNaN(parseInt(r.andar, 10)) ? String(parseInt(r.andar, 10)) : '1';

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
  <destinacao>${xmlEscape(destinacao)}</destinacao>
</edificio>
`;
}

// ============================================
// LIMPAR TUDO (botão dentro da seção 5)
// ============================================
document.getElementById('clearBtn').addEventListener('click', async () => {
    if (!areaAtualId) return;
    if (!confirm('Apagar TODOS os endereços desta área?')) return;
    try {
        const { error } = await supabaseClient.from('enderecos').delete().eq('area_id', areaAtualId);
        if (error) throw error;
        marcadoresSalvos.forEach(m => map.removeLayer(m));
        marcadoresSalvos = [];
        cadastrados = [];
        showToast('Limpo', 'Todos os endereços foram removidos.', 'success', 2500);
        await carregarCadastrados();
    } catch (err) {
        console.error(err);
        showToast('Erro ao limpar', err.message, 'error');
    }
});

// ============================================
// UPLOAD DE ROTEIRO
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
            showToast('Sem registros', 'O arquivo não continha dados válidos. Verifique o console (F12).', 'warning');
            return;
        }

        // Garante área padrão se não existir
        if (!areaAtualId) {
            await garantirAreaPadrao(true);
        }
        if (!areaAtualId) {
            status.textContent = 'Não foi possível criar a área padrão.';
            showToast('Sem área', 'Verifique as policies no Supabase.', 'error', 8000);
            return;
        }

        const payload = registros.map(r => ({
            area_id: areaAtualId,
            rua: r.rua || '',
            numero: r.numero || '',
            tipo_complemento: r.tipo_complemento || '',
            complemento: r.complemento || '',
            complemento_extra: r.complemento_extra || '',
            andar: r.andar || '',
            bairro: r.bairro || '',
            cidade: r.cidade || '',
            estado: r.estado || '',
            cep: r.cep || '',
            pais: r.pais || 'Brasil',
            latitude: r.latitude != null ? r.latitude : null,
            longitude: r.longitude != null ? r.longitude : null,
            fonte: r.fonte || 'Roteiro',
            tipo_lograd: r.tipo_lograd || '',
            cod_bairro: r.cod_bairro || '',
            cod_lograd: r.cod_lograd || '',
            id_roteiro: r.id_roteiro || '',
            id_localidade: r.id_localidade || '',
            localidade: r.localidade || '',
            localidade_abrev: r.localidade_abrev || '',
            codigo_zona: r.codigo_zona || '',
            nome_zona: r.nome_zona || '',
            usuario_id: usuarioAtual ? usuarioAtual.id : null
        }));

        const { error } = await supabaseClient.from('enderecos').insert(payload);
        if (error) throw error;

        status.textContent = `${registros.length} registro(s) importado(s).`;
        showToast('Roteiro importado', `${registros.length} registro(s).`, 'success', 3000);
        fileInput.value = '';
        await carregarCadastrados();
    } catch (err) {
        console.error('[UPLOAD] Erro:', err);
        status.textContent = `Erro: ${err.message}`;
        showToast('Erro na importação', err.message, 'error');
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
            rua: get('rua') || get('logradouro'),
            numero: get('numero') || get('número'),
            tipo_complemento: get('tipo_complemento') || get('tipo'),
            complemento: get('complemento'),
            complemento_extra: get('complemento_extra'),
            andar: get('andar'),
            bairro: get('bairro'),
            cidade: get('cidade') || get('localidade'),
            estado: get('estado') || get('uf'),
            cep: get('cep'),
            pais: get('pais') || get('país') || 'Brasil',
            latitude: isNaN(lat) ? null : lat,
            longitude: isNaN(lng) ? null : lng,
            fonte: get('fonte') || 'Roteiro CSV',
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
            rua: nomeLograd,
            numero: getText(node, 'numero_fachada') || getText(node, 'numero'),
            tipo_complemento: '',
            complemento: '',
            complemento_extra: '',
            andar: '',
            bairro: getText(node, 'bairro'),
            cidade: getText(node, 'municipio') || getText(node, 'localidade'),
            estado: getText(node, 'uf_abrev') || getText(node, 'uf'),
            cep: getText(node, 'cep'),
            pais: 'Brasil',
            latitude: parseFloat(getText(node, 'coordY')) || null,
            longitude: parseFloat(getText(node, 'coordX')) || null,
            fonte: 'Roteiro XML',
            tipo_lograd: tipo,
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