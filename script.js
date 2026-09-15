// ============================================
// PROTEÇÃO DE ROTA
// ============================================
if (!sessionStorage.getItem('usuarioLogado')) {
    window.location.href = 'login.html';
}

let usuarioAtual = null;

async function iniciar() {
    const { data: { user } } = await supabase.auth.getUser();
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
    await supabase.auth.signOut();
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
    }
    btn.innerHTML = '&#9660;';

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = document.getElementById(btn.dataset.target);
        target.classList.toggle('collapsed');
        btn.classList.toggle('collapsed');
        btn.innerHTML = '&#9660;';
        if (btn.dataset.target === 'panel2-body' && !target.classList.contains('collapsed')) {
            setTimeout(() => map.invalidateSize(), 300);
        }
    });
});

document.querySelectorAll('.panel h2').forEach(h2 => {
    h2.addEventListener('click', () => { const btn = h2.querySelector('.toggle-btn'); if (btn) btn.click(); });
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
            if (toggle) toggle.classList.remove('collapsed');
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.classList.add('highlight');
        setTimeout(() => target.classList.remove('highlight'), 1000);
    });
});

// ============================================
// TRAVAR ZOOM (inicia travado)
// ============================================
let zoomTravado = true;

const zoomLockControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function () {
        const btn = L.DomUtil.create('button', 'zoom-lock-btn');
        btn.innerHTML = '🔓'; btn.title = 'Travar zoom (Ctrl + B)'; btn.type = 'button';
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.disableScrollPropagation(btn);
        btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleZoomLock(); });
        zoomLockControl._btn = btn;
        return btn;
    }
});
const zoomLockControlInstance = new zoomLockControl();
map.addControl(zoomLockControlInstance);

const toast = document.createElement('div');
toast.className = 'zoom-lock-toast';
document.body.appendChild(toast);

function mostrarToast(msg) {
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('visible'), 1800);
}

function aplicarTravamento() {
    map.scrollWheelZoom.disable(); map.doubleClickZoom.disable(); map.touchZoom.disable();
    map.boxZoom.disable(); map.keyboard.disable();
    if (map.zoomControl) map.zoomControl.remove();
    const btn = zoomLockControl._btn;
    btn.innerHTML = '🔒'; btn.title = 'Destravar zoom (Ctrl + B)'; btn.classList.add('locked');
}

function aplicarDestravamento() {
    map.scrollWheelZoom.enable(); map.doubleClickZoom.enable(); map.touchZoom.enable();
    map.boxZoom.enable(); map.keyboard.enable();
    if (!map.zoomControl) map.zoomControl = L.control.zoom({ position: 'topleft' }).addTo(map);
    const btn = zoomLockControl._btn;
    btn.innerHTML = '🔓'; btn.title = 'Travar zoom (Ctrl + B)'; btn.classList.remove('locked');
}

function toggleZoomLock() {
    zoomTravado = !zoomTravado;
    if (zoomTravado) { aplicarTravamento(); mostrarToast('Zoom travado — Ctrl + B para destravar'); }
    else { aplicarDestravamento(); mostrarToast('Zoom destravado'); }
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); toggleZoomLock(); }
});

aplicarTravamento();

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
        origem === 'netwin' ? 'Netwin' :
        'Clique no mapa (botão direito)';
    consultarFontes(lat, lng);
}

