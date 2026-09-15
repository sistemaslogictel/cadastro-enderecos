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

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                update();
            }
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
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    usuarioAtual = user;
    const nome = sessionStorage.getItem('usuarioNome') || sessionStorage.getItem('usuarioLogado') || '-';
    document.getElementById('userLabel').textContent = nome;

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

// ============================================
// CASINHA SVG
// ============================================
const houseSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42"><path d="M16 1 L1 15 L1 17 L5 17 L5 33 L12 33 L12 24 L20 24 L20 33 L27 33 L27 17 L31 17 L31 15 Z" fill="#2a4fd6" stroke="#1e3c72" stroke-width="0.6" stroke-linejoin="round"/><rect x="7" y="5" width="4" height="7" fill="#2a4fd6" stroke="#1e3c72" stroke-width="0.6"/><ellipse cx="16" cy="41" rx="9" ry="1.2" fill="rgba(0,0,0,0.25)"/></svg>`;
const houseIcon = L.divIcon({ className: 'house-marker', html: houseSVG, iconSize: [14, 18], iconAnchor: [7, 18], popupAnchor: [0, -18] });

// ============================================
// TOGGLE PAINÉIS
// ============================================
document.querySelectorAll('.toggle-btn').forEach(btn => {
    const target = document.getElementById(btn.dataset.target);
    if (target && target.classList.contains('collapsed')) {
        btn.classList.add('collapsed');
        btn.setAttribute('aria-expanded', 'false');
    }
    btn.innerHTML = '&#9660;';

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
        btn.setAttribute('aria-label', 'Travar zoom');
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.disableScrollPropagation(btn);
        btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleZoomLock(); });
        zoomLockControl._btn = btn;
        return btn;
    }
});
const zoomLockControlInstance = new zoomLockControl();
map.addControl(zoomLockControlInstance);

function mostrarToastZoom(msg) {
    showToast('Zoom', msg, 'info', 1800);
}

function aplicarTravamento() {
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if (map.zoomControl) map.zoomControl.remove();
    const btn = zoomLockControl._btn;
    btn.innerHTML = '🔒';
    btn.title = 'Destravar zoom (Ctrl + B)';
    btn.setAttribute('aria-label', 'Destravar zoom');
    btn.classList.add('locked');
}

function aplicarDestravamento() {
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    if (!map.zoomControl) map.zoomControl = L.control.zoom({ position: 'topleft' }).addTo(map);
    const btn = zoomLockControl._btn;
    btn.innerHTML = '🔓';
    btn.title = 'Travar zoom (Ctrl + B)';
    btn.setAttribute('aria-label', 'Travar zoom');
    btn.classList.remove('locked');
}

function toggleZoomLock() {
    zoomTravado = !zoomTravado;
    if (zoomTravado) { aplicarTravamento(); mostrarToastZoom('Zoom travado — Ctrl + B para destravar'); }
    else { aplicarDestravamento(); mostrarToastZoom('Zoom destravado'); }
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); toggleZoomLock(); }
});

aplicarTravamento();

// ============================================
// PARSER DE COORDENADAS
// Aceita formatos:
//   -22.90200282, -43.27065822
//   -22.90200282 -43.27065822
//   (-22.90200282, -43.27065822)
//   -22.90200282;-43.27065822
// ============================================
function tentarParseCoordenadas(query) {
    // Remove parênteses e colchetes
    const limpo = query.replace(/[()\[\]]/g, '').trim();

    // Regex: captura dois números decimais (com sinal opcional)
    const match = limpo.match(/^(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)$/);

    if (!match) return null;

    const lat = parseFloat(match[1].replace(',', '.'));
    const lng = parseFloat(match[2].replace(',', '.'));

    // Validação de faixa geográfica
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

    // Se for coordenadas, não mostra sugestões — vai direto ao buscar
    if (tentarParseCoordenadas(query)) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.style.display = 'none';
        return;
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

    // Não busca sugestões para coordenadas
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
        'Clique no mapa (botão direito)';
    consultarFontes(lat, lng);
}

