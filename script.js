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

    setTimeout(() => map.invalidateSize(), 200);
    await carregarSurveys();
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
let marcadoresSurveys = [];
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
// MOTOR DE BUSCA — SOMENTE ROTEIRO
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
    if (query.length < 2) { suggestionsBox.innerHTML = ''; suggestionsBox.style.display = 'none'; return; }
    debounceTimer = setTimeout(() => buscarSugestoes(query), 300);
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

async function buscarSugestoes(query) {
    if (query === ultimoQuery) return;
    ultimoQuery = query;
    if (abortControllerAtual) abortControllerAtual.abort();
    abortControllerAtual = new AbortController();

    suggestionsBox.innerHTML = '<div class="suggestion-item empty"><span class="loading"></span>Buscando no roteiro...</div>';
    suggestionsBox.style.display = 'block';

    try {
        const { data, error } = await supabaseClient
            .from('logradouros')
            .select('*')
            .eq('origem', 'Roteiro XML')
            .or(`logradouro.ilike.%${query}%,cep.ilike.%${query.replace(/\D/g,'')}%`)
            .limit(20);
        if (error) throw error;

        suggestionsBox.innerHTML = '';
        if (!data || data.length === 0) {
            suggestionsBox.innerHTML = `
                <div class="suggestion-item empty">
                    Nenhum logradouro encontrado no roteiro.<br>
                    <small>Para incluir, envie e-mail para
                    <a href="mailto:pp-logradouro@correios.com.br?subject=Inclus%C3%A3o%20de%20logradouro&body=Logradouro%3A%20${encodeURIComponent(query)}">PP-Logradouro</a>.</small>
                </div>`;
            suggestionsBox.style.display = 'block';
            return;
        }

        data.forEach(r => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            const texto = formatarTextoLogradouro(r);
            div.innerHTML = `<span class="suggestion-icon">&#128220;</span>
                <span class="suggestion-text"><strong>Roteiro:</strong> ${escapeHtml(texto)}</span>`;
            div.addEventListener('click', () => {
                searchInput.value = texto;
                suggestionsBox.style.display = 'none';
                if (r.latitude != null && r.longitude != null) {
                    irParaLocal(Number(r.latitude), Number(r.longitude), texto, 'Roteiro');
                }
                selecionarParaSurvey(r);
            });
            suggestionsBox.appendChild(div);
        });
        suggestionsBox.style.display = 'block';
    } catch (err) {
        console.error('Busca falhou:', err);
        suggestionsBox.innerHTML = `<div class="suggestion-item empty">Erro ao buscar: ${escapeHtml(err.message)}</div>`;
        suggestionsBox.style.display = 'block';
    }
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
// IR PARA LOCAL NO MAPA
// ============================================
function irParaLocal(lat, lng, nome, origem) {
    map.setView([lat, lng], 17);
    if (marcadorAtual) map.removeLayer(marcadorAtual);
    marcadorAtual = L.marker([lat, lng], { icon: houseIcon }).addTo(map);
    marcadorAtual.bindPopup(`<strong>${escapeHtml(nome)}</strong>`).openPopup();
    document.getElementById('coordsDisplay').textContent = `${lat.toFixed(8)}, ${lng.toFixed(8)}`;
    document.getElementById('origemDisplay').textContent = `Roteiro (${origem || 'logradouro'})`;
}

document.getElementById('searchBtn').addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) buscarSugestoes(query);
});

// ============================================
// CLIQUE DIREITO — só para pegar coords
// ============================================
map.on('contextmenu', (e) => {
    e.originalEvent.preventDefault();
    const { lat, lng } = e.latlng;
    if (marcadorAtual) map.removeLayer(marcadorAtual);
    marcadorAtual = L.marker([lat, lng], { icon: houseIcon }).addTo(map);
        marcadorAtual.bindPopup(`Ponto marcado<br>${lat.toFixed(8)}, ${lng.toFixed(8)}`).openPopup();
    document.getElementById('coordsDisplay').textContent = `${lat.toFixed(8)}, ${lng.toFixed(8)}`;
    document.getElementById('origemDisplay').textContent = 'Clique no mapa (botão direito)';
    // Preenche as coords no Survey também
    if (document.getElementById('surveyLatitude')) {
        document.getElementById('surveyLatitude').value = lat.toFixed(8);
    }
    if (document.getElementById('surveyLongitude')) {
        document.getElementById('surveyLongitude').value = lng.toFixed(8);
    }
});