async function buscarEndereco(query) {
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
        if (!data || data.length === 0) { alert('Endereço não encontrado.'); return; }
        const item = data[0];
        irParaLocal(parseFloat(item.lat), parseFloat(item.lon), item.display_name, 'busca');
    } catch (err) { console.error(err); alert('Erro ao buscar endereço.'); }
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
    list.innerHTML = '<p style="color:#666; font-style:italic;">Consultando fontes...</p>';

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
        tarefas.push(fetch(`https://opencep.com/v1/${cepOSM}`).then(r => r.json()).then(data => ({ tipo: 'opencep', data })).catch(() => ({ tipo: 'opencep', erro: true })));
        tarefas.push(fetch(`https://viacep.com.br/ws/${cepOSM}/json/`).then(r => r.json()).then(data => ({ tipo: 'viacep', data })).catch(() => ({ tipo: 'viacep', erro: true })));
        tarefas.push(fetch(`https://brasilapi.com.br/api/cep/v2/${cepOSM}`).then(r => r.json()).then(data => ({ tipo: 'brasilapi', data })).catch(() => ({ tipo: 'brasilapi', erro: true })));
    }

    const respostas = await Promise.all(tarefas);

    respostas.forEach(({ tipo, data, erro }) => {
        if (erro || !data || data.erro) {
            const nome = tipo === 'opencep' ? 'OpenCEP (Correios)' : tipo === 'viacep' ? 'ViaCEP' : 'BrasilAPI';
            resultados.push({ fonte: nome, error: cepOSM.length === 8 ? 'CEP não encontrado' : 'CEP não disponível' });
            return;
        }
        if (tipo === 'opencep') resultados.push({ fonte: 'OpenCEP (Correios)', rua: data.logradouro || '', numero: '', bairro: data.bairro || '', cidade: data.localidade || '', estado: data.uf || '', cep: data.cep || '', pais: 'Brasil', bruto: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}, ${data.cep}` });
        else if (tipo === 'viacep') resultados.push({ fonte: 'ViaCEP', rua: data.logradouro || '', numero: '', bairro: data.bairro || '', cidade: data.localidade || '', estado: data.uf || '', cep: data.cep || '', pais: 'Brasil', bruto: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}, ${data.cep}` });
        else if (tipo === 'brasilapi') resultados.push({ fonte: 'BrasilAPI', rua: data.street || '', numero: '', bairro: data.neighborhood || '', cidade: data.city || '', estado: data.state || '', cep: data.cep || '', pais: 'Brasil', bruto: `${data.street}, ${data.neighborhood}, ${data.city} - ${data.state}, ${data.cep}` });
    });

    if (cepOSM.length !== 8) {
        ['OpenCEP (Correios)', 'ViaCEP', 'BrasilAPI'].forEach(nome => {
            if (!resultados.find(r => r.fonte === nome)) resultados.push({ fonte: nome, error: 'CEP não disponível para esta coordenada' });
        });
    }

    renderizarResultados(resultados);
    await sugerirIA(lat, lng);
}

