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
let enderecoBaseSelecionado = null; // NOVO: endereço escolhido na seção 3

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
            fetch(`https://opencep.com/v1/${cepOSM}`).then(r => r.ok ? r.json() : null).then(d => {
                if (d && !d.erro) {
                    resultados.push({
                        fonte: 'OpenCEP', rua: d.logradouro || '', numero: '', bairro: d.bairro || '',
                        cidade: d.localidade || '', estado: d.uf || '', cep: d.cep || '', pais: 'Brasil',
                        bruto: `${d.logradouro || ''}, ${d.bairro || ''}, ${d.localidade || ''} - ${d.uf || ''}`
                    });
                }
            }).catch(() => {})
        );
        tarefas.push(
            fetch(`https://viacep.com.br/ws/${cepOSM}/json/`).then(r => r.json()).then(d => {
                if (d && !d.erro) {
                    resultados.push({
                        fonte: 'ViaCEP', rua: d.logradouro || '', numero: '', bairro: d.bairro || '',
                        cidade: d.localidade || '', estado: d.uf || '', cep: d.cep || '', pais: 'Brasil',
                        bruto: `${d.logradouro || ''}, ${d.bairro || ''}, ${d.localidade || ''} - ${d.uf || ''}`
                    });
                }
            }).catch(() => {})
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
            tr.innerHTML = `
                <td><span class="fonte-badge">${escapeHtml(r.fonte)}</span></td>
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
    // Salva o endereço base escolhido
    enderecoBaseSelecionado = {
        fonte: r.fonte,
        rua: r.rua || '',
        numero: r.numero || '',
        bairro: r.bairro || '',
        cidade: r.cidade || '',
        estado: r.estado || '',
        cep: r.cep || '',
        pais: r.pais || 'Brasil',
        bruto: r.bruto || ''
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
    fonteSelect.dataset.rua = r.rua || '';
    fonteSelect.dataset.bairro = r.bairro || '';
    fonteSelect.dataset.cidade = r.cidade || '';
    fonteSelect.dataset.estado = r.estado || '';
    fonteSelect.dataset.cep = r.cep || '';
    fonteSelect.dataset.pais = r.pais || '';

    if (r.numero && !document.getElementById('numeroInput').value) {
        document.getElementById('numeroInput').value = r.numero;
    }

    // Mostra o endereço base no topo da seção 4
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
// ADICIONAR NOVO ENDEREÇO MANUAL
// ============================================
document.getElementById('btnNovoEnderecoManual').addEventListener('click', () => {
    const form = document.getElementById('novoEnderecoForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});
document.getElementById('btnCancelarNovoEndereco').addEventListener('click', () => {
    document.getElementById('novoEnderecoForm').style.display = 'none';
});

// Auto-preenche via ViaCEP ao sair do campo CEP
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

    // Tenta geocodificar via Nominatim para ter coords
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
        bruto: `${tipo} ${logradouro}, ${numero}, ${bairro}, ${cidade} - ${uf}, ${formatarCEP(cep)}`
    };

    // Adiciona à lista de fontes encontradas e re-renderiza
    enderecosEncontrados.push(novoRegistro);
    renderizarTabelaFontes(enderecosEncontrados, document.getElementById('enderecosList'));

    // Se conseguiu coordenadas, marca no mapa e mostra
    if (latitude != null && longitude != null) {
        irParaLocal(latitude, longitude, novoRegistro.bruto, 'manual');
    }

    // Limpa o form
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

    const tipoImovel = document.getElementById('tipoImovel').value;
    if (!tipoImovel) { showToast('Tipo obrigatório', 'Selecione o tipo de imóvel.', 'warning'); return; }

    const coordsTexto = document.getElementById('coordsDisplay').textContent;
    const [latStr, lngStr] = coordsTexto.split(',').map(s => s.trim());
    const latitude = !isNaN(parseFloat(latStr)) ? parseFloat(latStr) : (enderecoBaseSelecionado.latitude ?? null);
    const longitude = !isNaN(parseFloat(lngStr)) ? parseFloat(lngStr) : (enderecoBaseSelecionado.longitude ?? null);

    const registro = {
        area_id: areaAtualId,
        // Endereço base
        rua: enderecoBaseSelecionado.rua || '',
        numero: numero,
        tipo_complemento: document.getElementById('tipoComplemento').value,
        complemento: document.getElementById('complementoInput').value.trim(),
        complemento_extra: '',
        andar: document.getElementById('andarInput').value.trim(),
        bairro: enderecoBaseSelecionado.bairro || '',
        cidade: enderecoBaseSelecionado.cidade || '',
        estado: enderecoBaseSelecionado.estado || '',
        cep: enderecoBaseSelecionado.cep || '',
        pais: enderecoBaseSelecionado.pais || 'Brasil',
        latitude,
        longitude,
        fonte: enderecoBaseSelecionado.fonte || '',
        // Detalhes do imóvel
        tipo_imovel: tipoImovel,
        finalidade: document.getElementById('finalidade').value,
        area_terreno: parseFloat(document.getElementById('areaTerreno').value) || null,
        area_construida: parseFloat(document.getElementById('areaConstruida').value) || null,
        quartos: parseInt(document.getElementById('quartos').value, 10) || null,
        suites: parseInt(document.getElementById('suites').value, 10) || null,
        banheiros: parseInt(document.getElementById('banheiros').value, 10) || null,
        vagas: parseInt(document.getElementById('vagas').value, 10) || null,
        // Registral
        matricula: document.getElementById('matricula').value.trim(),
        inscricao_imobiliaria: document.getElementById('inscricaoImobiliaria').value.trim(),
        iptu: parseFloat(document.getElementById('iptu').value) || null,
        valor_avaliacao: parseFloat(document.getElementById('valorAvaliacao').value) || null,
        valor_mercado: parseFloat(document.getElementById('valorMercado').value) || null,
        // Proprietário
        proprietario: document.getElementById('proprietario').value.trim(),
        cpf_cnpj_proprietario: document.getElementById('cpfCnpjProprietario').value.trim(),
        telefone_proprietario: document.getElementById('telefoneProprietario').value.trim(),
        email_proprietario: document.getElementById('emailProprietario').value.trim(),
        // Observações
        observacoes: document.getElementById('observacoes').value.trim(),
        usuario_id: usuarioAtual ? usuarioAtual.id : null
    };

    try {
        // Garante que a área existe
        if (!areaAtualId) {
            showToast('Sem área', 'Cadastre uma área antes de salvar.', 'warning');
            return;
        }

        const { error } = await supabaseClient.from('enderecos').insert([registro]);
        if (error) throw error;

        showToast('Endereço adicionado', 'Registro salvo com sucesso.', 'success', 2500);

        // Limpa campos de detalhes (mantém endereço base para adicionar outro imóvel no mesmo local)
        ['numeroInput','complementoInput','andarInput','tipoImovel','finalidade','areaTerreno',
         'areaConstruida','quartos','suites','banheiros','vagas','matricula','inscricaoImobiliaria',
         'iptu','valorAvaliacao','valorMercado','proprietario','cpfCnpjProprietario',
         'telefoneProprietario','emailProprietario','observacoes','tipoComplemento'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

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
            const compl = [r.tipo_complemento, r.complemento].filter(Boolean).join(' ');
            tr.innerHTML = `
                <td>${escapeHtml(r.rua || '')}</td>
                <td>${escapeHtml(r.numero || '')}</td>
                <td>${escapeHtml(compl || '')}</td>
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
    if (!areaAtualId) { label.textContent = 'Nenhuma área selecionada'; return; }
    try {
        const { data, error } = await supabaseClient.from('areas').select('*').eq('id', areaAtualId).single();
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
            .from('areas').insert([{ nome, usuario_id: usuarioAtual ? usuarioAtual.id : null }])
            .select().single();
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
    if (cadastrados.length === 0) { showToast('Nada para exportar', 'Cadastre ao menos um endereço.', 'warning'); return; }
    const headers = [
        'Rua','Número','Tipo Complemento','Complemento','Andar','Bairro','Cidade','Estado','CEP','País',
        'Latitude','Longitude','Fonte',
        'Tipo Imóvel','Finalidade','Área Terreno','Área Construída','Quartos','Suítes','Banheiros','Vagas',
        'Matrícula','Inscrição Imobiliária','IPTU','Valor Avaliação','Valor Mercado',
        'Proprietário','CPF/CNPJ Proprietário','Telefone Proprietário','E-mail Proprietário',
        'Observações'
    ];
    const linhas = cadastrados.map(r => [
        r.rua, r.numero, r.tipo_complemento, r.complemento, r.andar, r.bairro, r.cidade, r.estado,
        formatarCEP(r.cep || ''), r.pais, r.latitude, r.longitude, r.fonte,
        r.tipo_imovel, r.finalidade, r.area_terreno, r.area_construida, r.quartos, r.suites, r.banheiros, r.vagas,
        r.matricula, r.inscricao_imobiliaria, r.iptu, r.valor_avaliacao, r.valor_mercado,
        r.proprietario, r.cpf_cnpj_proprietario, r.telefone_proprietario, r.email_proprietario,
        r.observacoes
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
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exportado', `${cadastrados.length} registro(s) em CSV.`, 'success', 2500);
});

// ============================================
// LIMPAR TUDO
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
        console.log('[UPLOAD] Arquivo lido. Tamanho:', texto.length, 'bytes. Primeiros 200 chars:', texto.substring(0, 200));

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

        if (!areaAtualId) {
            status.textContent = 'Crie uma área antes de importar.';
            showToast('Sem área', 'Clique em "Cadastrar nova área" primeiro.', 'warning');
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
            fonte: get('fonte') || 'Roteiro CSV'
        };
    }).filter(r => r.rua || r.cep);
}