// ============================================
// SELECIONAR LOGRADOURO → PREENCHER SURVEY
// ============================================
// ============================================
// SELECIONAR LOGRADOURO → PREENCHER SURVEY
// (agora cruza com OSM se faltar coordenada)
// ============================================
async function selecionarParaSurvey(r) {
    enderecoBaseSelecionado = {
        _registro_id: r.id,
        origem: 'Roteiro XML',
        tipo: r.tipo || 'Rua',
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

    // Preenche os campos do Survey
    document.getElementById('surveyTipo').value = enderecoBaseSelecionado.tipo || 'Rua';
    document.getElementById('surveyLogradouro').value = enderecoBaseSelecionado.rua || '';
    document.getElementById('surveyBairro').value = enderecoBaseSelecionado.bairro || '';
    document.getElementById('surveyMunicipio').value = enderecoBaseSelecionado.cidade || '';
    document.getElementById('surveyUf').value = enderecoBaseSelecionado.estado || '';
    document.getElementById('surveyCep').value = formatarCEP(enderecoBaseSelecionado.cep || '');

    // Se o roteiro trouxe coordenadas válidas, usa
    const temCoordsRoteiro =
        enderecoBaseSelecionado.lat != null &&
        enderecoBaseSelecionado.lng != null &&
        enderecoBaseSelecionado.lat !== 0 &&
        enderecoBaseSelecionado.lng !== 0;

    if (temCoordsRoteiro) {
        document.getElementById('surveyLatitude').value = enderecoBaseSelecionado.lat.toFixed(8);
        document.getElementById('surveyLongitude').value = enderecoBaseSelecionado.lng.toFixed(8);
        irParaLocal(
            enderecoBaseSelecionado.lat,
            enderecoBaseSelecionado.lng,
            montarTextoLogradouro(enderecoBaseSelecionado),
            'Roteiro'
        );
    } else {
        // Sem coords do roteiro — limpa os campos e busca no OSM
        document.getElementById('surveyLatitude').value = '';
        document.getElementById('surveyLongitude').value = '';

        // Avisa o usuário
        showToast('Buscando coordenadas', 'Consultando o OpenStreetMap pelo logradouro...', 'info', 3000);

        const coords = await buscarCoordsOSM(enderecoBaseSelecionado);
        if (coords) {
            enderecoBaseSelecionado.lat = coords.lat;
            enderecoBaseSelecionado.lng = coords.lng;
            document.getElementById('surveyLatitude').value = coords.lat.toFixed(8);
            document.getElementById('surveyLongitude').value = coords.lng.toFixed(8);
            irParaLocal(
                coords.lat,
                coords.lng,
                montarTextoLogradouro(enderecoBaseSelecionado),
                'Roteiro + OSM'
            );
            showToast('Coordenadas encontradas', 'Localização marcada no mapa.', 'success', 2500);
        } else {
            showToast(
                'Sem coordenadas',
                'Não encontramos o logradouro no OpenStreetMap. Marque manualmente com o botão direito no mapa.',
                'warning',
                6000
            );
        }
    }

    // Card informativo do topo
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

    document.getElementById('formPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// CRUZAR LOGRADOURO COM OSM
// ============================================
async function buscarCoordsOSM(end) {
    // Monta uma query bem específica
    const partes = [
        [end.tipo, end.rua].filter(Boolean).join(' '),
        end.bairro,
        end.cidade,
        end.estado,
        end.cep
    ].filter(Boolean);

    const query = partes.join(', ');
    if (!query) return null;

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&accept-language=pt-BR&countrycodes=br`;
        const res = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.length === 0) {
            // Fallback: tenta sem CEP e sem tipo
            const query2 = [end.rua, end.bairro, end.cidade, end.estado].filter(Boolean).join(', ');
            if (!query2) return null;
            const url2 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query2)}&addressdetails=1&limit=5&accept-language=pt-BR&countrycodes=br`;
            const res2 = await fetch(url2, { headers: { 'Accept': 'application/json' } });
            if (!res2.ok) return null;
            const data2 = await res2.json();
            if (!data2 || data2.length === 0) return null;
            const item2 = escolherMelhorResultado(data2, end);
            if (!item2) return null;
            return {
                lat: parseFloat(item2.lat),
                lng: parseFloat(item2.lon),
                bruto: item2.display_name
            };
        }
        const item = escolherMelhorResultado(data, end);
        if (!item) return null;
        return {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            bruto: item.display_name
        };
    } catch (err) {
        console.warn('[OSM] erro:', err);
        return null;
    }
}

// Escolhe o resultado que mais bate com o endereço (nome da rua + bairro)
function escolherMelhorResultado(lista, end) {
    if (!lista || lista.length === 0) return null;

    const normalizar = (s) => (s || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\b(rua|r\.|avenida|av\.|travessa|tv\.|estrada|est\.|alameda|al\.|praca|praça|pc\.|largo|beco|caminho)\b\.?/g, '')
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const alvoRua = normalizar(end.rua);
    const alvoBairro = normalizar(end.bairro);
    const alvoCidade = normalizar(end.cidade);

    let melhor = null;
    let melhorScore = -1;

    lista.forEach(item => {
        const a = item.address || {};
        const rua = normalizar(a.road || a.pedestrian || '');
        const bairro = normalizar(a.suburb || a.neighbourhood || '');
        const cidade = normalizar(a.city || a.town || a.village || '');

        let score = 0;
        if (alvoRua && rua && (rua.includes(alvoRua) || alvoRua.includes(rua))) score += 3;
        if (alvoBairro && bairro && (bairro.includes(alvoBairro) || alvoBairro.includes(bairro))) score += 2;
        if (alvoCidade && cidade && (cidade.includes(alvoCidade) || alvoCidade.includes(cidade))) score += 1;

        if (score > melhorScore) {
            melhorScore = score;
            melhor = item;
        }
    });

    // Se ninguém pontuou, pega o primeiro (Nominatim já ordena por relevância)
    return melhorScore > 0 ? melhor : lista[0];
}

// Texto formatado pra popup do mapa / exibição
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
// ADICIONAR AO SURVEY (survey_detalhes)
// ============================================
document.getElementById('addBtn').addEventListener('click', async () => {
    if (!enderecoBaseSelecionado || !enderecoBaseSelecionado._registro_id) {
        showToast('Sem logradouro do roteiro', 'Selecione um logradouro na busca primeiro. Só é permitido salvar endereços do roteiro.', 'warning', 6000);
        return;
    }

    const numero = document.getElementById('numeroInput').value.trim();
    if (!numero) { showToast('Número obrigatório', 'Informe o Nº do imóvel.', 'warning'); return; }

    const comp1Tipo = document.getElementById('comp1Tipo').value;
    const comp1Valor = document.getElementById('comp1Valor').value.trim();
    const comp2Tipo = document.getElementById('comp2Tipo').value;
    const comp2Valor = document.getElementById('comp2Valor').value.trim();
    const comp3Tipo = document.getElementById('comp3Tipo').value;
    const comp3Valor = document.getElementById('comp3Valor').value.trim();

    const latStr = document.getElementById('surveyLatitude').value.trim();
    const lngStr = document.getElementById('surveyLongitude').value.trim();
    const lat = latStr && !isNaN(parseFloat(latStr)) ? parseFloat(latStr) : null;
    const lng = lngStr && !isNaN(parseFloat(lngStr)) ? parseFloat(lngStr) : null;

    const complementos = [];
    if (comp1Tipo || comp1Valor) complementos.push({ tipo: comp1Tipo || '', valor: comp1Valor || '' });
    if (comp2Tipo || comp2Valor) complementos.push({ tipo: comp2Tipo || '', valor: comp2Valor || '' });
    if (comp3Tipo || comp3Valor) complementos.push({ tipo: comp3Tipo || '', valor: comp3Valor || '' });

    const registro = {
        logradouro_id: enderecoBaseSelecionado._registro_id,
        numero: numero,
        complementos: complementos,
        latitude: lat,
        longitude: lng,
        usuario_id: usuarioAtual ? usuarioAtual.id : null
    };

    try {
        const { error } = await supabaseClient.from('survey_detalhes').insert([registro]);
        if (error) throw error;

        showToast('Survey salvo', 'Nº e complementos adicionados.', 'success', 2500);

        // Limpa respeitando os checkboxes "manter"
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

        await carregarSurveys();
    } catch (err) {
        console.error('[SALVAR SURVEY] erro:', err);
        showToast('Erro ao salvar', err.message, 'error', 8000);
    }
});

// ============================================
// CARREGAR SURVEYS SALVOS
// ============================================
async function carregarSurveys() {
    try {
        // Pega os survey_detalhes + o logradouro associado
        const { data: detalhes, error: errDet } = await supabaseClient
            .from('survey_detalhes')
            .select('*')
            .order('created_at', { ascending: true });
        if (errDet) throw errDet;

        if (!detalhes || detalhes.length === 0) {
            document.getElementById('listPanel').style.display = 'none';
            return;
        }

        // Busca os logradouros referenciados
        const ids = [...new Set(detalhes.map(d => d.logradouro_id).filter(Boolean))];
        let logsMap = {};
        if (ids.length > 0) {
            const { data: logs, error: errLog } = await supabaseClient
                .from('logradouros')
                .select('*')
                .in('id', ids);
            if (errLog) throw errLog;
            (logs || []).forEach(l => { logsMap[l.id] = l; });
        }

        const tbody = document.querySelector('#surveysTable tbody');
        tbody.innerHTML = '';

        detalhes.forEach((d, idx) => {
            const l = logsMap[d.logradouro_id] || {};
            const comps = Array.isArray(d.complementos) ? d.complementos : [];
            const compTexto = comps.length
                ? comps.map(c => `${c.tipo || '?'}: ${c.valor || ''}`).join(' | ')
                : '—';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml([l.tipo, l.logradouro].filter(Boolean).join(' ') || '—')}</td>
                <td>${escapeHtml(d.numero || '')}</td>
                <td>${escapeHtml(compTexto)}</td>
                <td>${escapeHtml(l.bairro || '')}</td>
                <td>${escapeHtml([l.municipio, l.uf].filter(Boolean).join('/') || '')}</td>
                <td class="mono">${escapeHtml(formatarCEP(l.cep || ''))}</td>
                <td class="acoes-cell">
                    <button class="btn-ir" data-idx="${idx}" title="Centralizar no mapa" type="button">🗺️</button>
                    <button class="btn-remover" data-id="${d.id}" title="Remover" type="button">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Guarda pra usar nos botões
        window._surveysCache = detalhes.map(d => ({
            ...d,
            _logradouro: logsMap[d.logradouro_id] || null
        }));

        tbody.querySelectorAll('.btn-ir').forEach(btn => {
            btn.addEventListener('click', () => {
                const s = window._surveysCache[parseInt(btn.dataset.idx, 10)];
                if (!s) return;
                const lat = s.latitude != null ? Number(s.latitude) : (s._logradouro && s._logradouro.latitude);
                const lng = s.longitude != null ? Number(s.longitude) : (s._logradouro && s._logradouro.longitude);
                if (lat == null || lng == null) return;
                map.setView([lat, lng], 18);
                if (marcadorAtual) map.removeLayer(marcadorAtual);
                marcadorAtual = L.marker([lat, lng], { icon: houseIcon }).addTo(map);
                const nome = s._logradouro ? s._logradouro.logradouro : '';
                marcadorAtual.bindPopup(`<strong>${escapeHtml(nome)}, ${escapeHtml(s.numero || '')}</strong>`).openPopup();
                document.getElementById('panel2').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        tbody.querySelectorAll('.btn-remover').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Remover este survey?')) return;
                try {
                    const { error } = await supabaseClient
                        .from('survey_detalhes')
                        .delete()
                        .eq('id', btn.dataset.id);
                    if (error) throw error;
                    showToast('Removido', 'Survey excluído.', 'success', 2000);
                    await carregarSurveys();
                } catch (err) {
                    console.error(err);
                    showToast('Erro ao remover', err.message, 'error');
                }
            });
        });

        // Marcadores no mapa
        marcadoresSurveys.forEach(m => map.removeLayer(m));
        marcadoresSurveys = [];
        window._surveysCache.forEach(s => {
            const lat = s.latitude != null ? Number(s.latitude) : (s._logradouro && s._logradouro.latitude);
            const lng = s.longitude != null ? Number(s.longitude) : (s._logradouro && s._logradouro.longitude);
            if (lat == null || lng == null) return;
            const m = L.marker([lat, lng], { icon: houseIcon }).addTo(map);
            const nome = s._logradouro ? s._logradouro.logradouro : '';
            m.bindPopup(`<strong>${escapeHtml(nome)}, ${escapeHtml(s.numero || '')}</strong>`);
            marcadoresSurveys.push(m);
        });

        document.getElementById('listPanel').style.display = 'block';
    } catch (err) {
        console.error('[CARREGAR SURVEYS] erro:', err);
        showToast('Erro ao carregar', err.message, 'error');
    }
}

// ============================================
// LIMPAR LISTA (botão do topo) — apaga todos os survey_detalhes
// ============================================
document.getElementById('novaAreaBtn').addEventListener('click', async () => {
    if (!confirm('Apagar TODOS os surveys salvos? (o roteiro será mantido)')) return;
    try {
        const { error } = await supabaseClient.from('survey_detalhes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        marcadoresSurveys.forEach(m => map.removeLayer(m));
        marcadoresSurveys = [];
        showToast('Lista limpa', 'Todos os surveys foram removidos.', 'success', 2500);
        await carregarSurveys();
    } catch (err) {
        console.error(err);
        showToast('Erro ao limpar', err.message, 'error');
    }
});

// ============================================
// LIMPAR TUDO (botão dentro da seção 6)
// ============================================
document.getElementById('clearBtn').addEventListener('click', async () => {
    if (!confirm('Apagar TODOS os surveys salvos? (o roteiro será mantido)')) return;
    try {
        const { error } = await supabaseClient.from('survey_detalhes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        marcadoresSurveys.forEach(m => map.removeLayer(m));
        marcadoresSurveys = [];
        showToast('Limpo', 'Todos os surveys foram removidos.', 'success', 2500);
        await carregarSurveys();
    } catch (err) {
        console.error(err);
        showToast('Erro ao limpar', err.message, 'error');
    }
});

// ============================================
// EXPORTAR XMLs (ZIP) — e limpa depois
// ============================================
document.getElementById('exportBtn').addEventListener('click', async () => {
    if (!window._surveysCache || window._surveysCache.length === 0) {
        showToast('Nada para exportar', 'Salve ao menos um survey.', 'warning');
        return;
    }

    try {
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip não carregado.');
        }

        const zip = new JSZip();

        const primeiroLog = window._surveysCache[0]._logradouro || {};
        const localidade = (primeiroLog.localidade || primeiroLog.municipio || 'localidade')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_')
            .toUpperCase();
        const agora = new Date();
        const carimbo = `${agora.getFullYear()}${String(agora.getMonth()+1).padStart(2,'0')}${String(agora.getDate()).padStart(2,'0')}${String(agora.getHours()).padStart(2,'0')}${String(agora.getMinutes()).padStart(2,'0')}`;
        const nomeZipBase = `${localidade}_${carimbo}`;

        window._surveysCache.forEach((s, idx) => {
            const numero = idx + 1;
            const nomePasta = `moradia${numero}`;
            const nomeArquivo = `moradia${numero}.xml`;
            const xmlConteudo = gerarXMLEdificio(s, s._logradouro, numero);
            zip.folder(nomePasta).file(nomeArquivo, xmlConteudo);
        });

        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nomeZipBase}.zip`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Apaga os surveys exportados
        const { error } = await supabaseClient.from('survey_detalhes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;

        marcadoresSurveys.forEach(m => map.removeLayer(m));
        marcadoresSurveys = [];
        showToast('ZIP gerado e lista limpa', `${window._surveysCache.length} moradia(s) exportada(s) e removida(s).`, 'success', 4000);
        window._surveysCache = [];
        await carregarSurveys();
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

    const tipo = (l.tipo || 'Rua').toString().toUpperCase();
    const nomeLograd = (l.logradouro || '').toString().toUpperCase();
    const bairro = (l.bairro || '').toString().toUpperCase();
    const municipio = (l.municipio || l.localidade || '').toString().toUpperCase();
    const uf = (l.uf || '').toString().toUpperCase();
    const codLograd = l.cod_lograd || l.id_roteiro || '0';

    const logradouroCompleto =
        `${tipo} ${nomeLograd}, ${bairro}, ${municipio}, ${municipio} - ${uf} (${codLograd})`;

    const lat = survey.latitude != null ? Number(survey.latitude) : (l.latitude != null ? Number(l.latitude) : null);
    const lng = survey.longitude != null ? Number(survey.longitude) : (l.longitude != null ? Number(l.longitude) : null);

    const coordX = lng != null ? lng.toFixed(6) : '';
    const coordY = lat != null ? lat.toFixed(6) : '';

    const codigoZona = l.codigo_zona || '';
    const nomeZona = l.nome_zona || codigoZona;
    const localidade = l.localidade || l.municipio || '';

    const idEdificio = l.id_roteiro || l.id || numero;
    const numeroFachada = survey.numero || '';
    const cep = (l.cep || '').toString().replace(/\D/g, '');
    const codBairro = l.cod_bairro || '';
    const idRoteiro = l.id_roteiro || l.id || '';
    const idLocalidade = l.id_localidade || '';

    const tecnicoNome = (usuarioAtual && usuarioAtual.user_metadata && usuarioAtual.user_metadata.nome) || '';
    const tecnicoId = (usuarioAtual && usuarioAtual.id) || '';

    const empresaId = '6';
    const empresaNome = 'LOGICTEL';

    const numPisos = '1';

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
        let registros = [];
        const nomeLower = file.name.toLowerCase();

        if (nomeLower.endsWith('.csv')) {
            registros = parseCSV(texto);
        } else if (nomeLower.endsWith('.xml')) {
            registros = parseXMLRoteiro(texto);
        } else {
            throw new Error('Formato não suportado. Use .csv ou .xml');
        }

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
        showToast('Roteiro importado', `${inseridos} logradouro(s) disponíveis para busca.`, 'success', 3500);
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

// ============================================
// PARSER XML (roteiro.xml dos Correios)
// ============================================
function parseXMLRoteiro(texto) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(texto, 'text/xml');

    const parserError = xml.querySelector('parsererror');
    if (parserError) {
        throw new Error('XML inválido: ' + parserError.textContent.substring(0, 200));
    }

    let nodes = Array.from(xml.getElementsByTagName('roteiro'));
    if (nodes.length === 0) {
        nodes = Array.from(xml.querySelectorAll('endereco, address, registro, item, linha, edificio'));
    }

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