// ============================================
// IA DE SUGESTÃO
// ============================================
function distanciaMetros(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function sugerirIA(lat, lng) {
    const aiBox = document.getElementById('aiSuggestion');
    if (!usuarioAtual) { aiBox.style.display = 'none'; return; }

    try {
        const { data, error } = await supabase
            .from('enderecos')
            .select('*')
            .eq('user_id', usuarioAtual.id)
            .gte('lat', lat - 0.001)
            .lte('lat', lat + 0.001)
            .gte('lng', lng - 0.001)
            .lte('lng', lng + 0.001);

        if (error || !data || data.length === 0) { aiBox.style.display = 'none'; return; }

        const proximos = data
            .map(c => ({ ...c, distancia: distanciaMetros(lat, lng, c.lat, c.lng) }))
            .filter(c => c.distancia <= 100)
            .sort((a, b) => a.distancia - b.distancia);

        if (proximos.length === 0) { aiBox.style.display = 'none'; return; }

        const top = proximos[0];
        aiBox.style.display = 'block';
        aiBox.innerHTML = `<strong>Sugestão da IA:</strong> Já existe um endereço cadastrado a <strong>${top.distancia.toFixed(0)}m</strong> desta coordenada:<br><strong>${escapeHtml(top.rua)}, ${top.numero}</strong> — ${top.tipo_complemento || ''} ${top.complemento || ''} ${top.bairro ? '· ' + escapeHtml(top.bairro) : ''}<br><small>(fonte: ${escapeHtml(top.fonte || '-')})</small>`;
    } catch (e) {
        console.error(e);
        aiBox.style.display = 'none';
    }
}

// ============================================
// RENDERIZAR RESULTADOS
// ============================================
function renderizarResultados(resultados) {
    enderecosEncontrados = resultados;
    const list = document.getElementById('enderecosList');
    list.innerHTML = '';
    const selectFonte = document.getElementById('fonteSelect');
    selectFonte.innerHTML = '';
    let temAlgumaValida = false;

    resultados.forEach((r, idx) => {
        const div = document.createElement('div');
        div.className = 'endereco-item' + (r.error ? ' error' : '');
        if (r.error) div.innerHTML = `<span class="fonte">${r.fonte}</span><br>${r.error}`;
        else {
            temAlgumaValida = true;
            div.innerHTML = `<span class="fonte">${r.fonte}</span><pre>Rua:      ${r.rua || '-'}
Número:   ${r.numero || '-'}
Bairro:   ${r.bairro || '-'}
Cidade:   ${r.cidade || '-'} / ${r.estado || '-'}
CEP:      ${r.cep || '-'}
País:     ${r.pais || '-'}
Completo: ${r.bruto || '-'}</pre>`;
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = r.fonte;
            selectFonte.appendChild(opt);
        }
        list.appendChild(div);
    });

    const optBase = document.createElement('option');
    optBase.value = 'base';
    optBase.textContent = 'CadastroBase (manual)';
    selectFonte.appendChild(optBase);

    if (!temAlgumaValida) {
        const aviso = document.createElement('option');
        aviso.value = '';
        aviso.textContent = '-- Nenhuma fonte disponível --';
        selectFonte.insertBefore(aviso, selectFonte.firstChild);
        selectFonte.value = 'base';
    }
}

// ============================================
// ADICIONAR
// ============================================
document.getElementById('addBtn').addEventListener('click', async () => {
    const fonteValor = document.getElementById('fonteSelect').value;
    if (fonteValor === '') { alert('Selecione uma fonte de dados.'); return; }

    const numero = document.getElementById('numeroInput').value.trim();
    const tipoComplemento = document.getElementById('tipoComplemento').value;
    const complemento = document.getElementById('complementoInput').value.trim();
    if (!numero) { alert('Informe o número da residência.'); return; }

    const coordsTexto = document.getElementById('coordsDisplay').textContent;
    const [latStr, lngStr] = coordsTexto.split(',').map(s => s.trim());
    const lat = parseFloat(latStr), lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) { alert('Marque um ponto no mapa antes de adicionar.'); return; }

    const registro = {
        user_id: usuarioAtual.id,
        area_id: areaAtualId,
        numero,
        tipo_complemento: tipoComplemento,
        complemento,
        lat, lng,
        fonte: 'CadastroBase'
    };

    if (fonteValor !== 'base') {
        const fonte = enderecosEncontrados[parseInt(fonteValor)];
        if (!fonte) { alert('Fonte inválida.'); return; }
        registro.rua = fonte.rua || '';
        registro.bairro = fonte.bairro || '';
        registro.cidade = fonte.cidade || '';
        registro.estado = fonte.estado || '';
        registro.cep = fonte.cep || '';
        registro.pais = fonte.pais || 'Brasil';
        registro.fonte = fonte.fonte;
    } else {
        alert('Fonte "CadastroBase" precisa de dados manuais. Preencha os campos no formulário de edição após adicionar.');
        return;
    }

    const { error } = await supabase.from('enderecos').insert(registro);
    if (error) { alert('Erro ao salvar: ' + error.message); return; }

    localStorage.setItem('ultimoNumero', numero);

    document.getElementById('tipoComplemento').value = '';
    document.getElementById('complementoInput').value = '';

    await carregarCadastrados();
    alert('Endereço adicionado!');
});