// ============================================
// PARSER XML DO ROTEIRO DOS CORREIOS (CORRIGIDO)
// ============================================
function parseXMLRoteiro(texto) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(texto, 'text/xml');

    // Verifica erro de parse
    const parserError = xml.querySelector('parsererror');
    if (parserError) {
        console.error('[XML] Erro de parse:', parserError.textContent);
        throw new Error('XML inválido: ' + parserError.textContent.substring(0, 200));
    }

    // Pega TODOS os elementos <roteiro> (padrão dos Correios)
    let nodes = Array.from(xml.getElementsByTagName('roteiro'));

    // Fallback para outros formatos
    if (nodes.length === 0) {
        nodes = Array.from(xml.querySelectorAll('endereco, address, registro, item, linha'));
    }

    console.log('[XML] Encontrados', nodes.length, 'nós <roteiro> ou equivalentes');

    if (nodes.length === 0) {
        throw new Error('Nenhum elemento <roteiro> encontrado no arquivo. Formato não reconhecido.');
    }

    const getText = (node, tag) => {
        const el = node.getElementsByTagName(tag)[0];
        return el && el.textContent ? el.textContent.trim() : '';
    };

    const registros = nodes.map(node => {
        const tipo = getText(node, 'tipo_lograd');
        const tipoAbrev = getText(node, 'tipo_lograd_abrev');
        const titulo = getText(node, 'titulo');
        const nomeBase = getText(node, 'nome_lograd');

        // Monta nome do logradouro com título se houver (ex: "SANTO ANTONIO")
        let nomeLograd = nomeBase;
        if (titulo && !nomeBase.toUpperCase().startsWith(titulo.toUpperCase())) {
            nomeLograd = `${titulo} ${nomeBase}`.trim();
        }

        return {
            rua: nomeLograd,
            numero: '',
            tipo_complemento: '',
            complemento: '',
            complemento_extra: '',
            andar: '',
            bairro: getText(node, 'bairro'),
            cidade: getText(node, 'municipio') || getText(node, 'localidade'),
            estado: getText(node, 'uf_abrev') || getText(node, 'uf'),
            cep: getText(node, 'cep'),
            pais: 'Brasil',
            latitude: null,
            longitude: null,
            fonte: 'Roteiro XML',
            // Guarda tipo original
            _tipo: tipo,
            _tipoAbrev: tipoAbrev
        };
    });

    return registros.filter(r => r.rua || r.cep);
}

// ============================================
// MODELO CSV
// ============================================
document.getElementById('downloadModeloBtn').addEventListener('click', () => {
    const modelo = [
        'rua;numero;tipo_complemento;complemento;andar;bairro;cidade;estado;cep;latitude;longitude;fonte',
        'Rua Exemplo;123;Quadra;B;5;Centro;Rio de Janeiro;RJ;20000-000;-22.90200282;-43.27065822;Modelo'
    ].join('\n');
    const blob = new Blob(['\uFEFF' + modelo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_roteiro.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Modelo baixado', 'Preencha e importe novamente.', 'success', 2500);
});

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