async function buscarEndereco(query) {
    // 1. Tenta interpretar como coordenadas
    const coords = tentarParseCoordenadas(query);
    if (coords) {
        irParaLocal(coords.lat, coords.lng, `${coords.lat}, ${coords.lng}`, 'coordenadas');
        return;
    }

    // 2. Fluxo normal: CEP ou endereço textual
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
// CONSULTAR FONTES
// ============================================
async function consultarFontes(lat, lng) {
    const list = document.getElementById('enderecosList');
    list.innerHTML = '<p class="empty-state"><span class="loading"></span>Consultando fontes...</p>';

    const resultados = [];
    let cepOSM = '';

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`;
        const res = await fetch(url);
        const data = await res.json();
        const a = data.address || {};
        resultados.push({
            fonte: 'OpenStreetMap',
            rua: a.road || a.pedestrian || '', numero: a.house_number || '',
            bairro: a.suburb || a.neighbourhood || '', cidade: a.city || a.town || a.village || '',
            estado: a.state || '', cep: a.postcode || '', pais: a.country || '',
            bruto: data.display_name || ''
        });
        cepOSM = (a.postcode || '').replace(/\D/g, '');
    } catch (e) {
        resultados.push({ fonte: 'OpenStreetMap', error: 'Falha na consulta' });
    }

    const tarefas = [];
    if (cepOSM.length === 8) {
        tarefas.push(
            fetch(`https://opencep.com/v1/${cepOSM}`)
                .then(r => r.ok ? r.json() : null)
                .then(d => {
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
                })
                .catch(() => {})
        );

        tarefas.push(
            fetch(`https://viacep.com.br/ws/${cepOSM}/json/`)
                .then(r => r.json())
                .then(d => {
                    if (d && !d.erro) {
                        resultados.push({
                            fonte: 'ViaCEP',
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
                })
                .catch(() => {})
        );
    }

    await Promise.allSettled(tarefas);

    const vistos = new Set();
    const unicos = resultados.filter(r => {
        if (r.error) return true;
        const chave = `${(r.rua || '').toLowerCase()}|${(r.numero || '').toLowerCase()}|${(r.cidade || '').toLowerCase()}`;
        if (vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
    });

    enderecosEncontrados = unicos;

    if (unicos.length === 0) {
        list.innerHTML = '<p class="empty-state">Nenhuma fonte retornou dados para este ponto.</p>';
        return;
    }

    list.innerHTML = '';
    unicos.forEach((r, idx) => {
        const div = document.createElement('div');
        div.className = 'endereco-card';
        div.setAttribute('role', 'listitem');

        if (r.error) {
            div.innerHTML = `
                <div class="endereco-header">
                    <span class="fonte-badge">${escapeHtml(r.fonte)}</span>
                    <span class="erro-badge">indisponível</span>
                </div>
                <p class="endereco-erro">${escapeHtml(r.error)}</p>
            `;
        } else {
            const linha1 = [r.rua, r.numero].filter(Boolean).join(', ') || '—';
            const linha2 = [r.bairro, r.cidade, r.estado].filter(Boolean).join(' • ') || '—';
            const linha3 = [r.cep, r.pais].filter(Boolean).join(' • ');

            div.innerHTML = `
                <div class="endereco-header">
                    <span class="fonte-badge">${escapeHtml(r.fonte)}</span>
                </div>
                <p class="endereco-linha1">${escapeHtml(linha1)}</p>
                <p class="endereco-linha2">${escapeHtml(linha2)}</p>
                ${linha3 ? `<p class="endereco-linha3">${escapeHtml(linha3)}</p>` : ''}
                <button class="btn-usar-fonte" type="button" data-idx="${idx}">Usar esta fonte</button>
            `;
        }
        list.appendChild(div);
    });

    list.querySelectorAll('.btn-usar-fonte').forEach(btn => {
        btn.addEventListener('click', () => {
            const r = unicos[parseInt(btn.dataset.idx, 10)];
            if (!r || r.error) return;
            preencherFormulario(r);
            showToast('Fonte aplicada', `Dados de ${r.fonte} carregados no formulário.`, 'success', 2500);
        });
    });
}

// ============================================
// PREENCHER FORMULÁRIO
// ============================================
function preencherFormulario(r) {
    const fonteSelect = document.getElementById('fonteSelect');
    let option = Array.from(fonteSelect.options).find(o => o.value === r.fonte);
    if (!option) {
        option = document.createElement('option');
        option.value = r.fonte;
        option.textContent = r.fonte;
        fonteSelect.appendChild(option);
    }
    fonteSelect.value = r.fonte;

    fonteSelect.dataset.rua = r.rua || '';
    fonteSelect.dataset.bairro = r.bairro || '';
    fonteSelect.dataset.cidade = r.cidade || '';
    fonteSelect.dataset.estado = r.estado || '';
    fonteSelect.dataset.cep = r.cep || '';
    fonteSelect.dataset.pais = r.pais || '';

    if (r.numero) {
        document.getElementById('numeroInput').value = r.numero;
    }

    const formBody = document.getElementById('formBody');
    if (formBody && formBody.classList.contains('collapsed')) {
        formBody.classList.remove('collapsed');
        const toggle = document.querySelector('#formPanel .toggle-btn');
        if (toggle) {
            toggle.classList.remove('collapsed');
            toggle.setAttribute('aria-expanded', 'true');
        }
    }
    document.getElementById('formPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// ADICIONAR À LISTA
// ============================================
document.getElementById('addBtn').addEventListener('click', async () => {
    const fonteSelect = document.getElementById('fonteSelect');
    const fonte = fonteSelect.value;
    if (!fonte) {
        showToast('Fonte obrigatória', 'Selecione a fonte dos dados antes de adicionar.', 'warning');
        return;
    }

    const numero = document.getElementById('numeroInput').value.trim();
    const tipoComplemento = document.getElementById('tipoComplemento').value;
    const complemento = document.getElementById('complementoInput').value.trim();

    if (!numero) {
        showToast('Número obrigatório', 'Informe o número do imóvel.', 'warning');
        return;
    }

    const coordsTexto = document.getElementById('coordsDisplay').textContent;
    const [latStr, lngStr] = coordsTexto.split(',').map(s => s.trim());
    if (!latStr || !lngStr || isNaN(parseFloat(latStr))) {
        showToast('Sem coordenadas', 'Busque ou marque um ponto no mapa primeiro.', 'warning');
        return;
    }

    const registro = {
        area_id: areaAtualId,
        rua: fonteSelect.dataset.rua || '',
        numero: numero,
        tipo_complemento: tipoComplemento || '',
        complemento: complemento || '',
        bairro: fonteSelect.dataset.bairro || '',
        cidade: fonteSelect.dataset.cidade || '',
        estado: fonteSelect.dataset.estado || '',
        cep: fonteSelect.dataset.cep || '',
        pais: fonteSelect.dataset.pais || 'Brasil',
        latitude: parseFloat(latStr),
        longitude: parseFloat(lngStr),
        fonte: fonte,
        usuario_id: usuarioAtual ? usuarioAtual.id : null
    };

    try {
        const { error } = await supabaseClient.from('enderecos').insert([registro]);
        if (error) throw error;

        showToast('Endereço adicionado', 'Registro salvo com sucesso.', 'success', 2500);

        document.getElementById('numeroInput').value = '';
        document.getElementById('tipoComplemento').value = '';
        document.getElementById('complementoInput').value = '';

        await carregarCadastrados();
    } catch (err) {
        console.error(err);
        showToast('Erro ao salvar', err.message, 'error');
    }
});

// ============================================
// CARREGAR CADASTRADOS
// ============================================
async function carregarCadastrados() {
    if (!areaAtualId) {
        document.getElementById('cadastradosPanel').style.display = 'none';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('enderecos')
            .select('*')
            .eq('area_id', areaAtualId)
            .order('id', { ascending: true });

        if (error) throw error;

        cadastrados = data || [];

        const panel = document.getElementById('cadastradosPanel');
        const tbody = document.querySelector('#cadastradosTable tbody');
        tbody.innerHTML = '';

        if (cadastrados.length === 0) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';

        cadastrados.forEach((r, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(r.rua || '')}</td>
                <td>${escapeHtml(r.numero || '')}</td>
                <td>${escapeHtml(r.tipo_complemento || '')}</td>
                <td>${escapeHtml(r.complemento || '')}</td>
                <td>${escapeHtml(r.bairro || '')}</td>
                <td>${escapeHtml(r.cidade || '')}</td>
                <td>${escapeHtml(r.cep || '')}</td>
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
            m.bindPopup(`<strong>${escapeHtml(r.rua)}, ${escapeHtml(r.numero)}</strong><br>${escapeHtml(r.bairro || '')}`);
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

    if (!areaAtualId) {
        label.textContent = 'Nenhuma área selecionada';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('areas')
            .select('*')
            .eq('id', areaAtualId)
            .single();

        if (error) throw error;
        label.textContent = `Área: ${data.nome || data.descricao || areaAtualId}`;
    } catch (err) {
        console.error(err);
        label.textContent = `Área: ${areaAtualId}`;
    }
}

document.getElementById('novaAreaBtn').addEventListener('click', async () => {
    const nome = prompt('Nome da nova área:');
    if (!nome) return;
    try {
        const { data, error } = await supabaseClient
            .from('areas')
            .insert([{ nome, usuario_id: usuarioAtual ? usuarioAtual.id : null }])
            .select()
            .single();
        if (error) throw error;

        sessionStorage.setItem('areaAtualId', data.id);
        areaAtualId = data.id;
        document.getElementById('areaLabel').textContent = `Área: ${data.nome}`;
        showToast('Área criada', data.nome, 'success', 2500);
        await carregarCadastrados();
    } catch (err) {
        console.error(err);
        showToast('Erro ao criar área', err.message, 'error');
    }
});

// ============================================
// EXPORTAR CSV
// ============================================
document.getElementById('exportBtn').addEventListener('click', () => {
    if (cadastrados.length === 0) {
        showToast('Nada para exportar', 'Cadastre ao menos um endereço.', 'warning');
        return;
    }

    const headers = ['Rua', 'Número', 'Tipo Complemento', 'Complemento', 'Bairro', 'Cidade', 'Estado', 'CEP', 'País', 'Latitude', 'Longitude', 'Fonte'];
    const linhas = cadastrados.map(r => [
        r.rua, r.numero, r.tipo_complemento, r.complemento, r.bairro,
        r.cidade, r.estado, r.cep, r.pais, r.latitude, r.longitude, r.fonte
    ]);

    const csvEscape = (v) => {
        if (v == null) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",;\n]/.test(s) ? `"${s}"` : s;
    };

    const csv = [headers, ...linhas].map(l => l.map(csvEscape).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enderecos_${areaAtualId || 'area'}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Exportado', `${cadastrados.length} registro(s) em CSV.`, 'success', 2500);
});

// ============================================
// LIMPAR TUDO
// ============================================
document.getElementById('clearBtn').addEventListener('click', async () => {
    if (!areaAtualId) return;
    if (!confirm('Tem certeza que deseja apagar TODOS os endereços desta área?')) return;

    try {
        const { error } = await supabaseClient.from('enderecos').delete().eq('area_id', areaAtualId);
        if (error) throw error;

        marcadoresSalvos.forEach(m => map.removeLayer(m));
        marcadoresSalvos = [];
        cadastrados = [];

        showToast('Limpo', 'Todos os endereços da área foram removidos.', 'success', 2500);
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

    if (!file) {
        showToast('Nenhum arquivo', 'Selecione um arquivo .xml ou .csv.', 'warning');
        return;
    }

    status.textContent = 'Processando arquivo...';

    try {
        const texto = await file.text();
        let registros = [];

        if (file.name.toLowerCase().endsWith('.csv')) {
            registros = parseCSV(texto);
        } else if (file.name.toLowerCase().endsWith('.xml')) {
            registros = parseXMLRoteiro(texto);
        } else {
            throw new Error('Formato não suportado. Use .csv ou .xml');
        }

        if (registros.length === 0) {
            status.textContent = 'Nenhum registro válido encontrado.';
            showToast('Sem registros', 'O arquivo não continha dados válidos.', 'warning');
            return;
        }

        const payload = registros.map(r => ({
            area_id: areaAtualId,
            rua: r.rua || '',
            numero: r.numero || '',
            tipo_complemento: r.tipo_complemento || '',
            complemento: r.complemento || '',
            bairro: r.bairro || '',
            cidade: r.cidade || '',
            estado: r.estado || '',
            cep: r.cep || '',
            pais: r.pais || 'Brasil',
            latitude: r.latitude != null ? r.latitude : null,
            longitude: r.longitude != null ? r.longitude : null,
            fonte: r.fonte || 'Roteiro',
            usuario_id: usuarioAtual ? usuarioAtual.id : null
        }));

        const { error } = await supabaseClient.from('enderecos').insert(payload);
        if (error) throw error;

        status.textContent = `${registros.length} registro(s) importado(s) com sucesso.`;
        showToast('Roteiro importado', `${registros.length} registro(s).`, 'success', 3000);

        fileInput.value = '';
        await carregarCadastrados();
    } catch (err) {
        console.error(err);
        status.textContent = `Erro: ${err.message}`;
        showToast('Erro na importação', err.message, 'error');
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
        const get = (campo) => {
            const i = idx(campo);
            return i >= 0 ? cols[i] : '';
        };

        const lat = parseFloat(get('latitude'));
        const lng = parseFloat(get('longitude'));

        return {
            rua: get('rua') || get('logradouro'),
            numero: get('numero') || get('número'),
            tipo_complemento: get('tipo_complemento') || get('tipo'),
            complemento: get('complemento'),
            bairro: get('bairro'),
            cidade: get('cidade') || get('localidade'),
            estado: get('estado') || get('uf'),
            cep: get('cep'),
            pais: get('pais') || get('país') || 'Brasil',
            latitude: isNaN(lat) ? null : lat,
            longitude: isNaN(lng) ? null : lng,
            fonte: get('fonte') || 'Roteiro'
        };
    }).filter(r => r.rua || r.cep);
}

function parseXMLRoteiro(texto) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(texto, 'text/xml');
    const registros = [];

    const nodes = xml.querySelectorAll('endereco, address, registro, item, linha');
    nodes.forEach(node => {
        const get = (tag) => {
            const el = node.querySelector(tag);
            return el ? el.textContent.trim() : '';
        };
        const lat = parseFloat(get('latitude') || get('lat'));
        const lng = parseFloat(get('longitude') || get('lng') || get('lon'));

        registros.push({
            rua: get('logradouro') || get('rua') || get('street'),
            numero: get('numero') || get('número') || get('number'),
            tipo_complemento: get('tipo_complemento') || get('tipo'),
            complemento: get('complemento'),
            bairro: get('bairro') || get('neighborhood'),
            cidade: get('cidade') || get('localidade') || get('city'),
            estado: get('uf') || get('estado') || get('state'),
            cep: get('cep') || get('postcode'),
            pais: get('pais') || get('país') || 'Brasil',
            latitude: isNaN(lat) ? null : lat,
            longitude: isNaN(lng) ? null : lng,
            fonte: 'Roteiro XML'
        });
    });

    return registros.filter(r => r.rua || r.cep);
}

// ============================================
// MODELO CSV
// ============================================
document.getElementById('downloadModeloBtn').addEventListener('click', () => {
    const modelo = [
        'rua;numero;tipo_complemento;complemento;bairro;cidade;estado;cep;latitude;longitude;fonte',
        'Rua Exemplo;123;Casa;A;Centro;Rio de Janeiro;RJ;20000-000;-22.90200282;-43.27065822;Modelo'
    ].join('\n');

    const blob = new Blob(['\uFEFF' + modelo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_roteiro.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Modelo baixado', 'Preencha e importe novamente.', 'success', 2500);
});

// ============================================
// UTILITÁRIOS
// ============================================
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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