// ============================================
// CARREGAR / RENDERIZAR CADASTRADOS
// ============================================
async function carregarCadastrados() {
    if (!usuarioAtual) return;

    let query = supabase.from('enderecos').select('*').eq('user_id', usuarioAtual.id);
    if (areaAtualId) query = query.eq('area_id', areaAtualId);

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) { console.error('Erro ao carregar:', error); return; }

    cadastrados = (data || []).map(d => ({
        id: d.id,
        rua: d.rua, numero: d.numero,
        tipoComplemento: d.tipo_complemento, complemento: d.complemento,
        bairro: d.bairro, cidade: d.cidade, estado: d.estado,
        cep: d.cep, pais: d.pais, lat: d.lat, lng: d.lng,
        coords: `${d.lat}, ${d.lng}`,
        fonte: d.fonte
    }));

    renderizarCadastrados();
    renderizarMarcadoresSalvos();

    const ultimo = localStorage.getItem('ultimoNumero');
    if (ultimo && !document.getElementById('numeroInput').value) {
        document.getElementById('numeroInput').value = ultimo;
    }
}

function renderizarCadastrados() {
    const panel = document.getElementById('cadastradosPanel');
    const tbody = document.querySelector('#cadastradosTable tbody');
    tbody.innerHTML = '';
    if (cadastrados.length === 0) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';
    cadastrados.forEach((c, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.rua || '-'}</td>
            <td>${c.numero || '-'}</td>
            <td>${c.tipoComplemento || '-'}</td>
            <td>${c.complemento || '-'}</td>
            <td>${c.bairro || '-'}</td>
            <td>${c.cidade || '-'}</td>
            <td>${c.cep || '-'}</td>
            <td><small>${c.coords}</small></td>
            <td><small>${c.fonte}</small></td>
            <td><button onclick="removerCadastro(${i})">X</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarMarcadoresSalvos() {
    marcadoresSalvos.forEach(m => map.removeLayer(m));
    marcadoresSalvos = [];
    cadastrados.forEach(c => {
        if (!isNaN(c.lat) && !isNaN(c.lng)) {
            const m = L.marker([c.lat, c.lng], { icon: houseIcon }).addTo(map);
            m.bindPopup(`<strong>${escapeHtml(c.rua)}, ${c.numero}</strong><br>${c.tipoComplemento || ''} ${c.complemento || ''}<br>${c.bairro ? c.bairro + '<br>' : ''}${c.cidade} - ${c.estado}<br>CEP: ${c.cep || '-'}<br><small>Fonte: ${c.fonte || '-'}</small>`);
            marcadoresSalvos.push(m);
        }
    });
}

async function removerCadastro(i) {
    if (!confirm('Remover este endereço?')) return;
    const c = cadastrados[i];
    if (!c || !c.id) return;
    const { error } = await supabase.from('enderecos').delete().eq('id', c.id);
    if (error) { alert('Erro ao remover: ' + error.message); return; }
    await carregarCadastrados();
}

// ============================================
// ÁREAS
// ============================================
async function carregarAreaAtual() {
    const saved = sessionStorage.getItem('areaAtualId');
    if (saved) {
        areaAtualId = parseInt(saved);
        const { data } = await supabase.from('areas').select('nome').eq('id', areaAtualId).single();
        if (data) document.getElementById('areaLabel').textContent = 'Área: ' + data.nome;
    }
}

document.getElementById('novaAreaBtn').addEventListener('click', async () => {
    const nome = prompt('Nome da nova área (ex: "Vila 1 - Rua Martins Lage"):');
    if (!nome) return;

    const c = confirm('Isso vai criar uma nova área e limpar os endereços atuais da tela.\nOs já salvos continuam no banco.\n\nDeseja continuar?');
    if (!c) return;

    const { data: area, error } = await supabase
        .from('areas')
        .insert({ user_id: usuarioAtual.id, nome })
        .select()
        .single();

    if (error) { alert('Erro ao criar área: ' + error.message); return; }

    areaAtualId = area.id;
    sessionStorage.setItem('areaAtualId', areaAtualId);
    document.getElementById('areaLabel').textContent = 'Área: ' + nome;

    cadastrados = [];
    renderizarCadastrados();
    renderizarMarcadoresSalvos();
    document.getElementById('enderecosList').innerHTML = '<p style="color:#999; font-style:italic;">Nenhum endereço consultado ainda.</p>';
    document.getElementById('coordsDisplay').textContent = '-';
    document.getElementById('origemDisplay').textContent = '-';
    document.getElementById('aiSuggestion').style.display = 'none';
    if (marcadorAtual) { map.removeLayer(marcadorAtual); marcadorAtual = null; }

    alert(`Área "${nome}" criada!`);
});

// ============================================
// EXPORTAR / LIMPAR
// ============================================
document.getElementById('exportBtn').addEventListener('click', () => {
    if (cadastrados.length === 0) { alert('Nenhum endereço cadastrado.'); return; }
    const headers = ['Rua','Número','Tipo Complemento','Complemento','Bairro','Cidade','Estado','CEP','País','Coordenadas','Fonte'];
    const rows = cadastrados.map(c => [c.rua, c.numero, c.tipoComplemento, c.complemento, c.bairro, c.cidade, c.estado, c.cep, c.pais, c.coords, c.fonte]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `enderecos_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
});

document.getElementById('clearBtn').addEventListener('click', async () => {
    if (!confirm('Apagar TODOS os endereços cadastrados desta área?')) return;
    if (!usuarioAtual) return;
    let query = supabase.from('enderecos').delete().eq('user_id', usuarioAtual.id);
    if (areaAtualId) query = query.eq('area_id', areaAtualId);
    const { error } = await query;
    if (error) { alert('Erro ao limpar: ' + error.message); return; }
    await carregarCadastrados();
});

// ============================================
// UPLOAD DE ROTEIRO (XML dos Correios + CSV)
// ============================================
document.getElementById('uploadBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('roteiroFile');
    const status = document.getElementById('uploadStatus');
    const file = fileInput.files[0];

    if (!file) {
        status.textContent = 'Selecione um arquivo antes de importar.';
        status.style.color = '#c62828';
        return;
    }

    status.textContent = 'Lendo arquivo...';
    status.style.color = '#555';

    const reader = new FileReader();
    reader.onload = async (e) => {
        const texto = e.target.result;
        let registros = [];

        if (file.name.toLowerCase().endsWith('.xml')) {
            // Parser XML dos Correios
            try {
                const parser = new DOMParser();
                const xml = parser.parseFromString(texto, 'text/xml');
                const nodes = xml.getElementsByTagName('roteiro');

                for (let i = 0; i < nodes.length; i++) {
                    const n = nodes[i];
                    const get = (tag) => {
                        const el = n.getElementsByTagName(tag)[0];
                        return el ? el.textContent.trim() : '';
                    };
                    const tipo = get('tipo_lograd');
                    const nome = get('nome_lograd');
                    const titulo = get('titulo');
                    const tituloAbrev = get('titulo_abrev');

                    // Monta rua no padrão: "RUA NOME" ou "RUA TITULO NOME"
                    const partesRua = [tipo, titulo, nome].filter(Boolean);
                    const rua = partesRua.join(' ').toUpperCase();

                    registros.push({
                        user_id: usuarioAtual.id,
                        area_id: areaAtualId,
                        rua: rua,
                        numero: '',
                        bairro: get('bairro'),
                        cidade: get('municipio'),
                        estado: get('uf_abrev') || get('uf'),
                        cep: get('cep'),
                        pais: 'Brasil',
                        complemento: '',
                        tipo_complemento: '',
                        lat: null,
                        lng: null,
                        fonte: 'Roteiro Correios'
                    });
                }

                if (registros.length === 0) {
                    status.textContent = 'Nenhum <roteiro> encontrado no XML.';
                    status.style.color = '#c62828';
                    return;
                }
            } catch (err) {
                console.error(err);
                status.textContent = 'Erro ao processar XML: ' + err.message;
                status.style.color = '#c62828';
                return;
            }
        } else {
            // CSV simples
            const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== '');
            if (linhas.length < 2) {
                status.textContent = 'CSV vazio ou inválido.';
                status.style.color = '#c62828';
                return;
            }
            const sep = linhas[0].includes(';') ? ';' : ',';
            const headers = linhas[0].split(sep).map(h => h.trim().toLowerCase());
            const idx = {
                rua: headers.findIndex(h => h.includes('rua') || h.includes('logradouro')),
                numero: headers.findIndex(h => h.includes('numero') || h.includes('nº') || h === 'num'),
                bairro: headers.findIndex(h => h.includes('bairro')),
                cidade: headers.findIndex(h => h.includes('cidade') || h.includes('municipio')),
                estado: headers.findIndex(h => h.includes('estado') || h === 'uf'),
                cep: headers.findIndex(h => h.includes('cep')),
                complemento: headers.findIndex(h => h.includes('complemento')),
                tipo: headers.findIndex(h => h.includes('tipo')),
                lat: headers.findIndex(h => h.includes('lat')),
                lng: headers.findIndex(h => h.includes('lng') || h.includes('lon'))
            };

            for (let i = 1; i < linhas.length; i++) {
                const cols = linhas[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
                const reg = {
                    user_id: usuarioAtual.id,
                    area_id: areaAtualId,
                    rua: idx.rua >= 0 ? cols[idx.rua] : '',
                    numero: idx.numero >= 0 ? cols[idx.numero] : '',
                    bairro: idx.bairro >= 0 ? cols[idx.bairro] : '',
                    cidade: idx.cidade >= 0 ? cols[idx.cidade] : '',
                    estado: idx.estado >= 0 ? cols[idx.estado] : '',
                    cep: idx.cep >= 0 ? cols[idx.cep] : '',
                    complemento: idx.complemento >= 0 ? cols[idx.complemento] : '',
                    tipo_complemento: idx.tipo >= 0 ? cols[idx.tipo] : '',
                    lat: idx.lat >= 0 ? parseFloat(cols[idx.lat]) || null : null,
                    lng: idx.lng >= 0 ? parseFloat(cols[idx.lng]) || null : null,
                    fonte: 'Roteiro Importado'
                };
                if (reg.rua || reg.numero) registros.push(reg);
            }

            if (registros.length === 0) {
                status.textContent = 'Nenhum registro válido encontrado no CSV.';
                status.style.color = '#c62828';
                return;
            }
        }

        status.textContent = `Importando ${registros.length} registros...`;
        status.style.color = '#555';

        // Insere em lotes de 500 para não estourar payload
        const LOTE = 500;
        let totalInserido = 0;
        for (let i = 0; i < registros.length; i += LOTE) {
            const lote = registros.slice(i, i + LOTE);
            const { error } = await supabase.from('enderecos').insert(lote);
            if (error) {
                status.textContent = `Erro no lote ${i/LOTE + 1}: ${error.message}`;
                status.style.color = '#c62828';
                return;
            }
            totalInserido += lote.length;
        }

        status.textContent = `${totalInserido} registros importados com sucesso.`;
        status.style.color = '#2e7d32';
        fileInput.value = '';
        await carregarCadastrados();
    };
    reader.readAsText(file, 'UTF-8');
});

// Download de modelo CSV
document.getElementById('downloadModeloBtn').addEventListener('click', () => {
    const headers = ['Rua','Numero','Bairro','Cidade','Estado','CEP','Tipo','Complemento','Lat','Lng'];
    const exemplo = ['Rua Martins Lage','98','Centro','Rio de Janeiro','RJ','20000-000','Casa','3','-22.90200282','-43.27065822'];
    const csv = [headers.join(';'), exemplo.join(';')].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_roteiro.csv';
    link.click();
});

// ============================================
// UTILITÁRIOS
// ============================================
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

iniciar();