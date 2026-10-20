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
const TECNICO_FIXO_ID = '183330161';
const TECNICO_FIXO_NOME = 'Samuel da Silva Guimaraes';

// Atributo fixo exigido pelo site de destino na tag raiz <edificio>.
// Se precisar trocar no futuro, mude só aqui.
const AUTORIZACAO_FIXA = '5590eeaed0604e85ba7a72fe5dc92e1e';

// ============================================
// TABELA DE IDS DE COMPLEMENTO
// ============================================
const _semAcentoId = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

// [nome, id] conforme a lista oficial do sistema
const COMPLEMENTO_LISTA = [
    ['Academia', 121],
    ['Acampamento', 1],
    ['Administração', 114],
    ['Ala', 2],
    ['Almoxarifado', 3],
    ['Alto', 4],
    ['Altos', 5],
    ['Ambulatório', 6],
    ['Andar', 7],
    ['Anexo', 8],
    ['Apartamento', 9],
    ['Armazém', 10],
    ['ATE', 11],
    ['Baixos', 12],
    ['Banca', 13],
    ['Barracão', 14],
    ['Beco', 15],
    ['Bloco', 16],
    ['Box', 17],
    ['Brigada de incêndio', 115],
    ['Cais', 18],
    ['Caminho', 20],
    ['Carpintaria', 21],
    ['Casa', 22],
    ['Cela', 23],
    ['Central', 24],
    ['Chácara', 124],
    ['Cobertura', 25],
    ['Colina', 26],
    ['Condomínio', 27],
    ['Conjunto', 28],
    ['Conjunto residencial', 29],
    ['Corredor', 30],
    ['Depósito', 31],
    ['Diretoria', 32],
    ['Divisão', 34],
    ['Edifício', 35],
    ['Entrada', 36],
    ['Escritório', 37],
    ['Espaço de convivência', 38],
    ['Estação', 39],
    ['Etapa', 40],
    ['Frente', 43],
    ['Fundos', 44],
    ['Fórum', 42],
    ['Galeria', 45],
    ['Galpão', 46],
    ['Garagem', 47],
    ['Gleba', 48],
    ['Granja', 49],
    ['Grupo', 50],
    ['Guichê', 52],
    ['Hagar', 53],
    ['Lado', 55],
    ['Lanchonete', 57],
    ['Letra', 58],
    ['Loja', 59],
    ['Lote', 60],
    ['Loteamento', 61],
    ['Lâmina', 56],
    ['Mansão', 62],
    ['Mart', 63],
    ['Mercado', 64],
    ['Mezanino', 65],
    ['Módulo', 66],
    ['Não disponível', 119],
    ['Não se aplica', 117],
    ['Núcleo', 67],
    ['Oficina mecânica', 68],
    ['Orgão', 69],
    ['Palácio', 70],
    ['Parada', 71],
    ['Pavilhão', 73],
    ['Pavimento', 74],
    ['Pilotis', 75],
    ['Piso', 76],
    ['Plataforma', 77],
    ['Portão', 81],
    ['Porão', 80],
    ['Poço', 78],
    ['Presidência', 83],
    ['Prédio', 82],
    ['Pátio', 72],
    ['Quadra', 85],
    ['Quarto', 86],
    ['Quilômetro', 87],
    ['Quinta', 88],
    ['Quiosque', 89],
    ['Ramal', 90],
    ['Recepção', 91],
    ['Refeitório', 92],
    ['Restaurante', 93],
    ['Rótula', 95],
    ['Sala', 96],
    ['Sala técnica', 116],
    ['Salão de eventos', 120],
    ['Sem complemento', 118],
    ['Setor', 98],
    ['Seção', 97],
    ['Sobrado', 100],
    ['Sobreloja', 101],
    ['Stand', 102],
    ['Sub número', 122],
    ['Subestação', 103],
    ['Subsolo', 104],
    ['Super quadra', 105],
    ['Terreno', 106],
    ['Torre', 109],
    ['Travessa', 110],
    ['Trecho', 111],
    ['Térreo', 107],
    ['Vila', 112],
    ['Vizinho', 113],
    ['XX', -99]
];
const COMPLEMENTO_IDS = {};
COMPLEMENTO_LISTA.forEach(([n, id]) => { COMPLEMENTO_IDS[_semAcentoId(n)] = id; });

function getIdComplemento(tipo) {
    if (!tipo) return '';
    return COMPLEMENTO_IDS[_semAcentoId(tipo)] ?? '';
}

// ============================================
// TIPOS DE IMÓVEL (id_tipo_imovel)
// ============================================
const TIPO_IMOVEL_LISTA = [
    ['ACADEMIA', 53287342],
    ['ADMINISTRACÃO', 3354214545],
    ['AEROPORTO', 9],
    ['AGENCIA', 42],
    ['AGENCIA DOS CORREIOS', 19],
    ['BANCO', 15],
    ['BAR', 75303693],
    ['BAT POLICIA MILITAR', 62],
    ['BIBLIOTECA', 62775983],
    ['BLOCO', 59],
    ['BOULEVARD', 73],
    ['CAMERA', 3354213982],
    ['CAMPUS', 6],
    ['CENTRO', 53287341],
    ['CENTRO COMERCIAL', 22],
    ['CENTRO EDUCACAO INF', 54],
    ['CENTRO EMPRESARIAL', 50],
    ['CENTRO MEDICO', 23],
    ['CENTRO SOCIAL', 52],
    ['CHACARA', 137793979],
    ['CLINICA', 51],
    ['CLINICA RADIOLOGICA', 38],
    ['CLUBE', 21],
    ['COLEGIO', 53],
    ['COMERCIAL', 2340446005],
    ['COMPANIA', 48],
    ['CONDOMINIO', 3],
    ['CONJUNTO', 7],
    ['CONSTRUTORA', 46],
    ['DELEGACIA', 26],
    ['DEPOSITO', 60],
    ['DISTRIBUIDORA', 66],
    ['DROGARIA', 79],
    ['ED', 64],
    ['EDIFICIO', 10],
    ['EMPRESARIAL', 53382819],
    ['ENGENHO', 76],
    ['ESCOLA', 31],
    ['ESCRITORIO', 80],
    ['ESTACAO', 13],
    ['ESTACIONAMENTO', 52955711],
    ['ESTADIO', 72],
    ['ESTADIO DE FUTEBOL', 71],
    ['ESTALEIRO', 61694049],
    ['FABRICA', 16],
    ['FACULDADE', 36],
    ['FARMACIA', 29],
    ['FAZENDA', 77],
    ['FISEPE', 33],
    ['FORUM', 39],
    ['FUNDACAO', 55],
    ['FUNDESA', 32],
    ['GALERIA', 2],
    ['GARAGEM', 291425241],
    ['GRUPO', 81],
    ['HIPERMERCADO', 11],
    ['HOSPITAL', 12],
    ['HOTEL', 34],
    ['IGREJA', 25],
    ['IMOBILIARIA', 65],
    ['INDUSTRIA', 63],
    ['INSTITUTO', 57],
    ['LABORATORIO', 56],
    ['LANCHONETE', 68],
    ['LOJA', 35],
    ['LOTEAMENTO', 44],
    ['LOTERIA', 74],
    ['MERCADO', 5],
    ['MINISTERIO', 2431232477],
    ['MOTEL', 58],
    ['MUSEU', 75],
    ['Nome não Informado', 2431232478],
    ['OFICINA', 76087509],
    ['PADARIA', 43],
    ['PALACIO', 70],
    ['PANIFICADORA', 40],
    ['PARQUE', 49],
    ['PATIO', 20],
    ['PENITENCIARIA', 78],
    ['PORTOMAR', 84],
    ['POSTO DE GASOLINA', 17],
    ['POSTO DE SAUDE', 30],
    ['POUSADA', 80285322],
    ['PREDIO', 1],
    ['PREFEITURA', 41],
    ['PUBLICO', 2340448009],
    ['QUADRA', 18],
    ['QUARTEL', 47],
    ['QUIOSQUE', 88],
    ['RAMAL', 61],
    ['RESIDENCIAL', 27],
    ['RESTAURANTE', 69],
    ['RODOVIARIA', 14],
    ['RUA', 306799724],
    ['SALÃO DE BELEZA', 75303694],
    ['SECRETARIA', 28],
    ['SHOPPING', 4],
    ['SUPERMERCADO', 24],
    ['TELEFONE PÚBLICO', 51378260],
    ['TRANSPORTADORA', 37],
    ['TRIBU REGIONAL ELEIT', 82],
    ['TRIBUNAL DE JUSTICA', 83],
    ['TRIBUNAL S ELEITORAL', 45],
    ['UNIVERSIDADE', 8],
    ['USINA', 67],
    ['VILA', 69722092]
];
const TIPO_IMOVEL_IDS = {};
TIPO_IMOVEL_LISTA.forEach(([n, id]) => { TIPO_IMOVEL_IDS[_semAcentoId(n)] = id; });

function getIdTipoImovel(tipo) {
    if (!tipo) return '';
    return TIPO_IMOVEL_IDS[_semAcentoId(tipo)] ?? '';
}

(function popularTiposImovel() {
    const sel = document.getElementById('tipoImovelInput');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Selecione —</option>' +
        TIPO_IMOVEL_LISTA.map(([n]) => `<option value="${n}">${n}</option>`).join('');
})();

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

// Base IBGE: somente usuários ATR
function usuarioEhATR() {
    const login = (sessionStorage.getItem('usuarioLogado') || '').trim().toUpperCase();
    const email = (usuarioAtual && usuarioAtual.email ? usuarioAtual.email : '').toUpperCase();
    return /^ATR/.test(login) || /^ATR/.test(email);
}

function aplicarPermissoes() {
    const atr = usuarioEhATR();
    const panel6 = document.getElementById('ibgePanel');
    const nav6 = document.getElementById('navIbgeBtn');
    if (panel6) panel6.style.display = atr ? '' : 'none';
    if (nav6) nav6.style.display = atr ? '' : 'none';
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
let _iaMeta = 0;     // qtde de surveys no endereço para verificar o padrão (0 = não expandido)
let _iaJanela = 5;   // quantos surveys recentes a análise de padrão considera
let _iaCorte = 0;    // surveys antes deste índice (já tratados pela IA) não contam para um novo disparo
let _iaSetor = null; // linhas desenhadas no mapa: { linhas: [...], layer }
let _iaPreview = null; // pontos de pré-visualização dos surveys que serão criados
function limparPreviewLinhas() {
    if (_iaPreview) { map.removeLayer(_iaPreview); _iaPreview = null; }
}

function limparSetorIA() {
    limparPreviewLinhas();
    if (_iaSetor && _iaSetor.layer) map.removeLayer(_iaSetor.layer);
    _iaSetor = null;
}
let _surveyEditandoIdx = null;
let _espSel = null;   // sessão em andamento: { sel:Set(_id), modoLinha, camada, painelEl, ... }
let _modoIA = null;   // modo que continua ativo no mapa (IBGE e Espacialização); os demais são de uso único

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

    iniciarLogoutAutomatico();
    aplicarPermissoes();
    setTimeout(() => map.invalidateSize(), 400);
    renderizarSurveys();
    inicializarChatIA();

    document.getElementById('exportHeaderBtn')?.addEventListener('click', () => {
        document.getElementById('exportBtn')?.click();
    });
}

async function encerrarSessao(motivo) {
    try { await supabaseClient.auth.signOut(); } catch (e) { console.warn('signOut:', e); }
    sessionStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('usuarioNome');
    localStorage.removeItem('loginEm');
    window.location.href = 'login.html' + (motivo ? '?motivo=' + motivo : '');
}

document.getElementById('logoutBtn').addEventListener('click', () => encerrarSessao());

// ============================================
// LOGOUT AUTOMÁTICO DIÁRIO ÀS 19h
// - Quem está com o sistema aberto é desconectado quando o relógio chega às 19:00.
// - Quem deixou a sessão salva de um dia para o outro também cai: se o login foi feito
//   antes do último 19:00, a sessão não vale mais.
// ============================================
const HORA_LOGOUT_AUTOMATICO = 19;   // 19:00
const AVISO_LOGOUT_MIN = 5;          // avisa 5 min antes

function ultimoCorteLogout(agora = new Date()) {
    const c = new Date(agora);
    c.setHours(HORA_LOGOUT_AUTOMATICO, 0, 0, 0);
    if (c > agora) c.setDate(c.getDate() - 1);   // ainda não deu 19h hoje → o corte foi ontem
    return c;
}
function proximoCorteLogout(agora = new Date()) {
    const c = new Date(agora);
    c.setHours(HORA_LOGOUT_AUTOMATICO, 0, 0, 0);
    if (c <= agora) c.setDate(c.getDate() + 1);
    return c;
}
function sessaoExpiradaPorHorario() {
    let loginEm = parseInt(localStorage.getItem('loginEm') || '', 10);
    if (!loginEm || isNaN(loginEm)) {            // sessão antiga, sem carimbo: considera "agora"
        loginEm = Date.now();
        localStorage.setItem('loginEm', String(loginEm));
    }
    return loginEm < ultimoCorteLogout().getTime();
}
function iniciarLogoutAutomatico() {
    if (sessaoExpiradaPorHorario()) { encerrarSessao('horario'); return; }

    let avisou = false;
    const verificar = () => {
        if (sessaoExpiradaPorHorario()) { encerrarSessao('horario'); return; }
        const falta = proximoCorteLogout().getTime() - Date.now();
        if (!avisou && falta <= AVISO_LOGOUT_MIN * 60000) {
            avisou = true;
            showToast('Sessão termina às ' + HORA_LOGOUT_AUTOMATICO + 'h',
                `Você será desconectado em até ${AVISO_LOGOUT_MIN} min. Exporte o ZIP para não perder os surveys da lista.`, 'warning', 15000);
        }
    };
    verificar();
    setInterval(verificar, 15000);
    // ao voltar para a aba (notebook que dormiu, por exemplo), confere na hora
    document.addEventListener('visibilitychange', () => { if (!document.hidden) verificar(); });
}

// ============================================
// MAPA
// ============================================
const map = L.map('map', { maxZoom: 22, minZoom: 3, zoomControl: false }).setView([-22.90200282, -43.27065822], 15);

// Trava a rolagem interna do card do mapa: overflow "clip" não cria área rolável,
// então o navegador não consegue deslocar o card (deformando a borda) ao focar/abrir popups
(function travarRolagemCardMapa() {
    let el = map.getContainer();
    while (el && el !== document.body) {
        el.style.overflow = 'clip';
        if (el.classList && el.classList.contains('card')) break;
        el = el.parentElement;
    }
})();

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

// Cores das linhas desenhadas pela IA (cada linha = uma cor, repetindo se passar de 10)
// NUNCA usar vermelho: ele é reservado para o ponto clicado ainda não cadastrado.
const PALETA_LINHAS = ['#16a34a', '#2563eb', '#d97706', '#9333ea', '#0891b2', '#65a30d', '#4f46e5', '#0d9488', '#a16207', '#c026d3'];
const corLinha = (i) => PALETA_LINHAS[i % PALETA_LINHAS.length];
const _iconesCor = {};
function iconeCasaCor(cor) {
    if (!_iconesCor[cor]) {
        _iconesCor[cor] = L.divIcon({
            className: 'house-marker',
            html: houseSVG.replace(/#2a4fd6/g, cor).replace(/#1e3c72/g, '#1f2937'),
            iconSize: [14, 18], iconAnchor: [7, 18], popupAnchor: [0, -18]
        });
    }
    return _iconesCor[cor];
}
// Survey em MODO EDIÇÃO: casinha vermelha piscando (classe house-editando no CSS)
let _iconeEdicao = null;
function iconeEdicao() {
    if (!_iconeEdicao) {
        _iconeEdicao = L.divIcon({
            className: 'house-marker house-editando',
            html: houseSVG.replace(/#2a4fd6/g, '#dc2626').replace(/#1e3c72/g, '#7f1d1d'),
            iconSize: [14, 18], iconAnchor: [7, 18], popupAnchor: [0, -18]
        });
    }
    return _iconeEdicao;
}
// Ícone do survey: cor da linha (se veio da IA de linhas) > verde IA > azul padrão
function iconeSurvey(s) {
    if (s.multiUc) return iconeCasaCor('#7c3aed');   // roxo = imóvel com várias UCs
    return s._cor ? iconeCasaCor(s._cor) : (s._ia ? houseIconIA : houseIcon);
}
// Acrescenta o número da fachada sempre visível embaixo da casinha (igual às casinhas do IBGE)
function iconeComNumero(icone, s) {
    const num = (s && s.numero != null ? String(s.numero) : '').trim();
    if (!num) return icone;
    const o = icone.options;
    return L.divIcon({
        className: o.className,
        html: `${o.html}<span class="house-num">${escapeHtml(num)}</span>`,
        iconSize: o.iconSize, iconAnchor: o.iconAnchor, popupAnchor: o.popupAnchor
    });
}

// Casinha VERMELHA = posição ainda não cadastrada (pendente)
const houseIconPendente = L.divIcon({
    className: 'house-marker',
    html: houseSVG.replace(/#2a4fd6/g, '#dc2626').replace(/#1e3c72/g, '#991b1b'),
    iconSize: [14, 18], iconAnchor: [7, 18], popupAnchor: [0, -18]
});

// Remove a casinha vermelha; a azul fixa vem de renderizarMarcadoresSurveys()
function fixarMarcadorPendente() {
    if (marcadorAtual) { map.removeLayer(marcadorAtual); marcadorAtual = null; }
}

// Linha com os IDs do roteiro (cod_lograd / id_roteiro / id_localidade)
function idsRoteiroHtml(o) {
    o = o || {};
    const v = (x) => (x === null || x === undefined || x === '') ? '—' : escapeHtml(String(x));
    return `<small style="display:block;color:var(--text-tertiary);">cod_lograd: ${v(o.cod_lograd)} • id_roteiro: ${v(o.id_roteiro)} • id_localidade: ${v(o.id_localidade)}</small>`;
}

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

// Avança de um passo para o próximo (1 → 2 → 3 → 4): recolhe o anterior, abre e rola até o seguinte
function avancarPara(deId, paraId) {
    if (deId) recolherCard(deId);
    expandirCard(paraId);
    // espera o layout recalcular após recolher; no passo 3 usa a visão fixa do formulário
    requestAnimationFrame(() => paraId === 'formPanel' ? centralizarFormularioSurvey() : irParaCard(paraId));
    document.querySelectorAll('.header-nav button').forEach(b => b.classList.toggle('active', b.dataset.goto === paraId));
}

// Visão fixa do passo 3: da Latitude/Longitude até o botão "Adicionar ao Survey".
// Usada ao chegar no passo 3 e de novo a cada survey salvo, para não precisar rolar a tela.
function centralizarFormularioSurvey() {
    expandirCard('formPanel');
    const alvo = document.getElementById('surveyLatitude')?.parentElement;
    if (!alvo) { irParaCard('formPanel'); return; }
    const header = document.querySelector('.app-header');
    alvo.style.scrollMarginTop = ((header ? header.offsetHeight : 60) + 10) + 'px'; // abaixo do cabeçalho fixo
    alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.header-nav button').forEach(b => b.classList.toggle('active', b.dataset.goto === 'formPanel'));
}
function irParaListaAposSalvar() {
    requestAnimationFrame(centralizarFormularioSurvey);
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
// Troca a camada de fundo: 'map' (Mapa), 'satellite' (Satélite) ou 'mub' (Mapa + imagem do MUB por cima)
function ativarCamadaMapa(alvo) {
    if (alvo === camadaAtual) return;
    if (camadaAtual === 'mub') { window.MUB && window.MUB.desativar(); map.removeLayer(camadas.map); }
    else map.removeLayer(camadas[camadaAtual]);

    if (alvo === 'mub') { camadas.map.addTo(map); window.MUB && window.MUB.ativar(); }
    else camadas[alvo].addTo(map);

    camadaAtual = alvo;
    document.querySelectorAll('.map-tab').forEach(t => t.classList.toggle('active', t.dataset.layer === alvo));
}

document.querySelectorAll('.map-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.stopPropagation();
        const alvo = tab.dataset.layer;
        if (alvo === camadaAtual) return;
        // MUB ainda não carregado: pede a imagem (ao carregar, a aba é ativada sozinha)
        if (alvo === 'mub' && !(window.MUB && window.MUB.temImagem())) {
            window.MUB && window.MUB.escolher();
            return;
        }
        ativarCamadaMapa(alvo);
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
        if (query) buscarSugestoes(query, { explicita: true });
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

// ---- utilitários de robustez (timeout / espera) ----
const _esperar = (ms) => new Promise(r => setTimeout(r, ms));
function comTimeout(promessa, ms, msg = 'Tempo esgotado') {
    let timer;
    const limite = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(msg)), ms); });
    return Promise.race([promessa, limite]).finally(() => clearTimeout(timer));
}

let _buscaSeq = 0;            // identifica a busca mais recente (respostas antigas são descartadas)
let _buscaEmAndamento = false;

// Consulta o roteiro. Retorna a lista, ou null se a pesquisa for curta demais.
async function consultarRoteiro(query) {
    const cepDigitos = query.replace(/\D/g, '');

    if (cepDigitos.length === 8) {
        const { data, error } = await supabaseClient
            .from('logradouros').select('*')
            .eq('origem', 'Roteiro XML')
            .ilike('cep', `%${cepDigitos}%`)
            .limit(30);
        if (error) throw error;
        return data || [];
    }

    const normalizar = (s) => (s || '')
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ').trim();

    const queryNorm = normalizar(query)
        .replace(/^(rua|r\.?|avenida|av\.?|travessa|tv\.?|estrada|est\.?|alameda|al\.?|praca|praça|pc\.?|largo|beco|caminho)\s+/i, '')
        .trim();

    const palavras = queryNorm.split(/\s+/).filter(p => p.length >= 2);
    if (palavras.length === 0) return null;

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
        const { data: data2, error: error2 } = await supabaseClient
            .from('logradouros').select('*')
            .eq('origem', 'Roteiro XML')
            .or(`logradouro.ilike.%${segunda}%,bairro.ilike.%${segunda}%,municipio.ilike.%${segunda}%,cep.ilike.%${segunda}%`)
            .limit(200);
        if (error2) throw error2;
        filtrados = (data2 || []).filter(passaFiltro);
    }

    if (filtrados.length === 0 && data && data.length > 0) filtrados = data;
    return filtrados;
}

// opts.explicita = true quando veio do botão Buscar / Enter (leva ao passo 2)
async function buscarSugestoes(query, opts = {}) {
    const explicita = !!opts.explicita;
    // só ignora se for exatamente a mesma busca ainda em andamento
    if (!explicita && _buscaEmAndamento && query === ultimoQuery) return;

    const seq = ++_buscaSeq;
    ultimoQuery = query;
    _buscaEmAndamento = true;

    const mostrarCarregando = (txt) => {
        suggestionsBox.innerHTML = `<div class="suggestion-item empty"><span class="loading"></span>${txt}</div>`;
        suggestionsBox.style.display = 'block';
    };
    mostrarCarregando('Buscando no roteiro...');

    const MAX_TENTATIVAS = 3;
    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
        try {
            const lista = await comTimeout(consultarRoteiro(query), 12000, 'A busca demorou demais');
            if (seq !== _buscaSeq) return;       // uma busca mais nova já assumiu
            _buscaEmAndamento = false;

            if (lista === null) {
                suggestionsBox.innerHTML = '<div class="suggestion-item empty">Digite ao menos 2 letras.</div>';
                return;
            }
            if (explicita && lista.length > 0) {
                suggestionsBox.style.display = 'none';
                renderizarResultadosRoteiro(lista, query);
                avancarPara('panel1', 'resultsPanel');   // 1 → 2
            } else {
                renderizarSugestoes(lista, query);
            }
            return;
        } catch (err) {
            console.warn(`Busca falhou (tentativa ${tentativa}/${MAX_TENTATIVAS}):`, err);
            if (seq !== _buscaSeq) return;
            if (tentativa < MAX_TENTATIVAS) {
                mostrarCarregando(`Reconectando... (tentativa ${tentativa + 1}/${MAX_TENTATIVAS})`);
                await _esperar(700 * tentativa);
                if (seq !== _buscaSeq) return;
            }
        }
    }

    // Esgotou as tentativas: libera para buscar de novo e oferece botão
    _buscaEmAndamento = false;
    ultimoQuery = '';
    suggestionsBox.innerHTML = `
        <div class="suggestion-item empty">
            Não consegui buscar agora (conexão instável).<br>
            <button type="button" class="btn-usar-fonte" data-retry="1" style="margin-top:6px;">Tentar novamente</button>
        </div>`;
    suggestionsBox.style.display = 'block';
    suggestionsBox.querySelector('[data-retry]')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        buscarSugestoes(query, { explicita });
    });
}

// Passo 2: tabela com os logradouros do roteiro encontrados
function renderizarResultadosRoteiro(lista, query) {
    const list = document.getElementById('enderecosList');
    if (!list) return;
    list.innerHTML = '';

    const aviso = document.createElement('p');
    aviso.className = 'empty-state';
    aviso.textContent = `${lista.length} logradouro(s) do Roteiro encontrado(s). Escolha o correto:`;
    list.appendChild(aviso);

    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    const table = document.createElement('table');
    table.className = 'fontes-table';
    table.innerHTML = `
        <thead><tr><th>Base</th><th>Logradouro</th><th>Bairro</th><th>Cidade/UF</th><th>Ação</th></tr></thead>
        <tbody></tbody>`;
    const tbody = table.querySelector('tbody');

    lista.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="fonte-badge">Roteiro</span></td>
            <td>${escapeHtml([r.tipo, r.logradouro].filter(Boolean).join(' ') || '—')}${idsRoteiroHtml(r)}</td>
            <td>${escapeHtml(r.bairro || '—')}</td>
            <td>${escapeHtml([r.municipio, r.uf].filter(Boolean).join('/') || '—')}</td>
            <td><button class="btn-usar-fonte" type="button">Usar este</button></td>`;
        tr.querySelector('button').addEventListener('click', () => {
            searchInput.value = formatarTextoLogradouro(r);
            selecionarParaSurvey(r);
        });
        tbody.appendChild(tr);
    });
    wrapper.appendChild(table);
    list.appendChild(wrapper);
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
            <span class="suggestion-text"><strong>Roteiro:</strong> ${escapeHtml(texto)}${idsRoteiroHtml(r)}</span>`;
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
    if (query) buscarSugestoes(query, { explicita: true }); // ao concluir, avança para o passo 2
});

// ============================================
// IR PARA LOCAL (marcador arrastável)
// ============================================
function irParaLocal(lat, lng, nome, origem) {
    map.setView([lat, lng], 17);
    if (marcadorAtual) map.removeLayer(marcadorAtual);
    marcadorAtual = L.marker([lat, lng], { icon: houseIconPendente, draggable: false }).addTo(map);
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
    // Só o survey que está em modo edição pode ser reposicionado (cursor de "mãozinha" ao passar por cima)
    const emEdicao = surveyRef && _surveyEditandoIdx != null && surveysMemoria[_surveyEditandoIdx] === surveyRef;
    if (!emEdicao) return;
    marker.dragging.enable();
    marker.on('dragend', () => {
        const pos = marker.getLatLng();
        surveyRef.latitude = +pos.lat.toFixed(8);
        surveyRef.longitude = +pos.lng.toFixed(8);
        ibgeAtualizarOcultas();
        const setH = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setH('surveyLatitude', pos.lat.toFixed(8));
        setH('surveyLongitude', pos.lng.toFixed(8));
        const cd = document.getElementById('coordsDisplay');
        const od = document.getElementById('origemDisplay');
        if (cd) cd.textContent = `${pos.lat.toFixed(8)}, ${pos.lng.toFixed(8)}`;
        if (od) od.textContent = 'Ajustado manualmente (arrastado)';
    });
}

// ============================================
// CLIQUE DIREITO
// ============================================
map.on('contextmenu', (e) => {
    e.originalEvent.preventDefault();
    const { lat, lng } = e.latlng;
    if (marcadorAtual) map.removeLayer(marcadorAtual);
    marcadorAtual = L.marker([lat, lng], { icon: houseIconPendente }).addTo(map);
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
let _selecaoSeq = 0; // descarta consultas antigas se o usuário escolher outro logradouro
async function selecionarParaSurvey(r) {
    const seq = ++_selecaoSeq;
    avancarPara('panel1', 'resultsPanel');   // escolheu na busca → passo 2
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
    atualizarCamadaIbge();
    setH('surveyTipo', enderecoBaseSelecionado.tipo);
    setH('surveyLogradouro', enderecoBaseSelecionado.rua);
    setH('surveyBairro', enderecoBaseSelecionado.bairro);
    setH('surveyMunicipio', enderecoBaseSelecionado.cidade);
    setH('surveyUf', enderecoBaseSelecionado.estado);
    setH('surveyCep', enderecoBaseSelecionado.cep);

    atualizarInfoBase();

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
        const list = document.getElementById('enderecosList');
        if (list) list.innerHTML = `<p class="empty-state">✅ Coordenadas do Roteiro aplicadas: <strong>${escapeHtml(montarTextoLogradouro(enderecoBaseSelecionado))}</strong>. Indo para o Survey...</p>`;
        agendarAvancoParaSurvey(seq);          // 2 → 3
    } else {
        setH('surveyLatitude', '');
        setH('surveyLongitude', '');
        await resolverCoordenadasOSM(seq);
    }
}

// Mostra o logradouro escolhido no cabeçalho do passo 3
function atualizarInfoBase() {
    const infoBox = document.getElementById('enderecoBaseInfo');
    if (!infoBox || !enderecoBaseSelecionado) return;
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
            ${idsRoteiroHtml(enderecoBaseSelecionado)}
        </div>
    `;
}

// Quando o passo 2 não exige escolha, dá um instante para ver o local no mapa e segue para o 3
function agendarAvancoParaSurvey(seq) {
    setTimeout(() => {
        if (seq === _selecaoSeq) avancarPara('resultsPanel', 'formPanel');
    }, 1200);
}

function aplicarCoordenadaPadrao(seq) {
    const setH = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    const lat = COORD_DEFAULT_FALLBACK.lat;
    const lng = COORD_DEFAULT_FALLBACK.lng;
    setH('surveyLatitude', lat.toFixed(8));
    setH('surveyLongitude', lng.toFixed(8));
    enderecoBaseSelecionado.lat = lat;
    enderecoBaseSelecionado.lng = lng;
    irParaLocal(lat, lng, montarTextoLogradouro(enderecoBaseSelecionado), 'Roteiro (coord. padrão)');
    agendarAvancoParaSurvey(seq);
}

// Consulta o OSM (com retentativas internas). Em falha de conexão NÃO aplica coordenada padrão:
// mostra o erro com botão para tentar de novo.
async function resolverCoordenadasOSM(seq) {
    const list = document.getElementById('enderecosList');
    if (list) list.innerHTML = '<p class="empty-state"><span class="loading"></span> Consultando o OpenStreetMap...</p>';
    showToast('Buscando no OpenStreetMap', 'Consultando o logradouro...', 'info', 3000);

    let opcoes;
    try {
        opcoes = await buscarOpcoesOSM(enderecoBaseSelecionado);
    } catch (err) {
        console.warn('[OSM] falha de conexão:', err);
        if (seq !== _selecaoSeq) return;
        if (list) {
            list.innerHTML = `
                <p class="empty-state">Não consegui consultar o OpenStreetMap agora (conexão instável).</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
                    <button type="button" class="btn-usar-fonte" id="osmRetryBtn">Tentar novamente</button>
                    <button type="button" class="btn-usar-fonte" id="osmPadraoBtn">Usar coordenada padrão</button>
                </div>`;
            document.getElementById('osmRetryBtn').addEventListener('click', () => resolverCoordenadasOSM(seq));
            document.getElementById('osmPadraoBtn').addEventListener('click', () => {
                aplicarCoordenadaPadrao(seq);
                if (list) list.innerHTML = '<p class="empty-state">Coordenada padrão aplicada. Ajuste no mapa (botão direito) se precisar.</p>';
            });
        }
        return;
    }
    if (seq !== _selecaoSeq) return;   // o usuário já escolheu outro logradouro

    if (opcoes && opcoes.length > 0) {
        renderizarOpcoesOSM(opcoes, enderecoBaseSelecionado);
        showToast('Encontramos opções no OSM', 'Clique em "Usar esta" para marcar no mapa.', 'success', 3500);
    } else {
        aplicarCoordenadaPadrao(seq);
        if (list) list.innerHTML = '<p class="empty-state">Logradouro não encontrado no OpenStreetMap. Coordenada padrão aplicada.</p>';
        showToast(
            'Coordenada padrão aplicada',
            'O logradouro não foi encontrado no OpenStreetMap. Ajuste manualmente com o botão direito no mapa se precisar.',
            'warning',
            6000
        );
    }
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
const _ABREV_OSM = {
    'N': 'Nossa', 'NS': 'Nossa Senhora', 'NSRA': 'Nossa Senhora', 'SRA': 'Senhora', 'SRA.': 'Senhora',
    'SR': 'Senhor', 'STA': 'Santa', 'STO': 'Santo', 'S': 'São', 'SAO': 'São',
    'DR': 'Doutor', 'DRA': 'Doutora', 'PROF': 'Professor', 'PROFA': 'Professora',
    'CEL': 'Coronel', 'CAP': 'Capitão', 'TEN': 'Tenente', 'SGT': 'Sargento', 'GEN': 'General',
    'MAL': 'Marechal', 'ALM': 'Almirante', 'PRES': 'Presidente', 'GOV': 'Governador',
    'DEP': 'Deputado', 'VER': 'Vereador', 'ENG': 'Engenheiro', 'PE': 'Padre', 'PDE': 'Padre',
    'DOM': 'Dom', 'FREI': 'Frei', 'CONS': 'Conselheiro', 'COM': 'Comendador', 'MON': 'Monsenhor', 'MONS': 'Monsenhor'
};

function _semAcento(t) {
    return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function expandirAbreviacoesRua(rua) {
    const toks = String(rua || '').replace(/\./g, ' ').split(/\s+/).filter(Boolean);
    const out = toks.map((t, i) => {
        const k = _semAcento(t).toUpperCase();
        // "S" isolado só vira "São" quando não é a última palavra (evita "Rua S")
        if (k === 'S' && i === toks.length - 1) return t;
        return _ABREV_OSM[k] || t;
    });
    return out.join(' ');
}

let _nominatimUltimaChamada = 0;
// Retorna a lista (possivelmente vazia). Lança erro se a conexão falhar após as retentativas.
async function _nominatim(query) {
    if (!query) return [];
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=8&accept-language=pt-BR&countrycodes=br`;
    let ultimoErro = null;
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
        // o Nominatim pede no máximo ~1 requisição por segundo (acima disso responde 429)
        const espera = _nominatimUltimaChamada + 1100 - Date.now();
        if (espera > 0) await _esperar(espera);
        _nominatimUltimaChamada = Date.now();
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 10000);
        try {
            const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: ctrl.signal });
            if (res.status === 429 || res.status >= 500) throw new Error('OSM HTTP ' + res.status);
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
            ultimoErro = err;
            console.warn(`[OSM] tentativa ${tentativa}/3 falhou:`, err);
            if (tentativa < 3) await _esperar(1500 * tentativa);
        } finally {
            clearTimeout(timer);
        }
    }
    throw ultimoErro || new Error('Falha ao consultar o OSM');
}

async function buscarOpcoesOSM(end) {
    const ruaOrig = (end.rua || '').trim();
    const ruaExp = expandirAbreviacoesRua(ruaOrig);
    const tipo = (end.tipo || '').trim();
    const cidadeUf = [end.cidade, end.estado].filter(Boolean);

    // Tentativas em ordem; usa a primeira que traga uma via compatível com o nome
    const tentativas = [
        [ruaOrig, end.bairro, ...cidadeUf],                                   // comportamento original
        [(tipo + ' ' + ruaExp).trim(), end.bairro, ...cidadeUf],              // abreviações expandidas
        [ruaExp, ...cidadeUf],                                                // sem bairro
        [(tipo + ' ' + ruaExp).trim(), ...cidadeUf]
    ].map(p => p.filter(Boolean).join(', '))
     .filter((q, i, arr) => q && arr.indexOf(q) === i);

    if (!tentativas.length) return [];

    const stop = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS', 'E']);
    const tokens = _semAcento(ruaExp).toUpperCase().split(/\s+/).filter(t => t && !stop.has(t));
    const compativel = (o) => {
        const road = _semAcento(o.rua).toUpperCase();
        return road && tokens.every(t => road.includes(t));
    };

    let primeiraNaoVazia = null;
    let houveErro = false;
    for (const q of tentativas) {
        let r;
        try { r = await _nominatim(q); }
        catch (e) { houveErro = true; break; }   // conexão com problema: não adianta insistir nas outras variações
        if (r.length && !primeiraNaoVazia) primeiraNaoVazia = r;
        if (r.some(compativel)) {
            // coloca as vias compatíveis primeiro
            return [...r.filter(compativel), ...r.filter(o => !compativel(o))];
        }
    }
    if (primeiraNaoVazia) return primeiraNaoVazia;
    if (houveErro) throw new Error('Não foi possível consultar o OpenStreetMap');
    return [];
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
            <td>${escapeHtml(o.rua || '—')}${idsRoteiroHtml(end)}</td>
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
            avancarPara('resultsPanel', 'formPanel');   // 2 → 3
        });
    });
}

// ============================================
// ZONA — AUTOCOMPLETE (sugere zonas já usadas) + GRAVAÇÃO NO BANCO
// ============================================
let _zonaBuscaTimer = null;

async function buscarZonasSugeridas(prefixo) {
    if (!window.supabaseClient || !prefixo) return;
    try {
        const { data, error } = await supabaseClient
            .from('zonas')
            .select('codigo')
            .ilike('codigo', prefixo + '%')
            .order('codigo', { ascending: true })
            .limit(10);

        if (error) { console.error('[ZONA] erro ao buscar sugestões:', error); return; }

        const datalist = document.getElementById('zonaDatalist');
        if (!datalist) return;
        datalist.innerHTML = '';
        (data || []).forEach(row => {
            const opt = document.createElement('option');
            opt.value = row.codigo;
            datalist.appendChild(opt);
        });
    } catch (err) {
        console.error('[ZONA] erro inesperado ao buscar sugestões:', err);
    }
}

async function salvarZonaNoBanco(codigo) {
    if (!window.supabaseClient || !codigo) return;
    try {
        const { error } = await supabaseClient
            .from('zonas')
            .upsert({ codigo: codigo }, { onConflict: 'codigo', ignoreDuplicates: true });
        if (error) console.error('[ZONA] erro ao salvar no banco:', error);
    } catch (err) {
        console.error('[ZONA] erro inesperado ao salvar no banco:', err);
    }
}

document.getElementById('zonaInput')?.addEventListener('input', (e) => {
    const valor = e.target.value.trim().toUpperCase();
    clearTimeout(_zonaBuscaTimer);
    if (valor.length < 2) return;
    _zonaBuscaTimer = setTimeout(() => buscarZonasSugeridas(valor), 250);
});

// ============================================
// EDITAR COORDENADAS MANUALMENTE (botão OK)
// ============================================
document.getElementById('coordsOkBtn').addEventListener('click', () => {
    const num = (id) => parseFloat((document.getElementById(id)?.value || '').trim().replace(',', '.'));
    const lat = num('surveyLatitude');
    const lng = num('surveyLongitude');
    if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        showToast('Coordenadas inválidas', 'Informe latitude e longitude válidas (ex.: -25.66 e -49.30).', 'warning', 4000);
        return;
    }
    document.getElementById('surveyLatitude').value = lat.toFixed(8);
    document.getElementById('surveyLongitude').value = lng.toFixed(8);

    if (marcadorAtual) {
        marcadorAtual.setLatLng([lat, lng]);
    } else {
        marcadorAtual = L.marker([lat, lng], { icon: houseIconPendente }).addTo(map);
    }
    marcadorAtual.bindPopup(`Ponto editado<br>${lat.toFixed(8)}, ${lng.toFixed(8)}`).openPopup();
    map.setView([lat, lng], Math.max(map.getZoom(), 19));
    document.getElementById('coordsDisplay').textContent = `${lat.toFixed(8)}, ${lng.toFixed(8)}`;
    document.getElementById('origemDisplay').textContent = 'Editado manualmente';
});

// ============================================
// ADICIONAR AO SURVEY / SALVAR EDIÇÃO
// ============================================
document.getElementById('addBtn').addEventListener('click', async () => {
    // Em edição o survey já carrega o próprio logradouro: não exige escolher o roteiro de novo
    const sEdicao = (_surveyEditandoIdx != null && surveysMemoria[_surveyEditandoIdx]) ? surveysMemoria[_surveyEditandoIdx] : null;
    if (sEdicao && !enderecoBaseSelecionado) enderecoBaseSelecionado = { ...(sEdicao.logradouro || {}) };
    if (!sEdicao && (!enderecoBaseSelecionado || !enderecoBaseSelecionado._registro_id)) {
        showToast('Sem logradouro do roteiro', 'Selecione um logradouro na busca primeiro.', 'warning', 6000);
        return;
    }

    const numero = document.getElementById('numeroInput').value.trim();
    if (!numero) { showToast('Número obrigatório', 'Informe o Nº da fachada.', 'warning'); return; }

    const pisos = (document.getElementById('pisosInput')?.value || '').trim();
    const zona = (document.getElementById('zonaInput')?.value || '').trim().toUpperCase();
    // Zona é obrigatória ao cadastrar. Ao editar, só exige se o survey já tinha zona
    // (surveys criados pela IA/IBGE nascem sem zona e antes não conseguiam ser salvos na edição).
    const zonaObrigatoria = !sEdicao || !!(sEdicao.zona && String(sEdicao.zona).trim());
    if (!zona && zonaObrigatoria) {
        showToast('Zona obrigatória', 'Preencha o campo Zona para cadastrar o survey.', 'warning', 4000);
        document.getElementById('zonaInput')?.focus();
        return;
    }
    if (zona) salvarZonaNoBanco(zona); // grava/atualiza no histórico de zonas
    const obs = (document.getElementById('obsInput')?.value || '').trim();
    const imovel = (document.getElementById('imovelInput')?.value || '').trim();
    const tipoImovel = (document.getElementById('tipoImovelInput')?.value || '').trim();

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

    // ===== imóvel com várias UCs: precisa de UCs e das fotos do exterior e da fachada =====
    const multi = multiUcSnapshot();
    if (_multiUc.ativo) {
        if (!multi) { showToast('Configure as UCs', 'Clique em "Configurar UCs" e adicione ao menos um grupo de UCs.', 'warning', 5000); multiUcAbrirModal(); return; }
        if (!multi.fotos.fachada) { showToast('Falta a foto da fachada', 'Acrescente uma foto para a Fachada da Edificação (ou use "Foto proibida").', 'warning', 6000); multiUcAbrirModal(); return; }
        if (!multi.fotos.exterior) { showToast('Falta a foto do exterior', 'Acrescente uma foto para o Exterior da Edificação (ou use "Foto proibida").', 'warning', 6000); multiUcAbrirModal(); return; }
    }

    // ===== CASO 1: SALVAR EDIÇÃO =====
    if (sEdicao) {
        const s = sEdicao;
        s.logradouro = { ...enderecoBaseSelecionado };
        s.numero = numero;
        s.pisos = pisos || null;
        s.zona = zona || null;
        s.observacoes = obs || null;
        s.imovel = imovel || null;
        s.tipoImovel = tipoImovel || null;
        s.complementos = complementos;
        s.latitude = lat;
        s.longitude = lng;
        s._ia = false;
        if (multi) s.multiUc = multi; else delete s.multiUc;

        // Sai do modo edição ANTES de redesenhar a tela: mesmo que algo falhe depois, o modo não fica preso
        try {
            ['numeroInput','pisosInput','zonaInput','obsInput','imovelInput','tipoImovelInput','comp1Tipo','comp1Valor','comp2Tipo','comp2Valor','comp3Tipo','comp3Valor'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            cancelarEdicaoSurvey(true);
            fixarMarcadorPendente();
            renderizarSurveys();
            irParaListaAposSalvar();
            showToast('Edição salva', 'Survey atualizado.', 'success', 2500);
        } catch (err) {
            console.error('[Edição] erro ao atualizar a tela após salvar:', err);
            _surveyEditandoIdx = null;
            showToast('Edição salva', 'O survey foi atualizado, mas a tela não recarregou por completo. Atualize a lista se precisar.', 'warning', 6000);
        }
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
        zona: zona || null,
        observacoes: obs || null,
        imovel: imovel || null,
        tipoImovel: tipoImovel || null,
        complementos: complementos,
        latitude: lat,
        longitude: lng,
        created_at: new Date().toISOString(),
        ...(multi ? { multiUc: multi } : {})
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
    limpar('zonaInput', 'zonaRecorrente');
    limpar('obsInput', 'obsRecorrente');
    limpar('imovelInput', 'imovelRecorrente');
    limpar('tipoImovelInput', 'imovelRecorrente');
    limpar('comp1Tipo', 'comp1Recorrente');
    limpar('comp1Valor', 'comp1Recorrente');
    limpar('comp2Tipo', 'comp2Recorrente');
    limpar('comp2Valor', 'comp2Recorrente');
    limpar('comp3Tipo', 'comp3Recorrente');
    limpar('comp3Valor', 'comp3Recorrente');

    multiUcAposSalvar();
    fixarMarcadorPendente(); // casinha vermelha vira azul fixa

    renderizarSurveys();
    irParaListaAposSalvar();

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
    setH('zonaInput', s.zona || '');
    setH('obsInput', s.observacoes || '');
    setH('imovelInput', s.imovel || '');
    setH('tipoImovelInput', s.tipoImovel || '');

    const comps = Array.isArray(s.complementos) ? s.complementos : [];
    setH('comp1Tipo', comps[0] ? comps[0].tipo : '');
    setH('comp1Valor', comps[0] ? comps[0].valor : '');
    setH('comp2Tipo', comps[1] ? comps[1].tipo : '');
    setH('comp2Valor', comps[1] ? comps[1].valor : '');
    setH('comp3Tipo', comps[2] ? comps[2].tipo : '');
    setH('comp3Valor', comps[2] ? comps[2].valor : '');
    multiUcCarregar(s.multiUc || null);

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
                ${idsRoteiroHtml(l)}
            </div>
        `;
    }

    enderecoBaseSelecionado = { ...l, _registro_id: l._registro_id };
    atualizarCamadaIbge();

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
    // Modo edição COMPLETO: casinha vermelha piscando, liberada para arrastar, e formulário todo preenchido
    if (marcadorAtual) { map.removeLayer(marcadorAtual); marcadorAtual = null; }   // tira o ponto pendente/duplicado
    const cd = document.getElementById('coordsDisplay');
    const od = document.getElementById('origemDisplay');
    if (cd && s.latitude != null && s.longitude != null) cd.textContent = `${Number(s.latitude).toFixed(8)}, ${Number(s.longitude).toFixed(8)}`;
    if (od) od.textContent = 'Survey em edição (arraste a casinha vermelha para reposicionar)';
    renderizarMarcadoresSurveys();
    const mEd = marcadoresSurveys.find(m => m._sid === s._id);
    if (mEd) map.setView(mEd.getLatLng(), Math.max(map.getZoom(), 19));
    document.getElementById('numeroInput')?.focus({ preventScroll: true });
    showToast('Modo edição', 'Ajuste fachada, complementos e demais dados, ou arraste a casinha vermelha no mapa. Depois clique em "Salvar edição".', 'info', 5000);
}

function cancelarEdicaoSurvey(manterRoteiro) {
    _surveyEditandoIdx = null;
    multiUcReset();
    renderizarMarcadoresSurveys();   // casinha volta à cor normal e deixa de ser arrastável
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

    if (manterRoteiro) {
        // após salvar edição, mantém o roteiro em uso, mas volta o card ao visual normal (sem o laranja de "Editando")
        atualizarInfoBase();
        return;
    }

    const infoBox = document.getElementById('enderecoBaseInfo');
    if (infoBox) {
        infoBox.innerHTML = '<p class="empty-state-sm">Selecione uma fonte em "Endereços Encontrados".</p>';
    }
    enderecoBaseSelecionado = null;
    atualizarCamadaIbge();
}

// ============================================
// RENDERIZAR SURVEYS SALVOS
// ============================================
// ============================================
// SURVEYS SALVOS — TROCAR ROTEIRO DOS LOGRADOUROS SELECIONADOS
// ============================================
function logradouroDeRegistro(r) {
    return {
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
}

async function buscarRoteirosParaTroca(query) {
    const norm = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    const cep = query.replace(/\D/g, '');
    if (cep.length === 8) {
        const { data, error } = await supabaseClient.from('logradouros').select('*')
            .eq('origem', 'Roteiro XML').ilike('cep', `%${cep}%`).limit(30);
        if (error) throw error;
        return data || [];
    }
    const palavras = norm(query).split(/\s+/).filter(p => p.length >= 2);
    if (!palavras.length) return [];
    const chave = [...palavras].sort((a, b) => b.length - a.length)[0];
    const { data, error } = await supabaseClient.from('logradouros').select('*')
        .eq('origem', 'Roteiro XML')
        .or(`logradouro.ilike.%${chave}%,bairro.ilike.%${chave}%,municipio.ilike.%${chave}%,cep.ilike.%${chave}%`)
        .limit(200);
    if (error) throw error;
    const blob = (r) => norm([r.tipo, r.logradouro, r.bairro, r.municipio, r.uf, r.cep ? String(r.cep).replace(/\D/g, '') : ''].filter(Boolean).join(' '));
    const ok = (data || []).filter(r => { const b = blob(r); return palavras.every(p => b.includes(p)); });
    return ok.slice(0, 50);
}

function abrirTrocaRoteiro() {
    if (!gruposSelecionados.size) return;
    const nSurveys = surveysMemoria.filter(sv => gruposSelecionados.has(chaveGrupo(sv.logradouro))).length;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = `
        <div style="background:var(--bg-card,#fff);color:var(--text-primary);border-radius:12px;padding:16px;width:100%;max-width:560px;max-height:85vh;display:flex;flex-direction:column;gap:10px;box-shadow:var(--shadow-lg);">
            <strong>Alterar roteiro de ${gruposSelecionados.size} logradouro(s) (${nSurveys} survey(s))</strong>
            <small style="color:var(--text-tertiary);">Busque o logradouro/CEP do roteiro correto e clique nele para aplicar a todos os selecionados.</small>
            <input type="text" id="trocaBusca" placeholder="Nome da rua, bairro ou CEP" autocomplete="off" style="width:100%;padding:8px 10px;">
            <div id="trocaLista" style="overflow:auto;flex:1;min-height:120px;border:1px solid var(--border-color,#ddd);border-radius:8px;"></div>
            <div style="text-align:right;"><button type="button" id="trocaFechar" class="btn-editar" style="padding:6px 12px;">Cancelar</button></div>
        </div>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('#trocaBusca');
    const lista = overlay.querySelector('#trocaLista');
    input.focus();
    const fechar = () => overlay.remove();
    overlay.querySelector('#trocaFechar').addEventListener('click', fechar);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });

    let timer = null;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
            const q = input.value.trim();
            if (q.length < 2) { lista.innerHTML = ''; return; }
            lista.innerHTML = '<div style="padding:10px;">Buscando...</div>';
            try {
                const rs = await buscarRoteirosParaTroca(q);
                if (!rs.length) { lista.innerHTML = '<div style="padding:10px;">Nada encontrado.</div>'; return; }
                lista.innerHTML = '';
                rs.forEach(r => {
                    const it = document.createElement('div');
                    it.style.cssText = 'padding:8px 10px;cursor:pointer;border-bottom:1px solid var(--border-light,#eee);';
                    it.innerHTML = `<strong>${escapeHtml([normalizarTipo(r.tipo), r.logradouro].filter(Boolean).join(' '))}</strong>
                        <div style="font-size:.8rem;color:var(--text-tertiary);">${escapeHtml([r.bairro, [r.municipio, r.uf].filter(Boolean).join('/')].filter(Boolean).join(', '))} · CEP ${escapeHtml(formatarCEP(r.cep || '') || '—')}</div>
                        ${idsRoteiroHtml(r)}`;
                    it.addEventListener('mouseenter', () => it.style.background = 'var(--bg-secondary)');
                    it.addEventListener('mouseleave', () => it.style.background = '');
                    it.addEventListener('click', () => {
                        const rotulo = `${[normalizarTipo(r.tipo), r.logradouro].filter(Boolean).join(' ')} — CEP ${formatarCEP(r.cep || '') || '—'}`;
                        if (!confirm(`Aplicar "${rotulo}" a ${nSurveys} survey(s) de ${gruposSelecionados.size} logradouro(s)?`)) return;
                        const novo = logradouroDeRegistro(r);
                        let alterados = 0;
                        surveysMemoria.forEach(sv => {
                            if (!gruposSelecionados.has(chaveGrupo(sv.logradouro))) return;
                            const antigo = sv.logradouro || {};
                            // preserva a posição do survey quando ela vinha do logradouro antigo
                            if (sv.latitude == null && antigo.lat != null) sv.latitude = antigo.lat;
                            if (sv.longitude == null && antigo.lng != null) sv.longitude = antigo.lng;
                            sv.logradouro = { ...novo };
                            alterados++;
                        });
                        gruposSelecionados.clear();
                        gruposAbertos.clear();
                        fechar();
                        renderizarSurveys();
                        showToast('Roteiro alterado', `${alterados} survey(s) atualizado(s).`, 'success', 3500);
                    });
                    lista.appendChild(it);
                });
            } catch (err) {
                lista.innerHTML = `<div style="padding:10px;">Erro ao buscar: ${escapeHtml(err.message || String(err))}</div>`;
            }
        }, 350);
    });
}

document.getElementById('grpAlterarRoteiro')?.addEventListener('click', abrirTrocaRoteiro);
document.getElementById('grpExpandir')?.addEventListener('click', () => {
    surveysMemoria.forEach(sv => gruposAbertos.add(chaveGrupo(sv.logradouro)));
    renderizarSurveys();
});
document.getElementById('grpRecolher')?.addEventListener('click', () => {
    gruposAbertos.clear();
    renderizarSurveys();
});

// ============================================
// SURVEYS SALVOS — AGRUPADOS POR LOGRADOURO
// ============================================
const gruposAbertos = new Set();
const gruposSelecionados = new Set();

function chaveGrupo(l) {
    l = l || {};
    return [l.tipo, l.rua, l.bairro, l.cidade, l.estado, l.cep, l.id_roteiro].map(v => String(v || '').toUpperCase()).join('|');
}

function atualizarBarraGrupos() {
    const btn = document.getElementById('grpAlterarRoteiro');
    if (!btn) return;
    btn.textContent = `Alterar roteiro dos selecionados (${gruposSelecionados.size})`;
    btn.disabled = gruposSelecionados.size === 0;
}

function renderizarSurveys() {
    const panel = document.getElementById('listPanel');
    const tbody = document.querySelector('#surveysTable tbody');
    if (!panel || !tbody) return;

    tbody.innerHTML = '';

    const exportHeader = document.getElementById('exportHeaderBtn');
    if (exportHeader) exportHeader.style.display = surveysMemoria.length > 0 ? '' : 'none';

    if (surveysMemoria.length === 0) {
        panel.style.display = 'none';
        ibgeAtualizarOcultas();   // lista vazia: as casinhas do IBGE voltam a aparecer
        return;
    }

    panel.style.display = 'block';

    const grupos = new Map();
    surveysMemoria.forEach((sv, i) => {
        const k = chaveGrupo(sv.logradouro);
        if (!grupos.has(k)) grupos.set(k, []);
        grupos.get(k).push(i);
    });
    [...gruposSelecionados].forEach(k => { if (!grupos.has(k)) gruposSelecionados.delete(k); });
    [...gruposAbertos].forEach(k => { if (!grupos.has(k)) gruposAbertos.delete(k); });

    grupos.forEach((idxs, key) => {
        const l0 = surveysMemoria[idxs[0]].logradouro || {};
        const aberto = gruposAbertos.has(key);
        const hr = document.createElement('tr');
        hr.className = 'grupo-row';
        hr.dataset.grupo = key;
        hr.style.cssText = 'background:var(--bg-secondary);cursor:pointer;font-weight:600;';
        hr.innerHTML = `
            <td colspan="7">
                <input type="checkbox" class="grp-chk" ${gruposSelecionados.has(key) ? 'checked' : ''} style="margin-right:8px;">
                <span class="grp-seta">${aberto ? '▼' : '▶'}</span>
                ${escapeHtml([l0.tipo, l0.rua].filter(Boolean).join(' ') || '—')}
                <span style="font-weight:400;color:var(--text-tertiary);">
                    — ${escapeHtml([l0.bairro, [l0.cidade, l0.estado].filter(Boolean).join('/')].filter(Boolean).join(', '))}
                    · CEP ${escapeHtml(formatarCEP(l0.cep || '') || '—')} · ${idxs.length} survey(s)
                </span>
            </td>`;
        tbody.appendChild(hr);

    idxs.forEach((idx) => {
        const s = surveysMemoria[idx];
        const l = s.logradouro || {};
        const comps = Array.isArray(s.complementos) ? s.complementos : [];
        const compTexto = comps.length
            ? comps.map(c => `${c.tipo || '?'}: ${c.valor || ''}`).join(' | ')
            : '—';
        const tr = document.createElement('tr');
        if (s._ia) tr.className = 'linha-ia';
        tr.innerHTML = `
            <td title="${escapeHtml([l.tipo, l.rua].filter(Boolean).join(' '))}">${escapeHtml([l.tipo, l.rua].filter(Boolean).join(' ') || '—')}${s._ia ? '<span class="ia-tag">🤖 IA</span>' : ''}${s.multiUc ? `<span class="uc-tag">${s.multiUc.ucs.length} UCs</span>` : ''}</td>
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
        tr.classList.add('grupo-filho');
        tr.dataset.grupo = key;
        if (!aberto) tr.style.display = 'none';
        tbody.appendChild(tr);
    });
    });

    tbody.querySelectorAll('tr.grupo-row').forEach(hr => {
        const key = hr.dataset.grupo;
        const chk = hr.querySelector('.grp-chk');
        chk.addEventListener('click', (e) => e.stopPropagation());
        chk.addEventListener('change', () => {
            if (chk.checked) gruposSelecionados.add(key); else gruposSelecionados.delete(key);
            atualizarBarraGrupos();
        });
        hr.addEventListener('click', () => {
            const abrir = !gruposAbertos.has(key);
            if (abrir) gruposAbertos.add(key); else gruposAbertos.delete(key);
            hr.querySelector('.grp-seta').textContent = abrir ? '▼' : '▶';
            tbody.querySelectorAll('tr.grupo-filho').forEach(tr => {
                if (tr.dataset.grupo === key) tr.style.display = abrir ? '' : 'none';
            });
        });
    });
    atualizarBarraGrupos();

    tbody.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => abrirEdicaoSurvey(parseInt(btn.dataset.idx, 10)));
    });

    // dois cliques na linha do survey = entrar em modo de edição
    tbody.querySelectorAll('tr.grupo-filho').forEach(tr => {
        tr.title = 'Dois cliques para editar';
        tr.addEventListener('dblclick', (e) => {
            if (e.target.closest('button, input, a, select, textarea')) return;
            const b = tr.querySelector('.btn-editar');
            if (!b) return;
            if (window.getSelection) window.getSelection().removeAllRanges();
            abrirEdicaoSurvey(parseInt(b.dataset.idx, 10));
        });
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
            marcadorAtual = L.marker([lat, lng], { icon: iconeComNumero(iconeSurvey(s), s), draggable: false }).addTo(map);
            marcadorAtual.bindPopup(popupSurveyHtml(s)).openPopup();
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

// Texto exibido embaixo da casinha: "75" ou "SN - (Quadra 1, Lote 1)"
function textoRotuloSurvey(s) {
    const num = (s.numero == null ? '' : String(s.numero)).trim();
    const comps = (Array.isArray(s.complementos) ? s.complementos : [])
        .filter(c => c && (c.tipo || c.valor))
        .map(c => [c.tipo, c.valor].filter(Boolean).join(' ').trim())
        .filter(Boolean);
    const partes = [];
    if (num) partes.push(num);
    if (comps.length) partes.push(`(${comps.join(', ')})`);
    return partes.join(' - ');
}
function popupSurveyHtml(s) {
    const nome = s.logradouro ? s.logradouro.rua : '';
    const rotulo = textoRotuloSurvey(s);
    const ucs = s.multiUc ? `<br>${s.multiUc.ucs.length} UC(s) em ${new Set(s.multiUc.ucs.map(u => u.pisoLogico)).size} piso(s)` : '';
    return `<strong>${escapeHtml(nome)}${rotulo ? ', ' + escapeHtml(rotulo) : ''}</strong>${ucs}`;
}

// O Nº da fachada e os complementos aparecem SÓ na legenda (popup) ao clicar na casinha.
// Não existe mais rótulo fixo embaixo do survey.
const _rotulosAbertos = new Set();   // mantido por compatibilidade
function configurarRotuloSurvey(m, s) {
    // Garante que nenhum rótulo "no pé" fique preso ao marcador
    if (m.getTooltip && m.getTooltip()) m.unbindTooltip();
    _rotulosAbertos.delete(s._id);
}

function renderizarMarcadoresSurveys() {
    marcadoresSurveys.forEach(m => map.removeLayer(m));
    marcadoresSurveys = [];

    surveysMemoria.forEach((s, idx) => {
        const lat = s.latitude != null ? Number(s.latitude) : (s.logradouro && s.logradouro.lat);
        const lng = s.longitude != null ? Number(s.longitude) : (s.logradouro && s.logradouro.lng);
        if (lat == null || lng == null) return;
        const editando = (_surveyEditandoIdx === idx);
        const selEsp = !!(_espSel && _espSel.sel.has(s._id));   // amarelo = selecionado na Espacialização
        const m = L.marker([lat, lng], {
            icon: iconeComNumero(editando ? iconeEdicao() : (selEsp ? iconeCasaCor('#facc15') : iconeSurvey(s)), s),   // vermelho piscando = em edição; número da fachada sempre visível
            draggable: false,
            zIndexOffset: editando ? 2000 : 0
        }).addTo(map);
        m._sid = s._id;
        m.bindPopup(popupSurveyHtml(s));
        configurarRotuloSurvey(m, s);
        tornarMarcadorArrastavel(m, s);
        // Espacialização: o clique seleciona/desmarca (ou marca um ponto da linha)
        m.on('click', () => {
            if (!_espSel) return;
            m.closePopup();
            if (_espSel.modoLinha) _espSel.onMapClick({ latlng: m.getLatLng() });
            else _espSel.alternar(s);
        });
        // dois cliques na casinha = entrar em modo de edição
        m.on('dblclick', (ev) => {
            if (ev.originalEvent) L.DomEvent.stop(ev.originalEvent);
            if (_espSel) return;   // durante a Espacialização os cliques são de seleção
            m.closePopup();
            abrirEdicaoSurvey(idx);
        });
        marcadoresSurveys.push(m);
    });
    ibgeAtualizarOcultas();   // cadastrou, removeu ou limpou: atualiza quais casinhas do IBGE aparecem
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
    _iaJaDisparou = false; _iaMeta = 0; _iaJanela = 5; _iaCorte = 0; limparSetorIA();
    showToast('Lista limpa', 'Todos os surveys foram removidos.', 'success', 2500);
    renderizarSurveys();
});

// ============================================
// IMÓVEIS COM VÁRIAS UCs (prédios, condomínios, galerias...)
// Baseado no CE-Mobile 7.9.2 ("Edifícios ou Condomínios"):
//  • tipo="E" (Completa, sem infraestrutura interna) ou tipo="P" (Parcial): as UCs vão direto no <ucs>,
//    distribuídas por piso (piso lógico/real) com tipo de unidade + argumento (ex.: Apartamento 101)
//  • o app exige foto do EXTERIOR e da FACHADA (até 100 kB, 640 px de largura); o interior é opcional
// ============================================
const UC_DESTINACOES = [['RESIDENCIA', 'Residência'], ['ADMINISTRACAO', 'Administração'], ['COMERCIOEXTERNO', 'Comércio Externo'], ['COMERCIOINTERNO', 'Comércio Interno'], ['NAODISPONIVEL', 'Não Disponível']];
const UC_OCUPACOES = [['EDIFICACAOCOMPLETA', 'Edificação completa'], ['EDIFICACAOEMCONSTRUCAO', 'Edificação em construção'], ['LOTEVAZIO', 'Lote vazio']];
const UC_PISO_IDS = [7, 25, 47, 65, 74, 76, 77, 80, 104, 107];                 // Andar, Cobertura, Garagem, Mezanino, Pavimento, Piso, Plataforma, Porão, Subsolo, Térreo
const UC_COMPL_COMUNS_IDS = [9, 25, 37, 38, 59, 91, 96, 101, 114, 120, 121];        // tipos de unidade mais usados (Apartamento, Sala, Loja...)
const UC_COMPL_OUTROS_IDS = [3, 6, 8, 10, 13, 16, 17, 21, 22, 23, 31, 32, 34, 39, 42, 45, 46, 47, 50, 52, 57, 58, 64, 66, 67, 68, 69, 83, 86, 89, 92, 93, 97, 98, 100, 102, 113, 115, 116];
const UC_COMPL_SEMARG_IDS = [118, 119];        // Sem complemento / Não disponível (não têm argumento)
const UC_COMPL_ARG_OBRIG = new Set([9, 16, 17, 22, 34, 39, 45, 50, 58, 59, 66, 67, 69, 86, 96, 97, 98, 113]); // tipos em que o argumento é obrigatório
const UC_FOTO_NOMES = { exterior: 'fotoExterior.jpg', fachada: 'fotoFachada.jpg', interior: 'fotoInterior.jpg' };
// Imagem usada pela equipe quando o morador não autoriza a foto ("PROIBIDO FOTO")
const FOTO_PROIBIDA_B64 = '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';

const _ucNomeTipo = (id) => { const it = COMPLEMENTO_LISTA.find(([, i]) => Number(i) === Number(id)); return it ? it[0] : String(id); };
const _ucFotosVazias = () => ({ exterior: null, fachada: null, interior: null });
let _ucGidSeq = 0;
let _multiUc = { ativo: false, tipo: 'E', ocupacao: 'EDIFICACAOCOMPLETA', grupos: [], ucs: [], fotos: _ucFotosVazias() };

// Gera as UCs de um grupo (mesma lógica da tela "Distribuição" do app). Retorna { ucs, descricao } ou { erro }
function ucGerarGrupo(cfg) {
    const pad2 = (n) => String(n).padStart(2, '0');
    const li = parseInt(cfg.pisoLogicoInicial, 10);
    if (isNaN(li)) return { erro: 'Informe o piso lógico inicial.' };
    const vazioLf = cfg.pisoLogicoFinal === '' || cfg.pisoLogicoFinal == null;
    const lf = vazioLf ? li : parseInt(cfg.pisoLogicoFinal, 10);
    if (isNaN(lf) || lf < li) return { erro: 'O piso lógico final deve ser maior ou igual ao inicial.' };
    const nPisos = lf - li + 1;
    if (nPisos > 200) return { erro: 'Máximo de 200 pisos por grupo.' };

    const realTxt = String(cfg.pisoRealInicial == null ? '' : cfg.pisoRealInicial).trim();
    const realNum = /^-?\d+$/.test(realTxt) ? parseInt(realTxt, 10) : null;
    if (realTxt && realNum === null && nPisos > 1) return { erro: 'Piso real que não é número (ex.: T) só vale para um piso. Use número ou deixe em branco.' };
    const pisoReal = (k) => !realTxt ? String(li + k) : (realNum !== null ? String(realNum + k) : realTxt);

    const idCompl = Number(cfg.idTipoComplemento);
    const semArgTipo = UC_COMPL_SEMARG_IDS.includes(idCompl);
    const modo = semArgTipo ? 'semArg' : cfg.modo;
    if (modo === 'semArg' && UC_COMPL_ARG_OBRIG.has(idCompl)) return { erro: `"${_ucNomeTipo(idCompl)}" exige argumento (número ou texto).` };

    const base = (arg, k) => ({
        destinacao: cfg.destinacao,
        idTipoComplemento: idCompl, tipoComplemento: _ucNomeTipo(idCompl),
        complemento: arg,
        idTipoPiso: Number(cfg.idTipoPiso), tipoPiso: _ucNomeTipo(cfg.idTipoPiso),
        pisoLogico: String(li + k), pisoReal: pisoReal(k)
    });
    const ucs = [];
    let resumo = '';

    if (modo === 'faixa') {
        const uI = parseInt(cfg.ucInicial, 10), uF = parseInt(cfg.ucFinal, 10);
        if (isNaN(uI) || isNaN(uF)) return { erro: 'Informe a primeira e a última UC.' };
        if (uI < 100 || uF < 100 || uI > 9999 || uF > 9999) return { erro: 'Na faixa, a centena é o piso (ex.: 101 a 104). Para números menores, use "Quantidade por piso".' };
        const h1 = Math.floor(uI / 100), h2 = Math.floor(uF / 100);
        if (h2 - h1 !== nPisos - 1) return { erro: `A faixa vai da centena ${h1} à ${h2} (${h2 - h1 + 1} piso(s)), mas os pisos informados são ${nPisos}.` };
        const u1 = uI - h1 * 100, u2 = uF - h2 * 100;
        if (u2 < u1) return { erro: 'A última UC deve ser maior que a primeira.' };
        const passo = cfg.numeracao === 'continua' ? 1 : 2;
        if (cfg.numeracao === 'impares' && u1 % 2 !== 1) return { erro: 'Para números ímpares, a primeira UC deve ser ímpar (ex.: 101).' };
        if (cfg.numeracao === 'pares' && u1 % 2 !== 0) return { erro: 'Para números pares, a primeira UC deve ser par (ex.: 102).' };
        if ((u2 - u1) % passo !== 0) return { erro: 'A última UC não bate com a numeração escolhida (ímpar/par).' };
        for (let k = 0; k < nPisos; k++) for (let u = u1; u <= u2; u += passo) ucs.push(base(String(h1 + k) + pad2(u), k));
        resumo = `${uI} a ${uF}` + (cfg.numeracao === 'impares' ? ' (ímpares)' : cfg.numeracao === 'pares' ? ' (pares)' : '');
    } else if (modo === 'porPiso') {
        const n = parseInt(cfg.ucsPorPiso, 10);
        if (isNaN(n) || n < 1 || n > 99) return { erro: 'Informe de 1 a 99 UCs por piso.' };
        for (let k = 0; k < nPisos; k++) for (let j = 1; j <= n; j++) ucs.push(base(String(j), k));
        resumo = n === 1 ? '1 por piso' : `1 a ${n} por piso`;
    } else if (modo === 'texto') {
        const txt = String(cfg.texto || '').trim();
        if (!txt) return { erro: 'Digite o argumento (ex.: A).' };
        if (txt.length > 50) return { erro: 'O argumento aceita até 50 caracteres.' };
        for (let k = 0; k < nPisos; k++) ucs.push(base(txt, k));
        resumo = `"${txt}" em cada piso`;
    } else {
        for (let k = 0; k < nPisos; k++) ucs.push(base('', k));
        resumo = 'sem argumento';
    }
    if (ucs.length > 2000) return { erro: 'Máximo de 2000 UCs por grupo.' };

    const dest = (UC_DESTINACOES.find(([v]) => v === cfg.destinacao) || [, cfg.destinacao])[1];
    const pisosTxt = nPisos > 1 ? `${li}–${lf}` : String(li);
    return { ucs, descricao: `${_ucNomeTipo(idCompl)} ${resumo} • ${_ucNomeTipo(cfg.idTipoPiso)} ${pisosTxt} • ${dest}` };
}

// ---- fotos (iguais ao app: até 100 kB e 640 px de largura) ----
function _ucBlobDeBase64(b64, tipo) {
    const bin = atob(b64), arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: tipo });
}
async function _ucProcessarFoto(file) {
    const MAX = 100 * 1000;
    const img = await new Promise((ok, erro) => {
        const url = URL.createObjectURL(file);
        const im = new Image();
        im.onload = () => { URL.revokeObjectURL(url); ok(im); };
        im.onerror = () => { URL.revokeObjectURL(url); erro(new Error('Não consegui abrir essa imagem.')); };
        im.src = url;
    });
    let w = Math.min(640, img.naturalWidth), h = Math.round(img.naturalHeight * w / img.naturalWidth);
    for (let tent = 0; tent < 6; tent++) {
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        for (let q = 0.85; q >= 0.35; q -= 0.1) {
            const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', q));
            if (blob && blob.size <= MAX) return blob;
        }
        w = Math.round(w * 0.8); h = Math.round(h * 0.8);
    }
    throw new Error('A foto continua maior que 100 kB mesmo reduzida.');
}
function multiUcFotosParaZip(multi) {
    return ['exterior', 'fachada', 'interior']
        .filter(k => multi.fotos && multi.fotos[k])
        .map(k => ({ nome: UC_FOTO_NOMES[k], blob: multi.fotos[k] }));
}

// ---- estado do formulário ----
function multiUcSnapshot() {
    if (!_multiUc.ativo || !_multiUc.ucs.length) return null;
    const { fotos, ativo, ...resto } = _multiUc;
    const c = JSON.parse(JSON.stringify(resto));
    c.fotos = { ...fotos };
    return c;
}
function multiUcCarregar(m) {
    if (m) {
        _multiUc = {
            ativo: true, tipo: m.tipo || 'E', ocupacao: m.ocupacao || 'EDIFICACAOCOMPLETA',
            grupos: JSON.parse(JSON.stringify(m.grupos || [])), ucs: JSON.parse(JSON.stringify(m.ucs || [])),
            fotos: { ..._ucFotosVazias(), ...(m.fotos || {}) }
        };
        _ucGidSeq = Math.max(_ucGidSeq, ..._multiUc.grupos.map(g => g.gid || 0));
    } else multiUcReset();
    multiUcAtualizarResumo();
}
function multiUcReset() {
    _multiUc = { ativo: false, tipo: 'E', ocupacao: 'EDIFICACAOCOMPLETA', grupos: [], ucs: [], fotos: _ucFotosVazias() };
    multiUcAtualizarResumo();
}
// Depois de salvar um prédio: continua no modo "várias UCs" para o próximo.
// Com "Recorrência" marcada, mantém UCs, tipo de edificação e ocupação (ex.: condomínio de prédios iguais,
// em que só muda a fachada). As fotos são sempre zeradas: cada prédio tem as suas.
function multiUcAposSalvar() {
    const manter = !!document.getElementById('multiUcRecorrente')?.checked;
    if (!manter) { _multiUc.grupos = []; _multiUc.ucs = []; }
    _multiUc.fotos = _ucFotosVazias();
    multiUcAtualizarResumo();
}
function multiUcAtualizarResumo() {
    const t = document.getElementById('multiUcToggle');
    const b = document.getElementById('multiUcBtn');
    const r = document.getElementById('multiUcResumo');
    if (t) t.checked = _multiUc.ativo;
    if (b) b.style.display = _multiUc.ativo ? '' : 'none';
    const rw = document.getElementById('multiUcRecWrap');
    if (rw) rw.style.display = _multiUc.ativo ? '' : 'none';
    if (!r) return;
    if (!_multiUc.ativo) { r.textContent = ''; return; }
    const pisos = new Set(_multiUc.ucs.map(u => u.pisoLogico)).size;
    const fotos = (_multiUc.fotos.exterior ? 1 : 0) + (_multiUc.fotos.fachada ? 1 : 0);
    r.textContent = _multiUc.ucs.length
        ? `${_multiUc.ucs.length} UC(s) • ${pisos} piso(s) • fotos ${fotos}/2`
        : 'Nenhuma UC configurada';
    r.classList.toggle('multiuc-pendente', !_multiUc.ucs.length || fotos < 2);
}

// ---- janela de configuração ----
let _mucOverlay = null;
const _mucUrls = {};
function _mucOpcoes(sel, itens, vazio) {
    sel.innerHTML = (vazio ? `<option value="">${vazio}</option>` : '') + itens.map(([v, n]) => `<option value="${v}">${escapeHtml(n)}</option>`).join('');
}
function _mucGarantirModal() {
    if (_mucOverlay) return _mucOverlay;
    const ov = document.createElement('div');
    ov.className = 'multiuc-overlay';
    ov.innerHTML = `
    <div class="multiuc-modal" role="dialog" aria-modal="true" aria-label="Unidades de Cliente">
        <div class="multiuc-head"><strong>Imóvel com várias UCs</strong><button type="button" class="multiuc-x" id="mucFechar" aria-label="Fechar">×</button></div>
        <div class="multiuc-body">
            <div class="muc-grid2">
                <label>Tipo de edificação
                    <select id="mucTipo"><option value="E">Completa (sem infraestrutura interna)</option><option value="P">Parcial</option></select>
                </label>
                <label>Ocupação <select id="mucOcup"></select></label>
            </div>

            <div class="muc-card">
                <div class="muc-titulo">Adicionar grupo de UCs</div>
                <div class="muc-grid2">
                    <label>Destinação <select id="mucDest"></select></label>
                    <label>Tipo de unidade <select id="mucTipoUc"></select></label>
                </div>
                <div class="muc-grid2">
                    <label>Tipo de piso <select id="mucTipoPiso"></select></label>
                    <label>Numeração
                        <select id="mucModo">
                            <option value="faixa">Faixa por piso (ex.: 101 a 104)</option>
                            <option value="porPiso">Quantidade por piso (1, 2, 3…)</option>
                            <option value="texto">Texto (ex.: A)</option>
                            <option value="semArg">Sem argumento</option>
                        </select>
                    </label>
                </div>
                <div class="muc-grid3">
                    <label>Piso lógico inicial <input type="number" id="mucLi" step="1" value="1"></label>
                    <label>Piso lógico final <input type="number" id="mucLf" step="1" placeholder="só um piso"></label>
                    <label>Piso real inicial <input type="text" id="mucRi" maxlength="20" placeholder="igual ao lógico"></label>
                </div>
                <div id="mucFaixa" class="muc-grid3">
                    <label>Primeira UC <input type="number" id="mucUi" step="1" placeholder="101"></label>
                    <label>Última UC <input type="number" id="mucUf" step="1" placeholder="104"></label>
                    <label>Sequência <select id="mucNum"><option value="continua">Contínua</option><option value="impares">Ímpares</option><option value="pares">Pares</option></select></label>
                </div>
                <div id="mucPorPiso" class="muc-grid2" style="display:none;"><label>UCs por piso <input type="number" id="mucQtd" min="1" max="99" step="1" placeholder="4"></label></div>
                <div id="mucTexto" class="muc-grid2" style="display:none;"><label>Argumento <input type="text" id="mucTxt" maxlength="50" placeholder="A"></label></div>
                <div class="muc-prev" id="mucPrev"></div>
                <button type="button" class="btn-add-survey" id="mucAdd">+ Adicionar grupo</button>
            </div>

            <div class="muc-titulo">Grupos criados <span id="mucTotal"></span></div>
            <div id="mucGrupos" class="muc-grupos"></div>

            <div class="muc-card">
                <div class="muc-titulo">Fotos da edificação <small>(até 100 kB, 640 px — ajusto sozinho)</small></div>
                <div id="mucFotos" class="muc-fotos"></div>
            </div>
        </div>
        <div class="multiuc-foot">
            <button type="button" class="muc-sec" id="mucLimpar">Limpar tudo</button>
            <button type="button" class="btn-add-survey" id="mucOk" style="width:auto;margin:0;padding:10px 22px;">Concluir</button>
        </div>
    </div>`;
    document.body.appendChild(ov);
    _mucOverlay = ov;
    const $ = (id) => ov.querySelector('#' + id);

    _mucOpcoes($('mucOcup'), UC_OCUPACOES);
    _mucOpcoes($('mucDest'), UC_DESTINACOES);
    _mucOpcoes($('mucTipoPiso'), UC_PISO_IDS.map(id => [id, _ucNomeTipo(id)]));
    $('mucTipoPiso').value = '7';
    const porNome = (a, b) => a[1].localeCompare(b[1], 'pt');
    $('mucTipoUc').innerHTML =
        `<optgroup label="Mais comuns">${UC_COMPL_COMUNS_IDS.map(id => [id, _ucNomeTipo(id)]).sort(porNome).map(([v, n]) => `<option value="${v}">${escapeHtml(n)}</option>`).join('')}</optgroup>` +
        `<optgroup label="Outros">${UC_COMPL_OUTROS_IDS.map(id => [id, _ucNomeTipo(id)]).sort(porNome).map(([v, n]) => `<option value="${v}">${escapeHtml(n)}</option>`).join('')}</optgroup>` +
        `<optgroup label="Sem argumento">${UC_COMPL_SEMARG_IDS.map(id => `<option value="${id}">${escapeHtml(_ucNomeTipo(id))}</option>`).join('')}</optgroup>`;
    $('mucTipoUc').value = '9';   // Apartamento

    const lerCfg = () => ({
        destinacao: $('mucDest').value, idTipoComplemento: $('mucTipoUc').value, idTipoPiso: $('mucTipoPiso').value,
        modo: $('mucModo').value, numeracao: $('mucNum').value,
        pisoLogicoInicial: $('mucLi').value, pisoLogicoFinal: $('mucLf').value, pisoRealInicial: $('mucRi').value,
        ucInicial: $('mucUi').value, ucFinal: $('mucUf').value, ucsPorPiso: $('mucQtd').value, texto: $('mucTxt').value
    });
    const camposDoModo = () => {
        const sem = UC_COMPL_SEMARG_IDS.includes(Number($('mucTipoUc').value));
        const opSem = $('mucModo').querySelector('option[value="semArg"]');
        opSem.disabled = UC_COMPL_ARG_OBRIG.has(Number($('mucTipoUc').value));
        if (sem) $('mucModo').value = 'semArg';
        else if ($('mucModo').value === 'semArg' && opSem.disabled) $('mucModo').value = 'faixa';
        $('mucModo').disabled = sem;
        const m = $('mucModo').value;
        $('mucFaixa').style.display = m === 'faixa' ? '' : 'none';
        $('mucPorPiso').style.display = m === 'porPiso' ? '' : 'none';
        $('mucTexto').style.display = m === 'texto' ? '' : 'none';
    };
    const prev = () => {
        camposDoModo();
        const r = ucGerarGrupo(lerCfg());
        const el = $('mucPrev');
        if (r.erro) { el.className = 'muc-prev muc-prev-erro'; el.textContent = r.erro; return; }
        el.className = 'muc-prev';
        const amostra = r.ucs.slice(0, 8).map(u => (u.complemento || '—') + (u.pisoLogico !== r.ucs[0].pisoLogico ? '' : '')).join(', ');
        el.textContent = `Vai criar ${r.ucs.length} UC(s): ${amostra}${r.ucs.length > 8 ? '…' : ''}`;
    };
    ['mucDest', 'mucTipoUc', 'mucTipoPiso', 'mucModo', 'mucNum', 'mucLi', 'mucLf', 'mucRi', 'mucUi', 'mucUf', 'mucQtd', 'mucTxt']
        .forEach(id => { $(id).addEventListener('input', prev); $(id).addEventListener('change', prev); });

    $('mucTipo').addEventListener('change', () => { _multiUc.tipo = $('mucTipo').value; });
    $('mucOcup').addEventListener('change', () => { _multiUc.ocupacao = $('mucOcup').value; });

    $('mucAdd').addEventListener('click', () => {
        const r = ucGerarGrupo(lerCfg());
        if (r.erro) { showToast('Verifique os dados', r.erro, 'warning', 5000); return; }
        const chaves = new Set(_multiUc.ucs.map(u => `${u.idTipoComplemento}|${u.complemento}|${u.pisoLogico}`));
        const rep = r.ucs.find(u => u.complemento && chaves.has(`${u.idTipoComplemento}|${u.complemento}|${u.pisoLogico}`));
        if (rep) { showToast('UC repetida', `Já existe ${rep.tipoComplemento} ${rep.complemento} no piso ${rep.pisoLogico}.`, 'warning', 5000); return; }
        const gid = ++_ucGidSeq;
        r.ucs.forEach(u => { u.gid = gid; });
        _multiUc.ucs.push(...r.ucs);
        _multiUc.grupos.push({ gid, descricao: r.descricao, qtd: r.ucs.length });
        renderGrupos();
        multiUcAtualizarResumo();
    });
    $('mucLimpar').addEventListener('click', () => {
        if (!_multiUc.ucs.length && !Object.values(_multiUc.fotos).some(Boolean)) return;
        if (!confirm('Apagar todos os grupos de UCs e as fotos deste imóvel?')) return;
        _multiUc.grupos = []; _multiUc.ucs = []; _multiUc.fotos = _ucFotosVazias();
        renderGrupos(); renderFotos(); multiUcAtualizarResumo();
    });
    const fechar = () => { ov.style.display = 'none'; multiUcAtualizarResumo(); };
    $('mucOk').addEventListener('click', fechar);
    $('mucFechar').addEventListener('click', fechar);
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) fechar(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ov.style.display === 'flex') fechar(); });

    function renderGrupos() {
        const box = $('mucGrupos');
        $('mucTotal').textContent = _multiUc.ucs.length ? `— ${_multiUc.ucs.length} UC(s) no total` : '';
        if (!_multiUc.grupos.length) { box.innerHTML = '<p class="muc-vazio">Nenhum grupo ainda.</p>'; return; }
        box.innerHTML = '';
        _multiUc.grupos.forEach(g => {
            const row = document.createElement('div');
            row.className = 'muc-grupo';
            row.innerHTML = `<span><strong>${g.qtd}</strong> UC(s) — ${escapeHtml(g.descricao)}</span><button type="button" title="Remover grupo">🗑</button>`;
            row.querySelector('button').addEventListener('click', () => {
                _multiUc.ucs = _multiUc.ucs.filter(u => u.gid !== g.gid);
                _multiUc.grupos = _multiUc.grupos.filter(x => x.gid !== g.gid);
                renderGrupos(); multiUcAtualizarResumo();
            });
            box.appendChild(row);
        });
    }
    function renderFotos() {
        const box = $('mucFotos');
        box.innerHTML = '';
        [['exterior', 'Exterior da edificação *'], ['fachada', 'Fachada da edificação *'], ['interior', 'Interior (opcional)']].forEach(([k, rotulo]) => {
            const blob = _multiUc.fotos[k];
            if (_mucUrls[k]) { URL.revokeObjectURL(_mucUrls[k]); _mucUrls[k] = null; }
            if (blob) _mucUrls[k] = URL.createObjectURL(blob);
            const d = document.createElement('div');
            d.className = 'muc-foto';
            d.innerHTML = `
                <div class="muc-foto-img">${blob ? `<img src="${_mucUrls[k]}" alt="${rotulo}">` : '<span>sem foto</span>'}</div>
                <div class="muc-foto-info">
                    <strong>${rotulo}</strong>
                    <small>${blob ? Math.round(blob.size / 1000) + ' kB' : 'obrigatória'.replace('obrigatória', k === 'interior' ? 'opcional' : 'obrigatória')}</small>
                    <div class="muc-foto-bt">
                        <button type="button" data-a="escolher">${blob ? 'Trocar foto' : '📁 Carregar foto'}</button>
                        <button type="button" data-a="camera" title="No celular abre a câmera; no computador abre a seleção de arquivo">📷 Tirar foto</button>
                        <button type="button" data-a="proibida" title="Morador não autorizou a foto">Foto proibida</button>
                        ${blob ? '<button type="button" data-a="remover">Remover</button>' : ''}
                    </div>
                    <input type="file" accept="image/*" hidden data-i="arquivo">
                    <input type="file" accept="image/*" capture="environment" hidden data-i="camera">
                </div>`;
            const aceitarFoto = async (inp) => {
                const f = inp.files && inp.files[0];
                inp.value = '';   // permite escolher a mesma foto de novo
                if (!f) return;
                try { _multiUc.fotos[k] = await _ucProcessarFoto(f); }
                catch (e) { showToast('Foto não aceita', e.message, 'error', 5000); return; }
                renderFotos(); multiUcAtualizarResumo();
            };
            const inpArq = d.querySelector('[data-i="arquivo"]'), inpCam = d.querySelector('[data-i="camera"]');
            d.querySelector('[data-a="escolher"]').addEventListener('click', () => inpArq.click());
            d.querySelector('[data-a="camera"]').addEventListener('click', () => inpCam.click());
            inpArq.addEventListener('change', () => aceitarFoto(inpArq));
            inpCam.addEventListener('change', () => aceitarFoto(inpCam));
            d.querySelector('[data-a="proibida"]').addEventListener('click', () => {
                _multiUc.fotos[k] = _ucBlobDeBase64(FOTO_PROIBIDA_B64, 'image/jpeg');
                renderFotos(); multiUcAtualizarResumo();
            });
            d.querySelector('[data-a="remover"]')?.addEventListener('click', () => {
                _multiUc.fotos[k] = null; renderFotos(); multiUcAtualizarResumo();
            });
            box.appendChild(d);
        });
    }
    ov._sincronizar = () => {
        $('mucTipo').value = _multiUc.tipo;
        $('mucOcup').value = _multiUc.ocupacao;
        renderGrupos(); renderFotos(); prev();
    };
    return ov;
}
function multiUcAbrirModal() {
    const ov = _mucGarantirModal();
    ov._sincronizar();
    ov.style.display = 'flex';
}
(function () {
    const t = document.getElementById('multiUcToggle');
    if (!t) return;
    t.addEventListener('change', () => {
        _multiUc.ativo = t.checked;
        multiUcAtualizarResumo();
        if (t.checked && !_multiUc.ucs.length) multiUcAbrirModal();
    });
    document.getElementById('multiUcBtn')?.addEventListener('click', multiUcAbrirModal);
    document.getElementById('multiUcResumo')?.addEventListener('click', multiUcAbrirModal);
})();

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
            const multi = s.multiUc && Array.isArray(s.multiUc.ucs) && s.multiUc.ucs.length ? s.multiUc : null;
            const nomePasta = `${multi ? 'edificio' : 'moradia'}${numero}`;   // prédio: edificioN/edificioN.xml (+ fotos)
            const nomeArquivo = `${nomePasta}.xml`;
            const pasta = zip.folder(nomePasta);
            pasta.file(nomeArquivo, gerarXMLEdificio(s, s.logradouro, numero));
            if (multi) multiUcFotosParaZip(multi).forEach(f => pasta.file(f.nome, f.blob));
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
        _iaJaDisparou = false; _iaMeta = 0; _iaJanela = 5; _iaCorte = 0; limparSetorIA();

        showToast('ZIP gerado', `${total} survey(s) exportado(s). Lista limpa.`, 'success', 4000);
        renderizarSurveys();
    } catch (err) {
        console.error(err);
        showToast('Erro ao gerar ZIP', err.message, 'error');
    }
});

// ============================================
// GERAR XML NO FORMATO "edificio" (padrão CE Mobile, o que o site aceita)
// - <?xml ...?> com aspas simples, standalone='yes', em linha própria
// - Quebras de linha CRLF, sem linha em branco no final do arquivo
// - Tag raiz <edificio> leva xmlns + autorizacao fixos (AUTORIZACAO_FIXA)
// - <idCEMobile> = número sequencial da moradia (pasta moradiaN -> N)
// - <logradouro> é só "TIPO NOME", sem concatenar bairro/cidade/UF
// - Não existe <id> vazio em lugar nenhum (nem endereco, nem técnico)
// - <codigoZona>/<nomeZona> vêm do campo "Zona" digitado no formulário
// - <tecnico> hardcoded (TECNICO_FIXO_ID / TECNICO_FIXO_NOME)
// - Complementos vazios são OMITIDOS (renumerados em sequência)
// ============================================
function gerarXMLEdificio(survey, logradouro, numero) {
    const l = logradouro || {};

    // --- escape de caracteres especiais ---
    const xmlEscape = (v) => {
        if (v == null) return '';
        return String(v)
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // caracteres de controle inválidos
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    // --- tag SEMPRE na forma longa: <nome></nome> quando vazia ---
    const tag = (nome, valor) => {
        const v = (valor === null || valor === undefined) ? '' : String(valor);
        return '<' + nome + '>' + xmlEscape(v) + '</' + nome + '>';
    };

    // --- rede de segurança: converte qualquer <tag/> que escape para <tag></tag> ---
    const expandirAutoFechadas = (str) =>
        str.replace(/<([A-Za-z_][\w.\-]*)((?:\s[^<>]*?)?)\s*\/>/g, '<$1$2></$1>');

    // --- data/hora atual: aaaammddhhmmss ---
    const agora = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dataFormatada = `${agora.getFullYear()}${pad(agora.getMonth() + 1)}${pad(agora.getDate())}` +
                          `${pad(agora.getHours())}${pad(agora.getMinutes())}${pad(agora.getSeconds())}`;

    // --- logradouro: só tipo + nome da rua, sem concatenar bairro/cidade/UF ---
    const tipo = (l.tipo || 'Rua').toString().toUpperCase();
    const nomeLograd = (l.rua || '').toString().toUpperCase();
    const bairro = (l.bairro || '').toString().toUpperCase();
    const localidade = (l.localidade || l.cidade || '').toString().toUpperCase();
    const codLograd = l.cod_lograd || l.id_roteiro || '0';
    const logradouroSimples = `${tipo} ${nomeLograd}`.trim();

    // --- coordenadas: sempre com 6 casas decimais, como no app oficial ---
    const fmtCoord = (v) => {
        if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '';
        return Number(v).toFixed(6);
    };

    const lat = survey.latitude != null ? survey.latitude : (l.lat != null ? l.lat : null);
    const lng = survey.longitude != null ? survey.longitude : (l.lng != null ? l.lng : null);

    const coordX = fmtCoord(lng); // longitude
    const coordY = fmtCoord(lat); // latitude

    // --- zona: vem do que foi digitado no formulário (campo "Zona") ---
    const zona = (survey.zona || '').toString().trim();

    // --- demais valores do roteiro ---
    const idCEMobile = numero != null ? String(numero) : '';
    const numeroFachada = (survey.numero || 'SN').toString().toUpperCase();
    const cep = (l.cep || '').toString().replace(/\D/g, '');
    const idRoteiro = l.id_roteiro || l._registro_id || '';
    const idLocalidade = l.id_localidade || '';
    const numPisos = survey.pisos && !isNaN(parseInt(survey.pisos, 10))
        ? String(parseInt(survey.pisos, 10))
        : '1';

    // --- complementos: emite o par (id_complementoN / argumentoN)
    //     para cada complemento preenchido, renumerando em sequência ---
    const comps = Array.isArray(survey.complementos) ? survey.complementos : [];
    const compsValidos = comps
        .map(c => ({
            tipo: (c && c.tipo ? String(c.tipo) : '').trim(),
            valor: (c && c.valor ? String(c.valor) : '').trim()
        }))
        .filter(c => c.tipo || c.valor);

    let blocoComplementos = '';
    compsValidos.forEach((c, i) => {
        const n = i + 1;
        blocoComplementos += '    ' + tag('id_complemento' + n, getIdComplemento(c.tipo)) + '\r\n';
        blocoComplementos += '    ' + tag('argumento' + n, c.valor) + '\r\n';
    });

    // --- imóvel com várias UCs: tipo E (completa, sem infraestrutura interna) ou P (parcial) ---
    const multi = survey.multiUc && Array.isArray(survey.multiUc.ucs) && survey.multiUc.ucs.length ? survey.multiUc : null;
    const tipoRaiz = multi ? (multi.tipo === 'P' ? 'P' : 'E') : 'M';

    // --- monta o XML (CRLF, igual ao arquivo que o site aceita) ---
    let xml = '';
    xml += "<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>\r\n";
    xml += `<edificio xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" versao="7.9.2" autorizacao="${AUTORIZACAO_FIXA}" tipo="${tipoRaiz}">\r\n`;
    xml += '  ' + tag('gravado', 'false') + '\r\n';
    xml += '  ' + tag('idCEMobile', idCEMobile) + '\r\n';
    xml += '  ' + tag('coordX', coordX) + '\r\n';
    xml += '  ' + tag('coordY', coordY) + '\r\n';
    xml += '  ' + tag('codigoZona', zona) + '\r\n';
    xml += '  ' + tag('nomeZona', zona) + '\r\n';
    xml += '  ' + tag('localidade', localidade) + '\r\n';
    xml += '  <enderecoEdificio>\r\n';
    xml += '    ' + tag('logradouro', logradouroSimples) + '\r\n';
    xml += '    ' + tag('numero_fachada', numeroFachada) + '\r\n';
    const idTipoImovel = getIdTipoImovel(survey.tipoImovel);
    if (idTipoImovel !== '') xml += '    ' + tag('id_tipo_imovel', idTipoImovel) + '\r\n';
    const argImovel = (survey.imovel || '').toString().trim();
    if (argImovel) xml += '    ' + tag('arg_imovel', argImovel) + '\r\n';
    xml += blocoComplementos;
    xml += '    ' + tag('cep', cep) + '\r\n';
    xml += '    ' + tag('bairro', bairro) + '\r\n';
    xml += '    ' + tag('id_roteiro', idRoteiro) + '\r\n';
    xml += '    ' + tag('id_localidade', idLocalidade) + '\r\n';
    xml += '    ' + tag('cod_lograd', codLograd) + '\r\n';
    xml += '  </enderecoEdificio>\r\n';
    xml += '  <tecnico>\r\n';
    xml += '    ' + tag('id', TECNICO_FIXO_ID) + '\r\n';
    xml += '    ' + tag('nome', TECNICO_FIXO_NOME) + '\r\n';
    xml += '  </tecnico>\r\n';
    xml += '  <empresa>\r\n';
    xml += '    ' + tag('id', '6') + '\r\n';
    xml += '    ' + tag('nome', 'LOGICTEL') + '\r\n';
    xml += '  </empresa>\r\n';
    xml += '  ' + tag('data', dataFormatada) + '\r\n';
    const obsTxt = (survey.observacoes || '').toString().trim();
    if (obsTxt) xml += '  ' + tag('observacoes', obsTxt) + '\r\n';
    if (multi) {
        // prédio: total de UCs, ocupação, sem rede interna, fotos e a lista de UCs (igual ao edificioN.xml do app)
        xml += '  ' + tag('totalUCs', String(multi.ucs.length)) + '\r\n';
        xml += '  ' + tag('ocupacao', multi.ocupacao || 'EDIFICACAOCOMPLETA') + '\r\n';
        xml += '  ' + tag('redeInterna', 'N') + '\r\n';
        const fotos = multiUcFotosParaZip(multi);
        if (fotos.length) {
            xml += '  <infoFotos>\r\n';
            if (multi.fotos.exterior) xml += '    ' + tag('fotoExteriorEdificio', UC_FOTO_NOMES.exterior) + '\r\n';
            if (multi.fotos.fachada) xml += '    ' + tag('fotoFachadaEdificio', UC_FOTO_NOMES.fachada) + '\r\n';
            if (multi.fotos.interior) xml += '    ' + tag('fotoInteriorEdificio', UC_FOTO_NOMES.interior) + '\r\n';
            xml += '  </infoFotos>\r\n';
        }
        xml += '  <ucs>\r\n';
        multi.ucs.forEach((u, i) => {
            xml += '    <uc>\r\n';
            xml += '      ' + tag('id', String(i + 1)) + '\r\n';
            if (u.destinacao) xml += '      ' + tag('destinacao', u.destinacao) + '\r\n';
            if (u.idTipoComplemento) xml += '      ' + tag('id_complemento3', u.idTipoComplemento) + '\r\n';
            if (u.complemento) xml += '      ' + tag('argumento3', u.complemento) + '\r\n';
            if (u.idTipoPiso) xml += '      ' + tag('id_complemento4', u.idTipoPiso) + '\r\n';
            xml += '      ' + tag('argumento4_logico', u.pisoLogico) + '\r\n';
            if (u.pisoReal) xml += '      ' + tag('argumento4_real', u.pisoReal) + '\r\n';
            xml += '    </uc>\r\n';
        });
        xml += '  </ucs>\r\n';
    } else {
        xml += '  ' + tag('totalUCs', '1') + '\r\n';
        xml += '  ' + tag('ocupacao', 'EDIFICACAOCOMPLETA') + '\r\n';
        xml += '  ' + tag('numPisos', numPisos) + '\r\n';
        xml += '  ' + tag('destinacao', 'RESIDENCIA') + '\r\n';
    }
    xml += '</edificio>'; // sem quebra de linha no final, igual ao arquivo original

    // passada final de segurança contra qualquer <tag/>
    return expandirAutoFechadas(xml);
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
            .from('logradouros').select('id, logradouro, bairro, municipio, uf, cep')
            .eq('origem', 'Roteiro XML');
        if (errBusca) throw errBusca;

        // Duplicados dentro do arquivo: vale a ÚLTIMA linha
        const porChave = new Map();
        normalizados.forEach(r => porChave.set(chaveDe(r), r));
        const novos = Array.from(porChave.values());

        // Duplicados já no banco: as linhas antigas serão removidas após inserir as novas
        const idsAntigos = (existentes || []).filter(e => porChave.has(chaveDe(e))).map(e => e.id);
        const substituidos = idsAntigos.length;
        const ignorados = normalizados.length - novos.length; // repetidos dentro do próprio arquivo

        const TAM = 500;
        let inseridos = 0;
        for (let i = 0; i < novos.length; i += TAM) {
            const lote = novos.slice(i, i + TAM);
            const { error } = await supabaseClient.from('logradouros').insert(lote);
            if (error) throw error;
            inseridos += lote.length;
            status.textContent = `Importando... ${inseridos}/${novos.length}`;
        }

        for (let i = 0; i < idsAntigos.length; i += 200) {
            const { error } = await supabaseClient.from('logradouros').delete().in('id', idsAntigos.slice(i, i + 200));
            if (error) throw error;
            status.textContent = `Removendo linhas antigas... ${Math.min(i + 200, idsAntigos.length)}/${substituidos}`;
        }

        status.textContent = `${inseridos} importado(s) (${substituidos} substituído(s) por versão nova). ${ignorados} repetido(s) no arquivo ignorado(s).`;
        showToast('Roteiro importado', `${inseridos} importado(s) | ${substituidos} substituído(s) | ${ignorados} repetido(s) no arquivo.`, 'success', 5000);
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

    // a janela da IA fica SEMPRE disponível: começa minimizada e abre ao clicar no cabeçalho
    iaChatEl.dataset.state = 'minimized';
    if (iaFabEl) iaFabEl.style.display = 'none';
    if (iaCloseBtn) iaCloseBtn.style.display = 'none';   // não há mais "fechar": só minimizar
    iaMensagemInterativa(
        `<div class="ia-card-title">👋 Olá! Eu sou a IA Logictel</div>
        Escolha um modo nos botões acima ou digite o nome dele:
        <ul class="ia-lista">
            <li><strong>IBGE</strong> mostra as fachadas do IBGE e cadastra as que você marcar.</li>
            <li><strong>Padrões</strong> procura sequências nos surveys cadastrados.</li>
            <li><strong>Linhas</strong> cadastra seguindo linhas que você desenha no mapa.</li>
            <li><strong>Espacializar</strong> alinha surveys em uma linha, mantendo a distância entre eles.</li>
        </ul>
        <small>Ao cadastrar 5 surveys no mesmo endereço, eu também procuro o padrão automaticamente.</small>`
    );

    document.querySelectorAll('#iaModes .ia-mode').forEach(b => {
        b.addEventListener('click', () => {
            abrirChatIA();
            escreverMensagemUser(NOMES_MODO_IA[b.dataset.modo] || b.dataset.modo);
            executarModoIA(b.dataset.modo);
        });
    });

    iaChatHeader?.addEventListener('click', (e) => {
        if (e.target.closest('.ia-chat-actions')) return;
        // clicar na barra alterna: aberto → minimiza; minimizado → abre
        const estavaAberto = iaChatEl.dataset.state === 'open';
        if (estavaAberto) { minimizarChatIA(); return; }
        abrirChatIA();
        document.getElementById('iaChatInput')?.focus();
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
        executarModoIA('padroes');
    });

    // caixa de texto do chat: o usuário pode digitar comandos (ex.: "Verificar IBGE")
    const inp = document.getElementById('iaChatInput');
    const enviar = () => {
        const txt = (inp.value || '').trim();
        if (!txt) return;
        inp.value = '';
        processarComandoChatIA(txt);
    };
    document.getElementById('iaChatSendBtn')?.addEventListener('click', enviar);
    inp?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); enviar(); } });
}

// ---- entendimento de comandos digitados (tolera maiúsculas, acentos e erros de digitação) ----
function _normTxt(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
// distância de edição (inclui troca de letras vizinhas: "igbe" → "ibge")
function _distEdicao(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const custo = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + custo);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
    }
    return d[a.length][b.length];
}
function intencaoVerificarIbge(txt) {
    const n = _normTxt(txt);
    if (!n) return false;
    if (n.replace(/\s/g, '').includes('ibge')) return true;        // "verificaribge", "ibge", "ver o ibge"...
    return n.split(' ').some(t => t.length >= 3 && t.length <= 6 && _distEdicao(t, 'ibge') <= 1);   // "ibje", "ibg", "igbe"...
}
// ---- modos da IA (botões acima do chat e comandos digitados) ----
const NOMES_MODO_IA = { ibge: 'Verificar IBGE', padroes: 'Detectar padrões', linhas: 'Desenhar linhas', espacializacao: 'Espacialização' };
function definirModoIA(modo) {
    _modoIA = modo || null;
    document.querySelectorAll('#iaModes .ia-mode').forEach(b => b.classList.toggle('active', b.dataset.modo === _modoIA));
}
function executarModoIA(modo) {
    // um modo por vez: ao trocar, encerra a marcação/seleção que estava aberta
    if (modo !== 'ibge') encerrarSelecaoIbge(true);
    if (modo !== 'espacializacao') encerrarEspacializacao();
    if (modo === 'ibge') iniciarVerificacaoIbge();
    else if (modo === 'padroes') detectarPadroes(true);
    else if (modo === 'linhas') iniciarDesenhoLinhas();
    else if (modo === 'espacializacao') iniciarEspacializacao();
}
function processarComandoChatIA(txt) {
    escreverMensagemUser(txt);
    const n = _normTxt(txt);
    if (/espac|alinh|organiz/.test(n)) { executarModoIA('espacializacao'); return; }
    if (intencaoVerificarIbge(txt)) { executarModoIA('ibge'); return; }
    if (/padr/.test(n)) { executarModoIA('padroes'); return; }
    if (/linha/.test(n)) { executarModoIA('linhas'); return; }
    escreverMensagemIA('Não entendi esse comando. Eu entendo: <strong>IBGE</strong>, <strong>Padrões</strong>, <strong>Linhas</strong> e <strong>Espacialização</strong>. Você também pode usar os botões acima.', 300);
}

function abrirChatIA() {
    if (!iaChatEl) return;
    iaChatEl.dataset.state = 'open';
    if (iaFabEl) iaFabEl.style.display = 'none';
    iaNaoLidas = 0;
    if (iaFabBadge) iaFabBadge.style.display = 'none';
    atualizarBadgeChatIA();
    iaChatBody.scrollTop = iaChatBody.scrollHeight;
}

function minimizarChatIA() {
    if (!iaChatEl) return;
    iaChatEl.dataset.state = 'minimized';
    if (iaFabEl) iaFabEl.style.display = 'none';
}

function fecharChatIA() {
    // a janela nunca some: "fechar" apenas minimiza
    minimizarChatIA();
}

function atualizarBadgeChatIA() {
    const b = document.getElementById('iaHeaderBadge');
    if (!b) return;
    b.style.display = iaNaoLidas > 0 ? '' : 'none';
    b.textContent = String(iaNaoLidas);
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
            atualizarBadgeChatIA();   // bolinha no cabeçalho minimizado
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
// IA — PEDIR A ZONA (toda criação feita pela IA precisa de zona)
// ============================================
function pedirZonaIA(texto, aoConfirmar, aoCancelar) {
    abrirChatIA();
    const sugerida = (document.getElementById('zonaInput')?.value || '').trim().toUpperCase();
    const div = iaMensagemInterativa(`
        <div class="ia-card-title">🗺️ Zona</div>
        ${texto}
        <div class="ia-msg-input-group">
            <input type="text" list="zonaDatalist" placeholder="Digite a zona" autocomplete="off" value="${escapeHtml(sugerida)}">
            <button class="ia-btn ia-btn-success" data-acao="ok" type="button">Confirmar</button>
        </div>
        <div class="ia-msg-actions">
            <button class="ia-btn ia-btn-secondary" data-acao="cancelar" type="button">Cancelar</button>
        </div>`);
    const inp = div.querySelector('input');
    const confirmar = () => {
        const zona = inp.value.trim().toUpperCase();
        if (!zona) { showToast('Zona obrigatória', 'Informe a zona para cadastrar.', 'warning', 3500); inp.focus(); return; }
        salvarZonaNoBanco(zona);   // grava/atualiza no histórico de zonas
        div.remove();
        escreverMensagemUser(zona);
        aoConfirmar(zona);
    };
    div.querySelector('[data-acao="ok"]').addEventListener('click', confirmar);
    inp.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); confirmar(); } });
    div.querySelector('[data-acao="cancelar"]').addEventListener('click', () => {
        div.remove();
        escreverMensagemUser('Cancelar');
        if (aoCancelar) aoCancelar();
    });
    inp.focus();
    return div;
}

// ============================================
// IA — VERIFICAR SE DEVE DISPARAR APÓS 5 SURVEYS
// ============================================
function verificarIAAutomatica() {
    if (_iaJaDisparou) return;
    const alvo = _iaMeta > 0 ? _iaMeta : 5;
    const recentes = surveysMemoria.slice(_iaCorte).filter(s => !s.multiUc);
    if (recentes.length < alvo) return;

    const grupos = {};
    recentes.forEach(s => {
        const key = (s.logradouro && s.logradouro.rua) ? s.logradouro.rua.toUpperCase() : '—';
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(s);
    });

    let grupoValido = null;
    for (const key in grupos) {
        if (grupos[key].length >= alvo) { grupoValido = grupos[key]; break; }
    }
    if (!grupoValido) return;

    _iaJaDisparou = true;
    abrirChatIA();

    if (_iaMeta > 0) {
        // Meta de verificação expandida atingida: analisa o padrão dos últimos N
        _iaJanela = _iaMeta;
        _iaMeta = 0;
        setTimeout(() => detectarPadroes(false), 800);
    } else {
        setTimeout(perguntarExpandirVerificacao, 800);
    }
}

// ============================================
// IA — PERGUNTAR SE EXPANDE A VERIFICAÇÃO (10, 15, 20 ou outro valor)
// ============================================
function perguntarExpandirVerificacao() {
    limparSetorIA();
    escreverMensagemIA(
        `Olá! Eu sou a <strong>IA Logictel</strong>. Você já cadastrou <strong>5 surveys</strong> no mesmo endereço.<br><br>
        Deseja <strong>expandir a verificação de padrão</strong>? Assim eu só analiso depois de você cadastrar mais surveys, usando todos eles para achar o padrão.`,
        false
    );

    setTimeout(() => {
        const wrapper = document.createElement('div');
        wrapper.className = 'ia-msg ia-msg-ia';
        wrapper.innerHTML = `
            <div class="ia-msg-actions">
                <button class="ia-btn ia-btn-success" data-meta="5" type="button">Analisar agora (5)</button>
                <button class="ia-btn ia-btn-secondary" data-meta="10" type="button">10</button>
                <button class="ia-btn ia-btn-secondary" data-meta="15" type="button">15</button>
                <button class="ia-btn ia-btn-secondary" data-meta="20" type="button">20</button>
                <button class="ia-btn ia-btn-success" id="iaLinhasBtn" type="button">📏 Desenhar linhas no mapa</button>
            </div>
            <div class="ia-msg-input-group">
                <input type="number" id="iaMetaInput" min="6" max="500" placeholder="Outro valor">
                <button class="ia-btn ia-btn-secondary" id="iaMetaBtn" type="button">Usar</button>
            </div>
        `;
        iaChatBody.appendChild(wrapper);
        iaChatBody.scrollTop = iaChatBody.scrollHeight;

        const escolher = (n) => {
            wrapper.remove();
            if (n <= 5) {
                escreverMensagemUser('Analisar agora');
                detectarPadroes(false);
                return;
            }
            escreverMensagemUser(String(n));
            _iaMeta = n;
            _iaJaDisparou = false; // volta a observar os cadastros
            escreverMensagemIA(
                `Combinado! Continue cadastrando. Quando você chegar a <strong>${n} surveys</strong> no mesmo endereço, 
                eu analiso o padrão deles e pergunto se devo cadastrar conforme esse padrão.`
            );
        };

        wrapper.querySelectorAll('[data-meta]').forEach(btn =>
            btn.addEventListener('click', () => escolher(parseInt(btn.dataset.meta, 10))));

        const usar = () => {
            const n = parseInt(document.getElementById('iaMetaInput').value, 10);
            if (isNaN(n) || n < 6 || n > 500) {
                showToast('Valor inválido', 'Informe um número entre 6 e 500.', 'warning');
                return;
            }
            escolher(n);
        };
        document.getElementById('iaLinhasBtn').addEventListener('click', () => {
            wrapper.remove();
            escreverMensagemUser('Desenhar linhas no mapa');
            iniciarDesenhoLinhas();
        });
        document.getElementById('iaMetaBtn').addEventListener('click', usar);
        document.getElementById('iaMetaInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); usar(); }
        });
    }, 500);
}

// ============================================
// IA — DESENHAR LINHAS NO MAPA (2 cliques = 1 linha)
// ============================================
function iniciarDesenhoLinhas() {
    const linhas = [];          // [[ [lat,lng], [lat,lng] ], ...]
    const camadasLinha = [];    // camadas de cada linha (para desfazer)
    const grupo = L.layerGroup().addTo(map);
    let pendente = null, marcaPendente = null;
    map.getContainer().style.cursor = 'crosshair';

    const ponto = (ll, cor) => L.circleMarker(ll, { radius: 5, color: cor, fillColor: cor, fillOpacity: 1 });

    const onClick = (e) => {
        const cor = corLinha(linhas.length); // cada linha ganha uma cor
        if (!pendente) {
            pendente = e.latlng;
            marcaPendente = ponto(e.latlng, cor).addTo(grupo);
            return;
        }
        const a = pendente, b = e.latlng;
        const ls = [
            marcaPendente,
            L.polyline([a, b], { color: cor, weight: 3 }).addTo(grupo),
            ponto(b, cor).addTo(grupo)
        ];
        camadasLinha.push(ls);
        linhas.push([[a.lat, a.lng], [b.lat, b.lng]]);
        pendente = null; marcaPendente = null;
    };
    map.on('click', onClick);

    const encerrar = () => {
        map.off('click', onClick);
        map.getContainer().style.cursor = '';
    };

    escreverMensagemIA(
        `Marque cada linha com <strong>2 cliques</strong> no mapa (início e fim), seguindo a fileira onde devo cadastrar. 
        Pode desenhar quantas linhas quiser, em qualquer parte do mapa. Quando terminar, clique em <strong>Concluir</strong>.`,
        false
    );
    const wrapper = document.createElement('div');
    wrapper.className = 'ia-msg ia-msg-ia';
    wrapper.innerHTML = `
        <div class="ia-msg-actions">
            <button class="ia-btn ia-btn-success" id="iaLinOk" type="button">Concluir</button>
            <button class="ia-btn ia-btn-secondary" id="iaLinDesfaz" type="button">Desfazer última</button>
            <button class="ia-btn ia-btn-secondary" id="iaLinCancela" type="button">Cancelar</button>
        </div>`;
    iaChatBody.appendChild(wrapper);
    iaChatBody.scrollTop = iaChatBody.scrollHeight;

    document.getElementById('iaLinDesfaz').addEventListener('click', () => {
        if (pendente) { grupo.removeLayer(marcaPendente); pendente = null; marcaPendente = null; return; }
        if (!linhas.length) return;
        linhas.pop();
        camadasLinha.pop().forEach(l => grupo.removeLayer(l));
    });
    document.getElementById('iaLinCancela').addEventListener('click', () => {
        encerrar();
        map.removeLayer(grupo);
        wrapper.remove();
        escreverMensagemUser('Cancelar');
        escreverMensagemIA('Tudo bem! Continue cadastrando manualmente.');
        _iaJaDisparou = false;
    });
    document.getElementById('iaLinOk').addEventListener('click', () => {
        if (pendente) { grupo.removeLayer(marcaPendente); pendente = null; marcaPendente = null; }
        if (!linhas.length) {
            showToast('Nenhuma linha', 'Marque pelo menos 1 linha (2 cliques).', 'warning');
            return;
        }
        encerrar();
        wrapper.remove();
        escreverMensagemUser(`${linhas.length} linha(s) marcada(s)`);
        _iaSetor = { linhas: linhas.map(l => l.map(p => [p[0], p[1]])), layer: grupo };
        detectarPadroes(false);
    });
}

function perguntarLinhas(g) {
    const linhasSel = _iaSetor.linhas;
    const sugerido = g ? Math.hypot(g.stepX, g.stepY) : 8;
    const tipoPadrao = iaPendencia && iaPendencia.tipo;

    const lat0 = linhasSel[0][0][0], lng0 = linhasSel[0][0][1];
    const mx = 111320 * Math.cos(lat0 * Math.PI / 180), my = 110540;
    const toXY = (lat, lng) => ({ x: (lng - lng0) * mx, y: (lat - lat0) * my });
    const existentes = surveysMemoria.map(sv => {
        const lat = sv.latitude != null ? Number(sv.latitude) : null;
        const lng = sv.longitude != null ? Number(sv.longitude) : null;
        return (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) ? toXY(lat, lng) : null;
    }).filter(Boolean);

    const segmentos = linhasSel.map(([A, B], i) => {
        const a = toXY(A[0], A[1]), b = toXY(B[0], B[1]);
        return { a, b, comp: Math.hypot(b.x - a.x, b.y - a.y), cor: corLinha(i) };
    });

    // Estado de cada linha: n = qtde de surveys, step = metros entre casas
    const estado = segmentos.map(s => ({
        n: s.comp < 0.01 ? 1 : Math.floor(s.comp / sugerido + 1e-6) + 1,
        step: sugerido
    }));
    const definirQtd = (i, n) => {
        const s = segmentos[i];
        n = Math.max(1, Math.min(2000, Math.floor(n)));
        if (s.comp < 0.01) n = 1;
        estado[i].n = n;
        estado[i].step = n > 1 ? s.comp / (n - 1) : 0;   // espalha de ponta a ponta da linha
    };
    const definirDist = (i, d) => {
        const s = segmentos[i];
        estado[i].step = d;
        estado[i].n = s.comp < 0.01 ? 1 : Math.floor(s.comp / d + 1e-6) + 1;
    };

    // Posições de todas as linhas; "ordem" = posição dentro da própria linha (1, 2, 3...)
    const calcular = () => {
        const posicoes = [];
        let ignoradas = 0;
        segmentos.forEach((s, i) => {
            const { n, step } = estado[i];
            const dx = s.comp > 0 ? (s.b.x - s.a.x) / s.comp : 0;
            const dy = s.comp > 0 ? (s.b.y - s.a.y) / s.comp : 0;
            let ordem = 0;
            for (let k = 0; k < n; k++) {
                const x = s.a.x + dx * step * k, y = s.a.y + dy * step * k;
                if (existentes.some(e => Math.hypot(e.x - x, e.y - y) < Math.max(0.45 * step, 0.5))) { ignoradas++; continue; }
                ordem++;
                posicoes.push({ lat: lat0 + y / my, lng: lng0 + x / mx, linha: i, cor: s.cor, ordem });
            }
        });
        return { posicoes, ignoradas };
    };

    const linhasHtml = segmentos.map((s, i) => `
        <div style="display:grid;grid-template-columns:1.1fr .9fr 1fr 1fr;gap:6px;align-items:center;margin-top:4px;">
            <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${s.cor};margin-right:4px"></span>Linha ${i + 1}</span>
            <span style="color:var(--text-tertiary)">${s.comp.toFixed(1)} m</span>
            <input type="number" min="1" step="1" data-qtd="${i}" style="width:100%">
            <input type="number" min="0.5" step="0.5" data-dist="${i}" style="width:100%">
        </div>`).join('');

    const div = document.createElement('div');
    div.className = 'ia-msg ia-msg-ia';
    div.innerHTML = `
        Vou criar os surveys <strong>em cima das ${linhasSel.length} linha(s)</strong> marcadas, a partir do primeiro ponto de cada uma. Defina a <strong>quantidade de cada linha</strong> (ou a distância entre casas).
        <div style="font-size:0.8rem;margin-top:8px;">
            <div style="display:grid;grid-template-columns:1.1fr .9fr 1fr 1fr;gap:6px;color:var(--text-tertiary);font-weight:600;">
                <span>Linha</span><span>Compr.</span><span>Qtde</span><span>m entre casas</span>
            </div>
            <div style="max-height:220px;overflow:auto;">${linhasHtml}</div>
            <div style="display:flex;gap:6px;align-items:flex-end;margin-top:8px;">
                <label style="flex:1">Mesma qtde em todas as linhas
                    <input type="number" id="iaLinTodas" min="1" step="1" style="width:100%">
                </label>
                <button class="ia-btn ia-btn-secondary" id="iaLinTodasBtn" type="button">Aplicar</button>
            </div>
            ${tipoPadrao && tipoPadrao !== 'sn' ? `
            <label style="display:flex;gap:6px;align-items:center;margin-top:8px;">
                <input type="checkbox" id="iaLinReiniciar">
                <span>Reiniciar a numeração em cada linha (por padrão a sequência continua entre as linhas)</span>
            </label>` : ''}
        </div>
        <small id="iaLinInfo" style="display:block;margin-top:6px;color:var(--text-tertiary)"></small>
        <div class="ia-msg-actions" style="margin-top:8px;">
            <button class="ia-btn ia-btn-success" id="iaLinCriar" type="button">Criar</button>
            <button class="ia-btn ia-btn-secondary" id="iaLinCancelar" type="button">Cancelar</button>
        </div>`;
    iaChatBody.appendChild(div);
    iaChatBody.scrollTop = iaChatBody.scrollHeight;

    const inpQ = (i) => div.querySelector(`[data-qtd="${i}"]`);
    const inpD = (i) => div.querySelector(`[data-dist="${i}"]`);
    const info = div.querySelector('#iaLinInfo');

    const mostrarPreview = (posicoes) => {
        limparPreviewLinhas();
        _iaPreview = L.layerGroup(posicoes.map(p => L.circleMarker([p.lat, p.lng], {
            radius: 4, color: '#fff', weight: 1, fillColor: p.cor, fillOpacity: 1, interactive: false
        }))).addTo(map);
    };
    const mostrarLinha = (i) => {
        inpQ(i).value = estado[i].n;
        inpD(i).value = estado[i].n > 1 ? +estado[i].step.toFixed(2) : '';
    };
    const atualizar = () => {
        const { posicoes, ignoradas } = calcular();
        info.textContent = `Total: ${posicoes.length} survey(s) em ${segmentos.length} linha(s)` +
            (ignoradas ? ` • ${ignoradas} posição(ões) já ocupada(s) ignorada(s)` : '');
        mostrarPreview(posicoes);
    };

    segmentos.forEach((_, i) => {
        // Mudou a quantidade da linha → ajusta a distância dela automaticamente
        const aplicarQtd = () => {
            const n = parseInt(inpQ(i).value, 10);
            if (isNaN(n) || n < 1) { mostrarLinha(i); return; }
            definirQtd(i, n);
            mostrarLinha(i);
            atualizar();
        };
        inpQ(i).addEventListener('change', aplicarQtd);
        inpQ(i).addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); aplicarQtd(); } });
        // Mudou a distância da linha → recalcula a quantidade dela na hora
        inpD(i).addEventListener('input', () => {
            const d = parseFloat(inpD(i).value);
            if (isNaN(d) || d <= 0) return;
            definirDist(i, d);
            inpQ(i).value = estado[i].n;
            atualizar();
        });
        mostrarLinha(i);
    });

    const aplicarTodas = () => {
        const n = parseInt(div.querySelector('#iaLinTodas').value, 10);
        if (isNaN(n) || n < 1) { showToast('Quantidade inválida', 'Informe um número inteiro maior que zero.', 'warning'); return; }
        segmentos.forEach((_, i) => { definirQtd(i, n); mostrarLinha(i); });
        atualizar();
    };
    div.querySelector('#iaLinTodasBtn').addEventListener('click', aplicarTodas);
    div.querySelector('#iaLinTodas').addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); aplicarTodas(); } });
    atualizar();

    div.querySelector('#iaLinCancelar').addEventListener('click', () => {
        limparPreviewLinhas();
        div.remove();
        escreverMensagemUser('Cancelar');
        escreverMensagemIA('Tudo bem! Continue cadastrando manualmente.');
        limparSetorIA();
        iaPendencia = null;
        _iaJaDisparou = false;
    });

    div.querySelector('#iaLinCriar').addEventListener('click', () => {
        const { posicoes } = calcular();
        if (!posicoes.length) { showToast('Nada a criar', 'Nenhuma posição livre nas linhas.', 'warning'); return; }
        if (posicoes.length > 2000) { showToast('Limite excedido', `${posicoes.length} casas passam do máximo de 2000.`, 'warning'); return; }
        const reiniciar = !!div.querySelector('#iaLinReiniciar')?.checked;
        limparPreviewLinhas();
        div.remove();
        escreverMensagemUser(`${segmentos.length} linha(s), ${posicoes.length} casas`);
        gerarSequenciaIA(posicoes.length, posicoes, { reiniciar });
    });
}

// ============================================
// IA — DETECÇÃO DE PADRÕES
// ============================================
function detectarPadroes(manual) {
    const janela = manual ? 5 : _iaJanela;
    _iaJanela = 5;

    const apenas1Uc = (surveysMemoria || []).filter(s => !s.multiUc);
    if (apenas1Uc.length < 5) {
        escreverMensagemIA(
            `Olá! Eu sou a <strong>IA Logictel</strong>.<br><br>
            Para detectar padrões, preciso de pelo menos <strong>5 surveys</strong> cadastrados.
            Você tem <strong>${apenas1Uc.length}</strong> até agora.<br><br>
            Cadastre mais alguns e clique em <strong>🔍 Detectar Padrões</strong> novamente.`
        );
        return;
    }

    const lista = [...apenas1Uc].sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
    );

    const padrao = encontrarPadrao(lista, janela);

    if (!padrao) {
        const grupos = {};
        lista.forEach(s => {
            const key = (s.logradouro && s.logradouro.rua) ? s.logradouro.rua.toUpperCase() : '—';
            if (!grupos[key]) grupos[key] = [];
            grupos[key].push(s);
        });

        let grupo = null;
        for (const k in grupos) if (grupos[k].length >= janela) { grupo = grupos[k]; break; }

        if (grupo) {
            iaPendencia = {
                tipo: 'generico',
                quantidade: grupo.length,
                descricao: 'registros no mesmo logradouro',
                enderecoResumo: `${grupo[0].logradouro.tipo || ''} ${grupo[0].logradouro.rua}, ${grupo[0].logradouro.bairro || ''}`.trim(),
                campo: null,
                ultimoValor: null,
                delta: null,
                ultimos: grupo.slice(-janela)
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
            Para eu detectar, os ${janela} últimos precisam ter:
            <ul style="margin:8px 0 8px 16px;font-size:0.8rem;">
                <li>Mesmo logradouro e mesma fachada; ou</li>
                <li>Mesmo logradouro e mesma combinação de complementos fixos, com <strong>1 valor incrementando</strong> (1,2,3,4,5...).</li>
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
// Escolha do layout quando a verificação foi expandida (mais de 5 surveys analisados)
function perguntarQuantidade() {
    if (!iaPendencia) return;
    if (_iaSetor && _iaSetor.linhas) {
        perguntarLinhas(analisarGeometriaIA(iaPendencia.ultimos || []));
        return;
    }
    const g = (iaPendencia.ultimos || []).length > 5 ? analisarGeometriaIA(iaPendencia.ultimos) : null;
    if (!g) { perguntarQuantidadeLinha(); return; }

    const div = document.createElement('div');
    div.className = 'ia-msg ia-msg-ia';
    div.innerHTML = `
        Como devo distribuir os novos surveys no mapa?
        <div class="ia-msg-actions">
            <button class="ia-btn ia-btn-secondary" id="iaLayoutLinha" type="button">Em linha</button>
            <button class="ia-btn ia-btn-success" id="iaLayoutFileiras" type="button">Em fileiras (condomínio)</button>
        </div>`;
    iaChatBody.appendChild(div);
    iaChatBody.scrollTop = iaChatBody.scrollHeight;

    document.getElementById('iaLayoutLinha').addEventListener('click', () => {
        div.remove(); escreverMensagemUser('Em linha'); perguntarQuantidadeLinha();
    });
    document.getElementById('iaLayoutFileiras').addEventListener('click', () => {
        div.remove(); escreverMensagemUser('Em fileiras'); perguntarFileiras(g);
    });
}

function perguntarFileiras(g) {
    const passo = Math.hypot(g.stepX, g.stepY);
    const div = document.createElement('div');
    div.className = 'ia-msg ia-msg-ia';
    div.innerHTML = `
        Detectei uma fileira de <strong>${g.k} casas</strong> com ~<strong>${passo.toFixed(1)} m</strong> entre elas.<br>
        <small style="color:var(--text-tertiary)">As fileiras novas seguem o mesmo sentido e espaçamento.</small>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;font-size:0.8rem;">
            <label>Casas por fileira<input type="number" id="iaFilPor" min="${g.k}" value="${Math.max(g.k, 20)}" style="width:100%"></label>
            <label>Fileiras novas<input type="number" id="iaFilQtd" min="0" value="1" style="width:100%"></label>
            <label>Distância entre fileiras (m)<input type="number" id="iaFilDist" min="1" step="0.5" value="${(passo * 2).toFixed(1)}" style="width:100%"></label>
            <label>Lado das novas fileiras<select id="iaFilLado" style="width:100%"><option value="esq">Esquerda</option><option value="dir">Direita</option></select></label>
        </div>
        <div class="ia-msg-actions" style="margin-top:8px;"><button class="ia-btn ia-btn-success" id="iaFilCriar" type="button">Criar</button></div>`;
    iaChatBody.appendChild(div);
    iaChatBody.scrollTop = iaChatBody.scrollHeight;

    document.getElementById('iaFilCriar').addEventListener('click', () => {
        const por = parseInt(document.getElementById('iaFilPor').value, 10);
        const qtd = parseInt(document.getElementById('iaFilQtd').value, 10);
        const dist = parseFloat(document.getElementById('iaFilDist').value);
        const lado = document.getElementById('iaFilLado').value;
        if (isNaN(por) || por < g.k || isNaN(qtd) || qtd < 0 || isNaN(dist) || dist <= 0) {
            showToast('Valores inválidos', `Casas por fileira deve ser ≥ ${g.k}, fileiras ≥ 0 e distância > 0.`, 'warning');
            return;
        }
        const posicoes = [];
        const u = { x: g.stepX, y: g.stepY };
        const s = Math.hypot(u.x, u.y);
        const uh = { x: u.x / s, y: u.y / s };
        const vh = lado === 'esq' ? { x: -uh.y, y: uh.x } : { x: uh.y, y: -uh.x };
        const pt = (dx, dy) => ({ lat: g.origemLat + dy / g.my, lng: g.origemLng + dx / g.mx });
        for (let j = g.k; j < por; j++) posicoes.push(pt(j * u.x, j * u.y));            // completa a fileira atual
        for (let r = 1; r <= qtd; r++) {
            for (let j = 0; j < por; j++) {
                posicoes.push(pt(r * dist * vh.x + j * u.x, r * dist * vh.y + j * u.y));
            }
        }
        if (!posicoes.length) { showToast('Nada a criar', 'Aumente as casas por fileira ou as fileiras.', 'warning'); return; }
        if (posicoes.length > 2000) { showToast('Limite excedido', 'O máximo é 2000 casas por vez.', 'warning'); return; }
        div.remove();
        escreverMensagemUser(`${por} por fileira, ${qtd} fileira(s) nova(s), ${dist} m, lado ${lado === 'esq' ? 'esquerdo' : 'direito'}`);
        gerarSequenciaIA(posicoes.length, posicoes);
    });
}

function perguntarQuantidadeLinha() {
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
function encontrarPadrao(lista, janela = 5) {
    if (lista.length < janela) return null;

    const ultimos = lista.slice(-janela);
    if (ultimos.length < janela) return null;

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
                quantidade: janela,
                descricao: 'fachadas',
                enderecoResumo: `${l0.tipo || ''} ${l0.rua}, ${l0.bairro || ''}`.trim(),
                campo: 'numero',
                ultimoValor: numeros[numeros.length - 1],
                delta: d1,
                ultimos: ultimos
            };
        }
    }

    // últimos só com fachada SN (sem pisos/complementos): cria tudo como SN
    const soSN = ultimos.every(s =>
        String(s.numero || '').trim().toUpperCase() === 'SN' &&
        !s.pisos &&
        !(s.complementos || []).some(c => c && (c.tipo || c.valor))
    );
    if (soSN) {
        return {
            tipo: 'sn',
            quantidade: janela,
            descricao: 'fachadas SN',
            enderecoResumo: `${l0.tipo || ''} ${l0.rua}, ${l0.bairro || ''}`.trim(),
            campo: 'numero',
            ultimoValor: null,
            delta: null,
            ultimos: ultimos
        };
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
            quantidade: janela,
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
// Lê a geometria dos surveys analisados: passo mediano e fileira atual (trecho final alinhado)
function analisarGeometriaIA(ultimos) {
    const ll = (s) => {
        const lat = s.latitude != null ? Number(s.latitude) : (s.logradouro && s.logradouro.lat);
        const lng = s.longitude != null ? Number(s.longitude) : (s.logradouro && s.logradouro.lng);
        return (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) ? { lat: Number(lat), lng: Number(lng) } : null;
    };
    const pts = ultimos.map(ll).filter(Boolean);
    if (pts.length < 3) return null;

    const mx = 111320 * Math.cos(pts[pts.length - 1].lat * Math.PI / 180), my = 110540;
    const xy = pts.map(p => ({ x: p.lng * mx, y: p.lat * my }));
    const steps = [];
    for (let i = 1; i < xy.length; i++) steps.push({ x: xy[i].x - xy[i - 1].x, y: xy[i].y - xy[i - 1].y });

    const mediana = (arr) => { const a = [...arr].sort((p, q) => p - q); const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
    let med = { x: mediana(steps.map(t => t.x)), y: mediana(steps.map(t => t.y)) };
    let sm = Math.hypot(med.x, med.y);
    if (sm < 0.5) return null;

    const conforme = (t, ref, sref) => {
        const l = Math.hypot(t.x, t.y);
        if (l < 0.4 * sref || l > 2.5 * sref) return false;
        return (t.x * ref.x + t.y * ref.y) / (l * sref) >= 0.82; // até ~35°
    };

    // trecho final (fileira atual): passos alinhados ao passo mediano
    let n = 0;
    for (let i = steps.length - 1; i >= 0 && conforme(steps[i], med, sm); i--) n++;
    if (n < 2) return null;
    const run = steps.slice(steps.length - n);
    const step = { x: mediana(run.map(t => t.x)), y: mediana(run.map(t => t.y)) };
    const k = n + 1;
    const origem = pts[pts.length - k];
    const ult = pts[pts.length - 1];
    return { stepX: step.x, stepY: step.y, k, origemLat: origem.lat, origemLng: origem.lng, ultLat: ult.lat, ultLng: ult.lng, mx, my };
}

function gerarSequenciaIA(quantidade, posicoes, opts = {}) {
    if (!iaPendencia) return;

    const pad = iaPendencia;
    const ultimos = pad.ultimos;

    // Os novos surveys herdam o último; se ele não tem zona, pergunta antes de criar
    const baseSv = ultimos && ultimos[ultimos.length - 1];
    if (!opts._zona && baseSv && !(baseSv.zona && String(baseSv.zona).trim())) {
        pedirZonaIA(
            `Qual a <strong>zona</strong> dos <strong>${quantidade} survey(s)</strong> que vou criar?`,
            (zona) => gerarSequenciaIA(quantidade, posicoes, { ...opts, _zona: zona }),
            () => {
                escreverMensagemIA('Tudo bem! Não criei nada.', 300);
                iaPendencia = null;
                limparSetorIA();
                _iaJaDisparou = false;
            }
        );
        return;
    }

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
    // Passo mais confiável (mediana da fileira atual) quando há surveys espalhados
    const geo = ultimos.length > 5 ? analisarGeometriaIA(ultimos) : null;
    if (geo) {
        deltaLat = geo.stepY / geo.my;
        deltaLng = geo.stepX / geo.mx;
    }

    const ultimoSurvey = ultimos[ultimos.length - 1];
    const ultLat = ultimoSurvey.latitude != null ? Number(ultimoSurvey.latitude) : (ultimoSurvey.logradouro && ultimoSurvey.logradouro.lat);
    const ultLng = ultimoSurvey.longitude != null ? Number(ultimoSurvey.longitude) : (ultimoSurvey.logradouro && ultimoSurvey.logradouro.lng);

    let criados = 0;

    for (let i = 1; i <= quantidade; i++) {
        // numeração: contínua entre as linhas, ou reiniciada em cada linha (opts.reiniciar)
        const idx = (opts.reiniciar && posicoes && posicoes[i - 1].ordem) ? posicoes[i - 1].ordem : i;
        const novo = JSON.parse(JSON.stringify(ultimoSurvey));
        novo._id = 'ia_' + (++_surveyIdSeq);
        novo._ia = true;
        if (posicoes && posicoes[i - 1].cor) novo._cor = posicoes[i - 1].cor; else delete novo._cor;
        novo.created_at = new Date().toISOString();
        if (opts._zona) novo.zona = opts._zona;

        if (pad.tipo === 'fachada') {
            novo.numero = String(pad.ultimoValor + pad.delta * idx);
        } else if (pad.tipo === 'complemento') {
            const comp = novo.complementos[pad.compIndex];
            if (comp) {
                const prefixo = String(comp.valor).replace(/\d+$/, '');
                comp.valor = prefixo + String(pad.ultimoValor + pad.delta * idx);
            }
        }

        if (posicoes) {
            novo.latitude = +posicoes[i - 1].lat.toFixed(8);
            novo.longitude = +posicoes[i - 1].lng.toFixed(8);
        } else if (ultLat != null && ultLng != null && (deltaLat !== 0 || deltaLng !== 0)) {
            novo.latitude = +(ultLat + deltaLat * i).toFixed(8);
            novo.longitude = +(ultLng + deltaLng * i).toFixed(8);
        }

        surveysMemoria.push(novo);
        criados++;
    }

    renderizarSurveys();
    expandirCard('listPanel');

    escreverMensagemIA(
        `✅ Pronto! Criei <strong>${criados} novos surveys</strong>${pad.tipo === 'sn' ? ' como <strong>SN</strong>' : ' continuando o padrão'}.<br><br>
        Eles aparecem na lista com <strong>fundo verde</strong> e a etiqueta <strong>🤖 IA</strong> para você diferenciar.${posicoes && posicoes.some(p => p.cor) ? '<br>Cada linha ficou com uma <strong>cor própria</strong> no mapa.' : ''}`
    );

    iaPendencia = null;
    limparSetorIA();

    // libera a IA para um novo ciclo: os próximos 5 surveys cadastrados voltam a acioná-la
    _iaCorte = surveysMemoria.length;
    _iaJaDisparou = false;
    _iaMeta = 0;
}

// ============================================
// LEITOR DE ZIP (SOMENTE LEITURA)
// Carrega um ZIP já exportado e mostra os surveys no mapa e em uma lista.
// Não mexe na lista de surveys em edição, não permite editar, excluir nem exportar.
// ============================================
(function leitorZip() {
    const btn = document.getElementById('zipViewBtn');
    const input = document.getElementById('zipViewInput');
    const painel = document.getElementById('zipViewPanel');
    if (!btn || !input || !painel) return;

    const elTitulo = document.getElementById('zipViewTitle');
    const elResumo = document.getElementById('zipViewSummary');
    const elLista = document.getElementById('zipViewList');
    const COR_LEITURA = '#475569';

    let camada = null;
    let marcadores = [];

    // id -> nome (a partir das mesmas tabelas usadas na exportação)
    const mapaId = (lista) => { const m = {}; lista.forEach(([n, id]) => { if (!(String(id) in m)) m[String(id)] = n; }); return m; };
    const NOME_COMPLEMENTO = mapaId(COMPLEMENTO_LISTA);
    const NOME_TIPO_IMOVEL = mapaId(TIPO_IMOVEL_LISTA);

    const txt = (el, sel) => {
        const n = el.querySelector(sel);
        return n ? (n.textContent || '').trim() : '';
    };

    function lerXmlEdificio(xmlTexto, origem) {
        const doc = new DOMParser().parseFromString(xmlTexto, 'application/xml');
        if (doc.querySelector('parsererror')) return null;
        const ed = doc.documentElement;
        if (!ed) return null;

        const end = ed.querySelector('enderecoEdificio') || ed;
        const lat = parseFloat(txt(ed, 'coordY').replace(',', '.'));
        const lng = parseFloat(txt(ed, 'coordX').replace(',', '.'));

        const comps = [];
        for (let i = 1; i <= 10; i++) {
            const id = txt(end, 'id_complemento' + i);
            const arg = txt(end, 'argumento' + i);
            if (!id && !arg) continue;
            comps.push({ tipo: NOME_COMPLEMENTO[id] || (id ? 'ID ' + id : ''), valor: arg });
        }
        const idTipo = txt(end, 'id_tipo_imovel');

        return {
            origem,
            idCE: parseInt(txt(ed, 'idCEMobile'), 10),
            lat: isNaN(lat) ? null : lat,
            lng: isNaN(lng) ? null : lng,
            logradouro: txt(end, 'logradouro'),
            numero: txt(end, 'numero_fachada'),
            bairro: txt(end, 'bairro'),
            cep: txt(end, 'cep'),
            localidade: txt(ed, 'localidade'),
            zona: txt(ed, 'nomeZona') || txt(ed, 'codigoZona'),
            tipoImovel: idTipo ? (NOME_TIPO_IMOVEL[idTipo] || 'ID ' + idTipo) : '',
            imovel: txt(end, 'arg_imovel'),
            pisos: txt(ed, 'numPisos'),
            obs: txt(ed, 'observacoes'),
            data: txt(ed, 'data'),
            complementos: comps
        };
    }

    const rotulo = (v) => {
        const comps = v.complementos.map(c => [c.tipo, c.valor].filter(Boolean).join(' ')).filter(Boolean);
        return [v.numero, comps.length ? `(${comps.join(', ')})` : ''].filter(Boolean).join(' - ');
    };

    const popupHtml = (v) => {
        const linhas = [];
        linhas.push(`<strong>${escapeHtml(v.logradouro)}${rotulo(v) ? ', ' + escapeHtml(rotulo(v)) : ''}</strong>`);
        const det = [];
        if (v.tipoImovel) det.push('Tipo: ' + escapeHtml(v.tipoImovel) + (v.imovel ? ' ' + escapeHtml(v.imovel) : ''));
        if (v.zona) det.push('Zona: ' + escapeHtml(v.zona));
        if (v.pisos) det.push('Pisos: ' + escapeHtml(v.pisos));
        if (v.bairro) det.push(escapeHtml(v.bairro));
        if (v.obs) det.push('Obs.: ' + escapeHtml(v.obs));
        if (det.length) linhas.push('<span style="font-size:0.8rem">' + det.join('<br>') + '</span>');
        return linhas.join('<br>');
    };

    function limpar() {
        marcadores.forEach(m => map.removeLayer(m));
        marcadores = [];
        if (camada) { map.removeLayer(camada); camada = null; }
        elLista.innerHTML = '';
    }

    function fechar() {
        limpar();
        painel.hidden = true;
    }

    function mostrar(itens, nomesArquivos) {
        limpar();
        // ordem em que foram cadastrados: pelo idCEMobile (= nº da moradia); desempate pela ordem do arquivo
        itens.sort((a, b) => (a.idCE || 0) - (b.idCE || 0));

        elTitulo.textContent = nomesArquivos.length === 1 ? nomesArquivos[0] : `${nomesArquivos.length} arquivos ZIP`;
        const semCoord = itens.filter(v => v.lat == null || v.lng == null).length;
        elResumo.textContent = `${itens.length} survey(s) • somente leitura` + (semCoord ? ` • ${semCoord} sem coordenadas` : '');

        camada = L.layerGroup().addTo(map);
        const pontos = [];

        itens.forEach((v, i) => {
            const li = document.createElement('li');
            li.className = 'zip-view-item';
            li.innerHTML = `<span class="zip-view-n">${i + 1}</span>
                <span class="zip-view-txt"><strong>${escapeHtml(v.logradouro || '—')}</strong>
                <small>${escapeHtml(rotulo(v) || 'SN')}</small></span>`;
            elLista.appendChild(li);

            if (v.lat == null || v.lng == null) { li.classList.add('sem-coord'); return; }
            const m = L.marker([v.lat, v.lng], { icon: iconeCasaCor(COR_LEITURA), draggable: false }).addTo(camada);
            m.bindPopup(popupHtml(v));
            marcadores.push(m);
            pontos.push([v.lat, v.lng]);
            li.addEventListener('click', () => {
                map.setView([v.lat, v.lng], Math.max(map.getZoom(), 19));
                m.openPopup();
            });
        });

        painel.hidden = false;
        if (pontos.length) map.fitBounds(L.latLngBounds(pontos), { padding: [40, 40], maxZoom: 19 });
    }

    async function carregar(files) {
        if (typeof JSZip === 'undefined') { showToast('Erro', 'JSZip não carregado.', 'error'); return; }
        const itens = [];
        const nomes = [];
        try {
            for (const f of files) {
                const zip = await JSZip.loadAsync(f);
                const xmls = Object.keys(zip.files).filter(n => !zip.files[n].dir && /\.xml$/i.test(n));
                let lidos = 0;
                for (const nome of xmls) {
                    const t = await zip.files[nome].async('string');
                    const v = lerXmlEdificio(t.replace(/^\uFEFF/, ''), f.name);
                    if (v && v.logradouro !== undefined && (v.lat != null || v.logradouro || v.numero)) { itens.push(v); lidos++; }
                }
                if (lidos) nomes.push(f.name);
            }
        } catch (err) {
            console.error(err);
            showToast('Erro ao ler o ZIP', 'O arquivo não parece ser um ZIP válido.', 'error', 6000);
            return;
        }
        if (!itens.length) {
            showToast('Nada encontrado', 'Não achei surveys (moradiaN.xml) dentro do ZIP.', 'warning', 5000);
            return;
        }
        mostrar(itens, nomes);
        showToast('ZIP carregado', `${itens.length} survey(s) em modo somente leitura.`, 'success', 3500);
    }

    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
        const files = Array.from(input.files || []);
        input.value = '';              // permite reabrir o mesmo arquivo depois
        if (files.length) carregar(files);
    });
    document.getElementById('zipViewClose')?.addEventListener('click', fechar);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !painel.hidden) fechar(); });
})();

// ============================================
// MUB — MAPA URBANO BÁSICO COMO CAMADA
// Aceita:
//  • arquivo .mbtiles (GEORREFERENCIADO): é lido direto no navegador (sql.js) e aparece no lugar certo, sem ajuste.
//  • imagem PNG/JPG/WEBP (sem georreferência): dimensionada por escala/DPI e posicionada com a alça ✥.
// O arquivo fica salvo neste navegador (IndexedDB), então não precisa subir de novo.
// ============================================
(function modulMub() {
    const input = document.getElementById('mubFileInput');
    if (!input) return;

    const DB_NOME = 'cadastro_roteiro', DB_STORE = 'kv', CHAVE = 'mub';
    const ESCALA_PADRAO = 4224;
    const DPI_PADRAO = 96;

    // ---------- armazenamento local ----------
    const abrirDb = () => new Promise((ok, erro) => {
        if (!window.indexedDB) { erro(new Error('IndexedDB indisponível')); return; }
        const r = indexedDB.open(DB_NOME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(DB_STORE);
        r.onsuccess = () => ok(r.result);
        r.onerror = () => erro(r.error);
    });
    const dbOp = async (modo, fn) => {
        const db = await abrirDb();
        return new Promise((ok, erro) => {
            const tx = db.transaction(DB_STORE, modo);
            const req = fn(tx.objectStore(DB_STORE));
            tx.oncomplete = () => ok(req ? req.result : undefined);
            tx.onerror = () => erro(tx.error);
        });
    };
    const salvarDb = (v) => dbOp('readwrite', s => s.put(v, CHAVE));
    const lerDb = () => dbOp('readonly', s => s.get(CHAVE));
    const apagarDb = () => dbOp('readwrite', s => s.delete(CHAVE));

    // ---------- estado ----------
    let st = null;        // { tipo:'mbtiles'|'imagem', blob, nome, opacity, ... }
    let mb = null;        // MBTiles aberto: { db, stmt, minzoom, maxzoom, bounds, mime, tms }
    let overlay = null, alca = null, controle = null, urlImg = null, ativo = false;

    const persistir = () => { if (st) salvarDb(st).catch(e => console.warn('[MUB] não foi possível salvar:', e)); };

    // ---------- MBTiles (sql.js) ----------
    let _sqlPromise = null;
    function carregarSqlJs() {
        if (_sqlPromise) return _sqlPromise;
        const bases = ['https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/', 'https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/'];
        _sqlPromise = (async () => {
            for (const b of bases) {
                try {
                    if (!window.initSqlJs) {
                        await new Promise((ok, er) => {
                            const sc = document.createElement('script');
                            sc.src = b + 'sql-wasm.js';
                            sc.onload = ok; sc.onerror = () => er(new Error('falha ao baixar ' + b));
                            document.head.appendChild(sc);
                        });
                    }
                    return await window.initSqlJs({ locateFile: f => b + f });
                } catch (e) { console.warn('[MUB] sql.js:', e); }
            }
            throw new Error('Não consegui carregar o leitor de MBTiles (sql.js). Verifique a internet e tente de novo.');
        })();
        _sqlPromise.catch(() => { _sqlPromise = null; });
        return _sqlPromise;
    }

    async function abrirMbtiles(blob) {
        const SQL = await carregarSqlJs();
        const db = new SQL.Database(new Uint8Array(await blob.arrayBuffer()));
        const meta = {};
        try {
            const r = db.exec('SELECT name, value FROM metadata');
            if (r[0]) r[0].values.forEach(([k, v]) => { meta[k] = v; });
        } catch (e) { /* sem tabela metadata */ }
        let zr;
        try { zr = db.exec('SELECT MIN(zoom_level), MAX(zoom_level), COUNT(*) FROM tiles')[0].values[0]; }
        catch (e) { db.close(); throw new Error('Este arquivo não parece ser um MBTiles válido.'); }
        if (!zr || !zr[2]) { db.close(); throw new Error('O MBTiles não contém nenhum tile.'); }

        let bounds = null;
        if (meta.bounds) {
            const p = String(meta.bounds).split(',').map(Number);
            if (p.length === 4 && p.every(isFinite)) bounds = L.latLngBounds([p[1], p[0]], [p[3], p[2]]);   // w,s,e,n
        }
        const fmt = String(meta.format || 'png').toLowerCase();
        const mime = fmt === 'jpg' || fmt === 'jpeg' ? 'image/jpeg' : (fmt === 'webp' ? 'image/webp' : 'image/png');
        return {
            db,
            stmt: db.prepare('SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?'),
            minzoom: meta.minzoom != null ? parseInt(meta.minzoom, 10) : zr[0],
            maxzoom: meta.maxzoom != null ? parseInt(meta.maxzoom, 10) : zr[1],
            bounds, mime,
            tms: String(meta.scheme || 'tms').toLowerCase() !== 'xyz',
            nome: meta.name || ''
        };
    }
    function fecharMbtiles() {
        if (mb) { try { mb.stmt.free(); mb.db.close(); } catch (e) { /* ok */ } mb = null; }
    }

    function criarCamadaMbtiles() {
        const dados = mb;
        const Camada = L.GridLayer.extend({
            createTile(coords, done) {
                const img = document.createElement('img');
                img.alt = '';
                const y = dados.tms ? (Math.pow(2, coords.z) - 1 - coords.y) : coords.y;
                let bytes = null;
                try {
                    dados.stmt.bind([coords.z, coords.x, y]);
                    if (dados.stmt.step()) bytes = dados.stmt.get()[0];
                    dados.stmt.reset();
                } catch (e) { console.warn('[MUB] tile', e); }
                if (!bytes) { setTimeout(() => done(null, img), 0); return img; }
                const u = URL.createObjectURL(new Blob([bytes], { type: dados.mime }));
                img.onload = () => { URL.revokeObjectURL(u); done(null, img); };
                img.onerror = () => { URL.revokeObjectURL(u); done(null, img); };
                img.src = u;
                return img;
            }
        });
        return new Camada({
            tileSize: 256,
            minZoom: Math.max(3, dados.minzoom),          // abaixo disso não há tiles
            minNativeZoom: dados.minzoom,
            maxNativeZoom: dados.maxzoom,                  // acima disso, amplia o último nível
            maxZoom: 22,
            bounds: dados.bounds || undefined,
            opacity: st.opacity,
            attribution: 'MUB'
        });
    }

    // ---------- imagem simples (sem georreferência) ----------
    function limites() {
        const wM = st.w / st.dpi * 0.0254 * st.escala;
        const hM = st.h / st.dpi * 0.0254 * st.escala;
        const dLat = (hM / 2) / 110540;
        const dLng = (wM / 2) / (111320 * Math.cos(st.lat * Math.PI / 180));
        return L.latLngBounds([st.lat - dLat, st.lng - dLng], [st.lat + dLat, st.lng + dLng]);
    }
    function reposicionar() {
        if (st.tipo !== 'imagem') return;
        if (overlay) overlay.setBounds(limites());
        if (alca) alca.setLatLng([st.lat, st.lng]);
    }

    function montar() {
        if (overlay) { if (map.hasLayer(overlay)) map.removeLayer(overlay); overlay = null; }
        if (urlImg) { URL.revokeObjectURL(urlImg); urlImg = null; }
        if (!st) return;
        if (st.tipo === 'mbtiles') {
            overlay = criarCamadaMbtiles();
        } else {
            urlImg = URL.createObjectURL(st.blob);
            overlay = L.imageOverlay(urlImg, limites(), { opacity: st.opacity, interactive: false });
        }
        if (ativo) overlay.addTo(map);
    }

    function removerAlca() { if (alca) { map.removeLayer(alca); alca = null; } }
    function mostrarAlca() {
        removerAlca();
        if (!ativo || !st || st.tipo !== 'imagem' || st.travado) return;
        alca = L.marker([st.lat, st.lng], {
            draggable: true, zIndexOffset: 3000, title: 'Arraste para mover o MUB',
            icon: L.divIcon({ className: 'mub-handle', html: '✥', iconSize: [30, 30], iconAnchor: [15, 15] })
        }).addTo(map);
        alca.on('drag', () => {
            const p = alca.getLatLng();
            st.lat = p.lat; st.lng = p.lng;
            if (overlay) overlay.setBounds(limites());
        });
        alca.on('dragend', persistir);
    }

    // ---------- painel de controle ----------
    function criarControle() {
        const mbt = st.tipo === 'mbtiles';
        const C = L.Control.extend({
            options: { position: 'topright' },
            onAdd() {
                const div = L.DomUtil.create('div', 'mub-ctrl');
                div.innerHTML = mbt ? `
                    <div class="mub-ctrl-title">MUB <small>georreferenciado</small></div>
                    <label>Transparência
                        <input type="range" id="mubOp" min="10" max="100" value="${Math.round(st.opacity * 100)}">
                    </label>
                    <small class="mub-arq" title="${escapeHtml(st.nome || '')}">${escapeHtml(st.nome || '')}</small>
                    <small>Visível do zoom ${mb ? mb.minzoom : '?'} ao ${mb ? mb.maxzoom : '?'} (acima disso é ampliado).</small>
                    <div class="mub-row" style="margin-top:6px">
                        <button type="button" id="mubIr">Ir para o MUB</button>
                        <button type="button" id="mubTroca">Trocar arquivo</button>
                        <button type="button" id="mubRem">Remover</button>
                    </div>` : `
                    <div class="mub-ctrl-title">MUB <small>imagem</small></div>
                    <label>Transparência
                        <input type="range" id="mubOp" min="10" max="100" value="${Math.round(st.opacity * 100)}">
                    </label>
                    <div class="mub-row">
                        <label>Escala 1:<input type="number" id="mubEsc" min="1" step="1" value="${st.escala}"></label>
                        <label>DPI<input type="number" id="mubDpi" min="10" max="1200" step="1" value="${Math.round(st.dpi)}"></label>
                    </div>
                    <label class="mub-chk"><input type="checkbox" id="mubTrav" ${st.travado ? 'checked' : ''}> Travar posição</label>
                    <div class="mub-row">
                        <button type="button" id="mubCentro">Centralizar aqui</button>
                        <button type="button" id="mubTroca">Trocar arquivo</button>
                        <button type="button" id="mubRem">Remover</button>
                    </div>
                    <small>Arraste a alça ✥ para posicionar o MUB sobre o mapa.</small>`;
                // cabeçalho com botão de minimizar; o restante do painel vai para o "corpo"
                const titulo = div.querySelector('.mub-ctrl-title');
                const corpo = L.DomUtil.create('div', 'mub-body');
                Array.from(div.children).forEach(ch => { if (ch !== titulo) corpo.appendChild(ch); });
                const cab = L.DomUtil.create('div', 'mub-head');
                const btnMin = L.DomUtil.create('button', 'mub-min-btn');
                btnMin.type = 'button';
                cab.appendChild(titulo);
                cab.appendChild(btnMin);
                div.appendChild(cab);
                div.appendChild(corpo);
                const aplicarMin = (min) => {
                    div.classList.toggle('mub-minimizado', min);
                    btnMin.textContent = min ? '▢' : '–';
                    btnMin.title = min ? 'Restaurar painel do MUB' : 'Minimizar painel do MUB';
                    btnMin.setAttribute('aria-label', btnMin.title);
                    localStorage.setItem('mubMinimizado', min ? '1' : '0');
                };
                btnMin.addEventListener('click', () => aplicarMin(!div.classList.contains('mub-minimizado')));
                aplicarMin(localStorage.getItem('mubMinimizado') === '1');

                L.DomEvent.disableClickPropagation(div);
                L.DomEvent.disableScrollPropagation(div);

                div.querySelector('#mubOp').addEventListener('input', (e) => {
                    st.opacity = Math.max(0.1, Math.min(1, e.target.value / 100));
                    if (overlay) overlay.setOpacity(st.opacity);
                });
                div.querySelector('#mubOp').addEventListener('change', persistir);
                div.querySelector('#mubTroca').addEventListener('click', () => input.click());
                div.querySelector('#mubRem').addEventListener('click', remover);

                if (mbt) {
                    div.querySelector('#mubIr').addEventListener('click', () => {
                        if (mb && mb.bounds) map.fitBounds(mb.bounds, { padding: [30, 30], maxZoom: mb.maxzoom });
                    });
                } else {
                    const num = (id, campo, min, max) => div.querySelector(id).addEventListener('change', (e) => {
                        const v = parseFloat(e.target.value);
                        if (isNaN(v) || v < min || v > max) { e.target.value = Math.round(st[campo]); return; }
                        st[campo] = v; reposicionar(); persistir();
                    });
                    num('#mubEsc', 'escala', 1, 1000000);
                    num('#mubDpi', 'dpi', 10, 1200);
                    div.querySelector('#mubTrav').addEventListener('change', (e) => {
                        st.travado = e.target.checked; mostrarAlca(); persistir();
                    });
                    div.querySelector('#mubCentro').addEventListener('click', () => {
                        const c = map.getCenter(); st.lat = c.lat; st.lng = c.lng; reposicionar(); persistir();
                    });
                }
                return div;
            }
        });
        controle = new C();
        controle.addTo(map);
    }
    function removerControle() { if (controle) { controle.remove(); controle = null; } }

    function ativar() {
        ativo = true;
        if (!st) return;
        if (overlay && !map.hasLayer(overlay)) overlay.addTo(map);
        mostrarAlca();
        removerControle();
        criarControle();
    }
    function desativar() {
        ativo = false;
        removerAlca();
        removerControle();
        if (overlay && map.hasLayer(overlay)) map.removeLayer(overlay);
    }
    async function remover() {
        if (!confirm('Remover o MUB deste navegador?')) return;
        const eraAtivo = ativo;
        desativar();
        overlay = null;
        if (urlImg) { URL.revokeObjectURL(urlImg); urlImg = null; }
        fecharMbtiles();
        st = null;
        try { await apagarDb(); } catch (e) { console.warn(e); }
        if (eraAtivo) ativarCamadaMapa('map');
        showToast('MUB removido', 'O arquivo foi removido deste navegador.', 'success', 2500);
    }

    // DPI gravado na própria imagem (PNG pHYs / JPEG JFIF), se existir
    function detectarDpi(buf) {
        try {
            const b = new Uint8Array(buf.slice(0, 65536));
            const dv = new DataView(b.buffer);
            if (b[0] === 0x89 && b[1] === 0x50) {
                for (let i = 8; i < b.length - 16; i++) {
                    if (b[i] === 0x70 && b[i + 1] === 0x48 && b[i + 2] === 0x59 && b[i + 3] === 0x73) {
                        const ppm = dv.getUint32(i + 4);
                        if (b[i + 12] === 1 && ppm > 0) return ppm * 0.0254;
                    }
                }
            } else if (b[0] === 0xFF && b[1] === 0xD8 && b[6] === 0x4A && b[7] === 0x46) {
                const un = b[13], x = dv.getUint16(14);
                if (x > 0 && un === 1) return x;
                if (x > 0 && un === 2) return x * 2.54;
            }
        } catch (e) { /* ignora */ }
        return null;
    }
    const lerDimensoes = (blob) => new Promise((ok, erro) => {
        const u = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { ok({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(u); };
        img.onerror = () => { erro(new Error('Não consegui abrir a imagem.')); URL.revokeObjectURL(u); };
        img.src = u;
    });

    async function carregarMbtiles(file) {
        showToast('Lendo o MUB...', 'Abrindo o arquivo MBTiles.', 'info', 2500);
        const novo = await abrirMbtiles(file);
        fecharMbtiles();
        mb = novo;
        st = { tipo: 'mbtiles', blob: file, nome: file.name, opacity: st ? st.opacity : 0.85 };
        montar();
        persistir();
        if (camadaAtual !== 'mub') ativarCamadaMapa('mub');
        else { removerControle(); criarControle(); }
        if (mb.bounds) map.fitBounds(mb.bounds, { padding: [30, 30], maxZoom: mb.maxzoom });
        showToast('MUB carregado', `Georreferenciado • zoom ${mb.minzoom} a ${mb.maxzoom}. Já está no lugar certo.`, 'success', 5000);
    }

    async function carregarImagem(file) {
        const [dim, buf] = await Promise.all([lerDimensoes(file), file.arrayBuffer()]);
        const dpi = detectarDpi(buf);
        const c = map.getCenter();
        const antes = st && st.tipo === 'imagem' ? st : null;
        fecharMbtiles();
        st = {
            tipo: 'imagem', blob: file, nome: file.name, w: dim.w, h: dim.h,
            dpi: dpi || (antes ? antes.dpi : DPI_PADRAO),
            escala: antes ? antes.escala : ESCALA_PADRAO,
            lat: c.lat, lng: c.lng,
            opacity: st && st.opacity ? st.opacity : 0.8,
            travado: false
        };
        montar();
        persistir();
        if (camadaAtual !== 'mub') ativarCamadaMapa('mub');
        else { removerControle(); criarControle(); mostrarAlca(); }
        map.fitBounds(limites(), { padding: [30, 30], maxZoom: 19 });
        showToast('MUB (imagem) carregado', `Escala 1:${st.escala} • ${Math.round(st.dpi)} DPI. Imagem comum não tem georreferência: arraste a alça ✥ para posicionar.`, 'success', 7000);
    }

    input.addEventListener('change', async () => {
        const file = input.files && input.files[0];
        input.value = '';
        if (!file) return;
        try {
            if (/\.mbtiles$/i.test(file.name)) await carregarMbtiles(file);
            else if (/^image\//.test(file.type) || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) await carregarImagem(file);
            else showToast('Formato não suportado', 'Envie o MUB como arquivo .mbtiles (georreferenciado) ou como imagem PNG/JPG.', 'warning', 6000);
        } catch (err) {
            console.error('[MUB]', err);
            showToast('Erro ao abrir o MUB', err.message, 'error', 7000);
        }
    });

    window.MUB = {
        temImagem: () => !!st,
        escolher: () => input.click(),
        ativar, desativar
    };

    // restaura o último MUB usado neste navegador
    lerDb().then(async (v) => {
        if (!v || !v.blob) return;
        try {
            if (v.tipo === 'mbtiles') mb = await abrirMbtiles(v.blob);
            st = v;
            if (!st.tipo) st.tipo = 'imagem';       // versões antigas só guardavam imagem
            montar();
            if (ativo) ativar();
        } catch (e) { console.warn('[MUB] não foi possível restaurar:', e); }
    }).catch(() => {});
})();

// ============================================
// BASE IBGE — EXIBIÇÃO NO MAPA
// Casinhas brancas translúcidas, atrás dos surveys, com a fachada do IBGE.
// Clique na casinha mostra os complementos. Fachadas repetidas ficam juntas na mesma casinha.
// ============================================
let _ibgeSeq = 0;
let _ibgeGrupos = [];                        // casinhas do IBGE carregadas: { fachada, lat, lng, itens, marker }
let _ibgeSel = null;                         // sessão de marcação ("Verificar IBGE") em andamento
let _ibgeCriterio = '';                      // como o roteiro foi cruzado com o IBGE (CEP + logradouro, só CEP...)
let _ibgeCamada = null;
let _ibgeControle = null;
let _ibgeResumo = null;                       // { fachadas, registros }
let _ibgeVisivel = localStorage.getItem('ibgeVisivel') !== '0';

// Liga/desliga a exibição das casinhas do IBGE (checkbox no canto do mapa, que mostra a quantidade)
function definirIbgeVisivel(visivel) {
    _ibgeVisivel = !!visivel;
    localStorage.setItem('ibgeVisivel', _ibgeVisivel ? '1' : '0');
    if (_ibgeCamada) { if (_ibgeVisivel) _ibgeCamada.addTo(map); else map.removeLayer(_ibgeCamada); }
    const ctl = document.getElementById('ibgeToggle');
    if (ctl) ctl.checked = _ibgeVisivel;
}

const _ibgeNorm = (v) => String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

// Palavras de ligação ignoradas ao comparar nomes de logradouro
const _IBGE_STOP = new Set(['DE', 'DA', 'DO', 'DAS', 'DOS', 'E', 'A', 'O']);
const _ibgeTokens = (s) => _ibgeNorm(s).split(' ').filter(t => t && !_IBGE_STOP.has(t));

// O nome do IBGE confere com o do roteiro? Aceita igual ou "contido" (ex.: roteiro "SANTA EDWIGES" × IBGE "EDWIGES")
function _ibgeNomeIgual(r, l) {
    const alvo = _ibgeNorm(l.rua);
    const alvoCompleto = _ibgeNorm([l.tipo, l.rua].filter(Boolean).join(' '));
    const nome = _ibgeNorm(r.logradouro);
    const nomeCompleto = _ibgeNorm([r.tipo, r.logradouro].filter(Boolean).join(' '));
    return [nome, nomeCompleto].some(n => n && (n === alvo || n === alvoCompleto));
}
function _ibgeNomeContido(r, l) {
    const ti = _ibgeTokens(r.logradouro), tr = _ibgeTokens(l.rua);
    if (!ti.length || !tr.length) return false;
    const dentro = (x, y) => x.every(t => y.includes(t));
    return dentro(ti, tr) || dentro(tr, ti);
}

function limparIbge() {
    encerrarSelecaoIbge(true);   // a marcação pertence à camada atual
    _ibgeGrupos = [];
    _ibgeCriterio = '';
    if (_ibgeCamada) { map.removeLayer(_ibgeCamada); _ibgeCamada = null; }
    _ibgeResumo = null;
    atualizarControleIbge();
}

function atualizarControleIbge() {
    if (!_ibgeControle) {
        const C = L.Control.extend({
            options: { position: 'bottomleft' },
            onAdd() {
                const div = L.DomUtil.create('div', 'ibge-ctrl');
                div.innerHTML = '<label><input type="checkbox" id="ibgeToggle"> <span id="ibgeToggleTxt"></span></label>';
                L.DomEvent.disableClickPropagation(div);
                div.querySelector('#ibgeToggle').addEventListener('change', (e) => definirIbgeVisivel(e.target.checked));
                return div;
            }
        });
        _ibgeControle = new C();
    }
    const el = _ibgeControle.getContainer();
    if (!_ibgeResumo) {
        if (el) _ibgeControle.remove();
        return;
    }
    if (!el || !el.parentNode) _ibgeControle.addTo(map);
    const c = _ibgeControle.getContainer();
    c.querySelector('#ibgeToggle').checked = _ibgeVisivel;
    c.querySelector('#ibgeToggleTxt').textContent =
        `IBGE: ${_ibgeResumo.fachadas} fachada(s) • ${_ibgeResumo.registros} registro(s)` +
        (_ibgeUsadas ? ` • ${_ibgeUsadas} já cadastrada(s)` : '');
    c.title = _ibgeCriterio ? `Cruzado por: ${_ibgeCriterio}` : '';
}

let _ibgeUsadas = 0;   // quantas casinhas do IBGE já viraram survey (ficam escondidas)

// Esconde do mapa as casinhas brancas do IBGE que já foram usadas num cadastro.
// Vínculo: survey criado a partir do IBGE guarda a "chave" da casinha (continua vinculado mesmo se for movido);
// survey digitado manualmente vale quando tem a mesma fachada e está a até 15 m da casinha.
function ibgeAtualizarOcultas() {
    if (!_ibgeGrupos.length) { _ibgeUsadas = 0; return; }
    const metros = (la1, lo1, la2, lo2) => Math.hypot((la2 - la1) * 110540, (lo2 - lo1) * 111320 * Math.cos(la1 * Math.PI / 180));
    const usadas = new Set();
    surveysMemoria.forEach(s => {
        if (s._ibgeChave) {
            const g = _ibgeGrupos.find(x => x.chave === s._ibgeChave);
            if (g) usadas.add(g);
            return;
        }
        const lat = s.latitude != null ? Number(s.latitude) : null;
        const lng = s.longitude != null ? Number(s.longitude) : null;
        const num = _ibgeNorm(s.numero);
        if (lat == null || lng == null || isNaN(lat) || isNaN(lng) || !num) return;
        let melhor = null, dmin = 15;
        _ibgeGrupos.forEach(g => {
            if (_ibgeNorm(g.fachada) !== num) return;
            const d = metros(lat, lng, g.lat, g.lng);
            if (d <= dmin) { dmin = d; melhor = g; }
        });
        if (melhor) usadas.add(melhor);
    });
    _ibgeGrupos.forEach(g => {
        g.usada = usadas.has(g);
        if (!_ibgeCamada || !g.marker) return;
        if (g.usada) { if (_ibgeCamada.hasLayer(g.marker)) _ibgeCamada.removeLayer(g.marker); }
        else if (!_ibgeCamada.hasLayer(g.marker)) _ibgeCamada.addLayer(g.marker);
    });
    _ibgeUsadas = usadas.size;
    if (_ibgeSel) {   // marcação em andamento: tira da seleção as que passaram a estar usadas
        [..._ibgeSel.sel].filter(g => g.usada).forEach(g => _ibgeSel.sel.delete(g));
        if (_ibgeSel.atualizar) _ibgeSel.atualizar();
    }
    atualizarControleIbge();
}

const _ibgeSVG = houseSVG.replace(/#2a4fd6/g, '#ffffff').replace(/#1e3c72/g, '#334155');
const _ibgeSVGSel = houseSVG.replace(/#2a4fd6/g, '#facc15').replace(/#1e3c72/g, '#b45309');   // marcada = amarela

function _ibgeIcone(g, marcada) {
    return L.divIcon({
        className: 'ibge-marker' + (marcada ? ' ibge-sel' : ''),
        html: `${marcada ? _ibgeSVGSel : _ibgeSVG}<span class="ibge-num">${escapeHtml(g.fachada)}</span>`,
        iconSize: [14, 18], iconAnchor: [7, 18], popupAnchor: [0, -18]
    });
}

function _ibgeComplementos(r) {
    const out = [];
    for (let i = 1; i <= 5; i++) {
        const t = (r['tipo_complemento' + i] || '').toString().trim();
        const v = (r['complemento' + i] || '').toString().trim();
        if (t || v) out.push([t, v].filter(Boolean).join(' '));
    }
    return out;
}

async function atualizarCamadaIbge() {
    const seq = ++_ibgeSeq;
    limparIbge();
    const l = enderecoBaseSelecionado;
    if (!l || !l.rua || typeof supabaseClient === 'undefined' || !supabaseClient) return;

    try {
        const temCoord = (r) => r.latitude != null && r.longitude != null;
        const cep8 = (() => { const d = String(l.cep || '').replace(/\D/g, ''); return d ? d.padStart(8, '0') : ''; })();
        const buscarTudo = async (montar) => {
            const out = [];
            for (let de = 0; de < 20000; de += 1000) {
                const { data, error } = await montar().range(de, de + 999);
                if (error) throw error;
                out.push(...(data || []));
                if (!data || data.length < 1000) break;
            }
            return out;
        };

        let registros = [];
        let criterio = '';

        // 1) CEP do roteiro × cep do IBGE (8 dígitos)
        const porCep = cep8.length === 8
            ? (await buscarTudo(() => supabaseClient.from('logradouros_ibge').select('*').eq('cep', cep8))).filter(temCoord)
            : [];
        if (seq !== _ibgeSeq) return;     // o usuário já escolheu outro logradouro

        const cepEnome = porCep.filter(r => _ibgeNomeIgual(r, l) || _ibgeNomeContido(r, l));
        const nomesNoCep = new Set(porCep.map(r => _ibgeNorm(r.logradouro)));
        if (cepEnome.length) {
            registros = cepEnome; criterio = 'CEP + logradouro';
        } else if (porCep.length && nomesNoCep.size === 1) {
            // o CEP aponta para um único logradouro no IBGE: vale mesmo que o nome seja escrito diferente
            registros = porCep; criterio = 'somente CEP';
        } else {
            // 2) sem CEP que resolva: cruza pelo nome. O IBGE pode omitir partes do nome
            //    (ex.: "SANTA EDWIGES" → "EDWIGES"), então busca pela palavra mais longa.
            const palavras = String(l.rua).trim().split(/\s+/).filter(w => w && !_IBGE_STOP.has(_ibgeNorm(w)));
            palavras.sort((a, b) => b.length - a.length);
            const chave = (palavras[0] || String(l.rua)).replace(/[%\\]/g, '').replace(/[^\x00-\x7F]/g, '_');
            const todos = (await buscarTudo(() => supabaseClient.from('logradouros_ibge').select('*').ilike('logradouro', `%${chave}%`))).filter(temCoord);
            if (seq !== _ibgeSeq) return;

            const cep5 = cep8.slice(0, 5);
            const bairroAlvo = _ibgeNorm(l.bairro);
            registros = todos.filter(r => {
                const exato = _ibgeNomeIgual(r, l);
                if (!exato && !_ibgeNomeContido(r, l)) return false;
                // mesma rua em outro bairro/cidade: confere CEP ou bairro quando houver como comparar
                const rCep5 = String(r.cep || '').replace(/\D/g, '').slice(0, 5);
                const rBairro = _ibgeNorm(r.bairro);
                const temRef = (cep5 && rCep5) || (bairroAlvo && rBairro);
                if (!temRef) return exato;       // sem como confirmar: só aceita nome idêntico
                return (cep5 && rCep5 && cep5 === rCep5) || (bairroAlvo && rBairro && bairroAlvo === rBairro);
            });
            criterio = 'logradouro + bairro/CEP';
        }
        _ibgeCriterio = registros.length ? criterio : '';

        if (!registros.length) return;

        // agrupa: mesma fachada na mesma posição = uma casinha só, com todos os complementos no popup
        const grupos = new Map();
        registros.forEach(r => {
            const fach = (r.numero_fachada == null ? '' : String(r.numero_fachada)).trim() || 'SN';
            const chave = [fach.toUpperCase(), Number(r.latitude).toFixed(5), Number(r.longitude).toFixed(5)].join('|');
            if (!grupos.has(chave)) grupos.set(chave, { chave, fachada: fach, lat: Number(r.latitude), lng: Number(r.longitude), itens: [] });
            grupos.get(chave).itens.push(r);
        });

        const camada = L.layerGroup();
        grupos.forEach(g => {
            // zIndexOffset negativo: fica ATRÁS dos surveys cadastrados
            const m = L.marker([g.lat, g.lng], { icon: _ibgeIcone(g, false), zIndexOffset: -1000, keyboard: false });
            g.marker = m;
            const linhas = g.itens.slice(0, 30).map(r => {
                const comps = _ibgeComplementos(r);
                const and = r.qtd_andares != null && r.qtd_andares !== '' ? ` • ${escapeHtml(String(r.qtd_andares))} andar(es)` : '';
                return `<li>${comps.length ? escapeHtml(comps.join(', ')) : '<em>sem complemento</em>'}${and}</li>`;
            }).join('');
            const mais = g.itens.length > 30 ? `<small>+ ${g.itens.length - 30} registro(s)</small>` : '';
            m.bindPopup(`<strong>IBGE — ${escapeHtml([l.tipo, l.rua].filter(Boolean).join(' '))}, ${escapeHtml(g.fachada)}</strong>` +
                `<ul class="ibge-pop">${linhas}</ul>${mais}`);
            // durante a marcação, o clique também marca/desmarca (a legenda continua abrindo)
            m.on('click', () => {
                if (!_ibgeSel) return;
                if (_ibgeSel.modoLinha) { _ibgeSel.cliqueLinha(m.getLatLng()); m.closePopup(); return; }
                _ibgeSel.alternar(g);
            });
            m.addTo(camada);
        });

        _ibgeGrupos = Array.from(grupos.values());
        _ibgeCamada = camada;
        ibgeAtualizarOcultas();   // casinhas já cadastradas não aparecem
        _ibgeResumo = { fachadas: grupos.size, registros: registros.length };
        if (_ibgeVisivel) camada.addTo(map);
        atualizarControleIbge();
    } catch (err) {
        console.warn('[IBGE] não foi possível carregar a base:', err);
    }
}


// ============================================
// IA — "VERIFICAR IBGE": marcar casinhas e cadastrar
// Marca clicando nas casinhas ou passando uma linha por cima delas, e cria os surveys
// conforme o roteiro selecionado, aproveitando só a fachada e as coordenadas do IBGE.
// ============================================
function iaMensagemInterativa(html) {
    const div = document.createElement('div');
    div.className = 'ia-msg ia-msg-ia';
    div.innerHTML = html;
    iaChatBody.appendChild(div);
    iaChatBody.scrollTop = iaChatBody.scrollHeight;
    return div;
}

function encerrarSelecaoIbge(silencioso) {
    const S = _ibgeSel;
    if (!S) return;
    _ibgeSel = null;
    if (S.modoLinha) { map.off('click', S.onMapClick); map.getContainer().style.cursor = ''; }
    if (S.linhas) map.removeLayer(S.linhas);
    S.sel.forEach(g => { if (g.marker) { g.marker.setIcon(_ibgeIcone(g, false)); g.marker.setZIndexOffset(-1000); } });
    S.painelEl && S.painelEl.remove();
    S.perguntaEl && S.perguntaEl.remove();
    S.zonaEl && S.zonaEl.remove();
    if (_modoIA === 'ibge') definirModoIA(null);
}

async function iniciarVerificacaoIbge() {
    abrirChatIA();
    const l = enderecoBaseSelecionado;
    if (!l || !l.rua) {
        escreverMensagemIA('Para verificar o IBGE, primeiro escolha o logradouro nos passos <strong>1 e 2</strong>. Depois é só pedir de novo.', 300);
        return;
    }
    const nomeRua = [l.tipo, l.rua].filter(Boolean).join(' ');
    iaMensagemInterativa(`🔎 Consultando a base do IBGE para <strong>${escapeHtml(nomeRua)}</strong>...`);

    try { await comTimeout(atualizarCamadaIbge(), 30000, 'A consulta ao IBGE demorou demais'); }
    catch (err) { console.warn('[IBGE]', err); }

    if (!_ibgeGrupos.length) {
        escreverMensagemIA(`Cruzei o CEP (<strong>${escapeHtml(l.cep ? formatarCEP(l.cep) : 'não informado')}</strong>) e o logradouro <strong>${escapeHtml(nomeRua)}</strong> com a base do IBGE, mas não encontrei fachadas. Confira se o logradouro escolhido é o certo ou tente de novo em instantes.`, 300);
        return;
    }

    // garante que as casinhas estejam visíveis e enquadra o mapa nelas
    definirIbgeVisivel(true);   // para marcar é preciso ver as casinhas: religa se estiver desligado
    atualizarControleIbge();
    const livres = _ibgeGrupos.filter(g => !g.usada);
    if (!livres.length) {
        escreverMensagemIA(`Todas as <strong>${_ibgeGrupos.length}</strong> casinha(s) do IBGE de <strong>${escapeHtml(nomeRua)}</strong> já foram cadastradas.`, 300);
        return;
    }
    map.fitBounds(L.latLngBounds(livres.map(g => [g.lat, g.lng])), { padding: [50, 50], maxZoom: 19 });

    iniciarSelecaoIbge(nomeRua);
}

function iniciarSelecaoIbge(nomeRua) {
    const S = {
        sel: new Set(), modoLinha: false, pendente: null,
        linhas: L.layerGroup().addTo(map),
        painelEl: null, perguntaEl: null, contadorEl: null, btnLinha: null
    };
    _ibgeSel = S;

    const atualizar = () => {
        if (S.contadorEl) S.contadorEl.textContent = `${S.sel.size} de ${_ibgeGrupos.filter(g => !g.usada).length}`;
    };
    S.atualizar = atualizar;
    const marcar = (g, on) => {
        if (on) S.sel.add(g); else S.sel.delete(g);
        g.marker.setIcon(_ibgeIcone(g, on));
        g.marker.setZIndexOffset(on ? -500 : -1000);
    };
    S.alternar = (g) => { marcar(g, !S.sel.has(g)); atualizar(); };

    // casinhas por onde a linha passa (distância em pixels, medida a partir do centro do ícone)
    const porLinha = (a, b) => {
        const pa = map.latLngToContainerPoint(a), pb = map.latLngToContainerPoint(b);
        const dx = pb.x - pa.x, dy = pb.y - pa.y, len2 = dx * dx + dy * dy;
        const achados = [];
        _ibgeGrupos.forEach(g => {
            if (g.usada) return;   // já cadastrada: escondida e fora da marcação
            const p = map.latLngToContainerPoint([g.lat, g.lng]);
            const cx = p.x, cy = p.y - 9;
            let t = len2 ? ((cx - pa.x) * dx + (cy - pa.y) * dy) / len2 : 0;
            t = Math.max(0, Math.min(1, t));
            if (Math.hypot(cx - (pa.x + t * dx), cy - (pa.y + t * dy)) <= 12) achados.push({ g, t });
        });
        return achados.sort((x, y) => x.t - y.t).map(x => x.g);   // na ordem em que a linha passa
    };

    const ativarLinha = (on) => {
        if (S.modoLinha === on) return;
        S.modoLinha = on;
        map.getContainer().style.cursor = on ? 'crosshair' : '';
        if (on) map.on('click', S.onMapClick); else map.off('click', S.onMapClick);
        if (!on && S.pendente) { S.linhas.removeLayer(S.marcaPend); S.pendente = null; S.marcaPend = null; }
        if (S.btnLinha) S.btnLinha.textContent = on ? 'Cancelar linha' : '✏️ Passar linha';
        if (on) showToast('Passar linha', 'Clique no início e no fim da linha, passando por cima das casinhas.', 'info', 4500);
    };
    S.onMapClick = (e) => S.cliqueLinha(e.latlng);
    S.cliqueLinha = (ll) => {
        const ponto = () => L.circleMarker(ll, { radius: 5, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1 });
        if (!S.pendente) {
            S.pendente = ll;
            S.marcaPend = ponto().addTo(S.linhas);
            return;
        }
        const a = S.pendente, b = ll;
        S.pendente = null; S.marcaPend = null;
        L.polyline([a, b], { color: '#f59e0b', weight: 3, dashArray: '6 6' }).addTo(S.linhas);
        ponto().addTo(S.linhas);
        const achados = porLinha(a, b);
        achados.forEach(g => marcar(g, true));
        ativarLinha(false);
        atualizar();
        if (!achados.length) {
            escreverMensagemIA('A linha não passou por nenhuma casinha. Aproxime o zoom e passe por cima delas.', 300);
            return;
        }
        perguntarCadastro(`A linha passou por <strong>${achados.length}</strong> casinha(s).`);
    };

    const perguntarCadastro = (intro) => {
        if (S.sel.size === 0) { showToast('Nada marcado', 'Marque ao menos uma casinha do IBGE.', 'warning'); return; }
        S.perguntaEl && S.perguntaEl.remove();
        S.perguntaEl = iaMensagemInterativa(`
            ${intro ? intro + '<br>' : ''}Total marcado: <strong>${S.sel.size}</strong> casinha(s).<br>
            Deseja <strong>cadastrar ${S.sel.size} survey(s)</strong> conforme o roteiro selecionado (<strong>${escapeHtml(nomeRua)}</strong>), aproveitando apenas a <strong>fachada</strong> e as <strong>coordenadas</strong> de cada uma?
            <div class="ia-msg-actions" style="margin-top:8px;">
                <button class="ia-btn ia-btn-success" data-acao="sim" type="button">Sim, cadastrar</button>
                <button class="ia-btn ia-btn-secondary" data-acao="nao" type="button">Continuar marcando</button>
            </div>`);
        S.perguntaEl.querySelector('[data-acao="sim"]').addEventListener('click', () => {
            S.perguntaEl.remove(); S.perguntaEl = null;
            escreverMensagemUser('Sim, cadastrar');
            S.zonaEl = pedirZonaIA(
                `Qual a <strong>zona</strong> dos <strong>${S.sel.size} survey(s)</strong> que vou cadastrar?`,
                (zona) => { S.zonaEl = null; cadastrarMarcadasIbge(zona); },
                () => { S.zonaEl = null; escreverMensagemIA('Cadastro cancelado. As casinhas continuam marcadas; clique em <strong>Cadastrar marcadas</strong> quando quiser.', 300); }
            );
        });
        S.perguntaEl.querySelector('[data-acao="nao"]').addEventListener('click', () => {
            S.perguntaEl.remove(); S.perguntaEl = null;
            escreverMensagemUser('Continuar marcando');
        });
    };

    definirModoIA('ibge');
    S.painelEl = iaMensagemInterativa(`
        <div class="ia-card-title">🏠 Verificar IBGE</div>
        <strong>${escapeHtml(nomeRua)}</strong>
        <small>Cruzamento com o roteiro: ${escapeHtml(_ibgeCriterio || '—')}</small>
        <div class="ia-stats">
            <span class="ia-stat">Disponíveis <strong>${_ibgeGrupos.filter(g => !g.usada).length}</strong></span>
            <span class="ia-stat ia-stat-destaque">Marcadas <strong id="ibgeContador"></strong></span>
        </div>
        <ol class="ia-passos">
            <li>Clique nas casinhas brancas do mapa, ou use <strong>Passar linha</strong> para marcar todas por onde a linha passar.</li>
            <li>Clique em <strong>Cadastrar marcadas</strong>. Fachadas repetidas também são cadastradas.</li>
        </ol>
        <div class="ia-msg-actions">
            <button class="ia-btn ia-btn-secondary" data-acao="linha" type="button">✏️ Passar linha</button>
            <button class="ia-btn ia-btn-secondary" data-acao="todas" type="button">Marcar todas</button>
            <button class="ia-btn ia-btn-secondary" data-acao="limpar" type="button">Limpar</button>
        </div>
        <div class="ia-msg-actions">
            <button class="ia-btn ia-btn-success" data-acao="cadastrar" type="button">Cadastrar marcadas</button>
            <button class="ia-btn ia-btn-secondary" data-acao="encerrar" type="button">Encerrar</button>
        </div>`);
    S.contadorEl = S.painelEl.querySelector('#ibgeContador');
    S.btnLinha = S.painelEl.querySelector('[data-acao="linha"]');
    const bt = (a) => S.painelEl.querySelector(`[data-acao="${a}"]`);
    S.btnLinha.addEventListener('click', () => ativarLinha(!S.modoLinha));
    bt('todas').addEventListener('click', () => {
        ativarLinha(false);
        _ibgeGrupos.filter(g => !g.usada)
            .sort((x, y) => String(x.fachada).localeCompare(String(y.fachada), 'pt', { numeric: true }))
            .forEach(g => marcar(g, true));
        atualizar();
        perguntarCadastro('Marquei todas as casinhas.');
    });
    bt('limpar').addEventListener('click', () => { [...S.sel].forEach(g => marcar(g, false)); atualizar(); });
    bt('cadastrar').addEventListener('click', () => perguntarCadastro(''));
    bt('encerrar').addEventListener('click', () => {
        escreverMensagemUser('Encerrar');
        encerrarSelecaoIbge();
        escreverMensagemIA('Tudo bem! As casinhas do IBGE continuam no mapa só para consulta.', 300);
    });
    atualizar();
}

function cadastrarMarcadasIbge(zona) {
    const S = _ibgeSel;
    const l = enderecoBaseSelecionado;
    if (!S || !l) return;

    const base = Date.now();
    let criados = 0;

    [...S.sel].forEach(g => {
        const numero = String(g.fachada == null ? '' : g.fachada).trim();
        // Fachada repetida é permitida: cada casinha marcada vira um survey, mesmo que já exista outro com o mesmo número.
        // (Uma mesma casinha não é cadastrada duas vezes porque, depois de usada, ela some da seleção.)
        surveysMemoria.push({
            _id: 'ibge_' + (++_surveyIdSeq),
            _ia: true,
            _ibge: true,
            _ibgeChave: g.chave,   // vínculo com a casinha: ela fica escondida mesmo que o survey seja movido
            logradouro: { ...l },
            numero: numero,
            pisos: null,
            zona: zona || null,
            observacoes: null,
            imovel: null,
            tipoImovel: null,
            complementos: [],
            latitude: +g.lat.toFixed(8),
            longitude: +g.lng.toFixed(8),
            created_at: new Date(base + criados).toISOString()   // mantém a ordem da marcação
        });
        criados++;
    });

    renderizarSurveys();
    expandirCard('listPanel');
    encerrarSelecaoIbge();

    escreverMensagemIA(
        `✅ Pronto! Criei <strong>${criados} survey(s)</strong> a partir do IBGE, com a fachada e as coordenadas de cada casinha.` +
        `<br><br>Eles aparecem na lista com <strong>fundo verde</strong> e a etiqueta <strong>🤖 IA</strong>.`,
        300
    );

    // libera a IA para um novo ciclo (os surveys criados aqui não disparam a análise de padrão)
    _iaCorte = surveysMemoria.length;
    _iaJaDisparou = false;
    _iaMeta = 0;
}

// ============================================
// IA — ESPACIALIZAÇÃO
// Seleciona surveys já cadastrados, o usuário marca 2 pontos (uma linha) e os surveys
// são alinhados sobre ela, na mesma ordem e mantendo a distância original entre um e outro.
// ============================================

function encerrarEspacializacao() {
    const E = _espSel;
    if (!E) return;
    _espSel = null;
    if (E.modoLinha) { map.off('click', E.onMapClick); map.getContainer().style.cursor = ''; }
    if (E.camada) map.removeLayer(E.camada);
    E.painelEl && E.painelEl.remove();
    if (_modoIA === 'espacializacao') definirModoIA(null);
    renderizarMarcadoresSurveys();   // tira o destaque amarelo
}

function iniciarEspacializacao() {
    abrirChatIA();
    encerrarSelecaoIbge(true);
    encerrarEspacializacao();

    const temCoord = (s) => s.latitude != null && s.longitude != null && !isNaN(Number(s.latitude)) && !isNaN(Number(s.longitude));
    const disponiveis = () => surveysMemoria.filter(temCoord);
    if (disponiveis().length < 2) {
        escreverMensagemIA('Para espacializar preciso de pelo menos <strong>2 surveys</strong> cadastrados com coordenadas.', 300);
        return;
    }

    const M_LAT = 110540;
    const mLng = (lat) => 111320 * Math.cos(lat * Math.PI / 180);

    const E = {
        sel: new Set(), modoLinha: false, pendente: null, marca: null,
        camada: L.layerGroup().addTo(map), painelEl: null, contadorEl: null, btnLinha: null
    };
    _espSel = E;
    definirModoIA('espacializacao');

    const pintar = (s) => {
        const m = marcadoresSurveys.find(x => x._sid === s._id);
        if (m) m.setIcon(iconeComNumero(E.sel.has(s._id) ? iconeCasaCor('#facc15') : iconeSurvey(s), s));
    };
    E.fase = 'selecao';   // 'selecao' (escolhendo os surveys) → 'linha' (seleção confirmada, marcando os 2 pontos)
    E.atualizar = () => {
        E.contadorEl.textContent = `${E.sel.size} de ${disponiveis().length}`;
        E.btnConfirmar.disabled = E.sel.size < 2;
    };
    E.alternar = (s) => {
        if (E.fase !== 'selecao') return;   // seleção travada depois de confirmada
        if (_surveyEditandoIdx != null && surveysMemoria[_surveyEditandoIdx] === s) return;   // survey em edição não entra
        if (E.sel.has(s._id)) E.sel.delete(s._id); else E.sel.add(s._id);
        pintar(s);
        E.atualizar();
    };

    const ativarLinha = (on) => {
        if (E.modoLinha === on) return;
        E.modoLinha = on;
        map.getContainer().style.cursor = on ? 'crosshair' : '';
        if (on) map.on('click', E.onMapClick); else map.off('click', E.onMapClick);
        if (!on && E.marca) { E.camada.removeLayer(E.marca); E.marca = null; E.pendente = null; }
        if (on) showToast('Definir linha', 'Clique no ponto inicial e depois no ponto final da linha.', 'info', 4500);
    };

    const irParaFase = (fase) => {
        E.fase = fase;
        E.painelEl.querySelector('[data-fase="selecao"]').hidden = fase !== 'selecao';
        E.painelEl.querySelector('[data-fase="linha"]').hidden = fase !== 'linha';
        ativarLinha(fase === 'linha');
        if (fase === 'linha') E.painelEl.querySelector('#espContador2').textContent = String(E.sel.size);
        iaChatBody.scrollTop = iaChatBody.scrollHeight;
    };

    const aplicar = (a, b) => {
        ativarLinha(false);
        const lista = [...E.sel].map(id => surveysMemoria.find(s => s._id === id)).filter(s => s && temCoord(s));
        const k = mLng(a.lat);
        const xy = (lat, lng) => ({ x: (lng - a.lng) * k, y: (lat - a.lat) * M_LAT });
        const vb = xy(b.lat, b.lng);
        const comp = Math.hypot(vb.x, vb.y);
        if (comp < 0.5) {
            showToast('Pontos muito próximos', 'Marque dois pontos mais distantes para formar a linha.', 'warning', 4000);
            return;
        }
        const ux = vb.x / comp, uy = vb.y / comp;

        // ordem: a posição de cada survey projetada sobre a direção da linha (do ponto inicial para o final)
        const itens = lista
            .map((s, i) => { const p = xy(Number(s.latitude), Number(s.longitude)); return { s, p, t: p.x * ux + p.y * uy, i }; })
            .sort((m, n) => (m.t - n.t) || (m.i - n.i));

        const original = itens.map(it => ({ s: it.s, lat: it.s.latitude, lng: it.s.longitude }));

        // Mesma fachada (mesmo logradouro + mesmo número, exceto "SN"): os surveys ficam juntos, um atrás do outro
        // ao longo da linha, para nunca caírem no exato mesmo ponto.
        const chaveFachada = (sv) => {
            const num = _ibgeNorm(sv.numero);
            if (!num || /^(SN|S\/N|S N|SEM NUMERO)$/.test(num)) return null;   // sem número não é "a mesma fachada"
            const lg = sv.logradouro || {};
            const rua = _ibgeNorm([lg.tipo, lg.rua].filter(Boolean).join(' '));
            const via = rua ? `${rua}|${_ibgeNorm(lg.cep)}` : `id:${lg._registro_id == null ? '' : lg._registro_id}`;
            return `${via}|${num}`;
        };
        const gruposFachada = [];            // cada grupo = surveys da mesma fachada (fachada única = grupo de 1)
        const grupoPorChave = new Map();
        itens.forEach(it => {
            const ch = chaveFachada(it.s);
            if (ch && grupoPorChave.has(ch)) { grupoPorChave.get(ch).push(it); return; }
            const g = [it];
            gruposFachada.push(g);
            if (ch) grupoPorChave.set(ch, g);
        });

        // o 1º vai para o ponto inicial; cada fachada seguinte fica à mesma distância (em metros) da anterior que tinha originalmente.
        // Dentro da mesma fachada, cada survey fica ESP_PASSO_MESMA_FACHADA_M metros atrás do anterior.
        const ESP_PASSO_MESMA_FACHADA_M = 4;   // distância entre surveys da mesma fachada (≈ 2 casinhas no zoom máximo)
        let acum = 0;        // posição (m) da fachada atual sobre a linha
        let ext = 0;         // extensão total ocupada pelos surveys
        let empilhados = 0;  // quantos surveys foram enfileirados por dividirem a fachada
        gruposFachada.forEach((g, gi) => {
            if (gi > 0) acum += Math.hypot(g[0].p.x - gruposFachada[gi - 1][0].p.x, g[0].p.y - gruposFachada[gi - 1][0].p.y);
            g.forEach((it, pos) => {
                const d = acum + pos * ESP_PASSO_MESMA_FACHADA_M;
                it.s.latitude = +(a.lat + (uy * d) / M_LAT).toFixed(8);
                it.s.longitude = +(a.lng + (ux * d) / k).toFixed(8);
                if (d > ext) ext = d;
            });
            if (g.length > 1) empilhados += g.length;
        });
        acum = ext;

        const qtd = itens.length;
        const alem = acum - comp;
        encerrarEspacializacao();   // redesenha os marcadores nas novas posições

        const msg = iaMensagemInterativa(`
            <div class="ia-card-title">✅ Espacialização concluída</div>
            <strong>${qtd} surveys</strong> foram alinhados na linha, na mesma ordem e com a distância original entre cada um.
            <div class="ia-stats">
                <span class="ia-stat">Extensão <strong>${acum.toFixed(1)} m</strong></span>
                <span class="ia-stat">Linha <strong>${comp.toFixed(1)} m</strong></span>
            </div>
            ${alem > 0.5 ? `<small>O conjunto é maior que a linha: os últimos ficaram até ${alem.toFixed(1)} m além do ponto final.</small>` : ''}
            ${empilhados ? `<small>${empilhados} surveys de fachadas repetidas foram enfileirados, um atrás do outro, a ${ESP_PASSO_MESMA_FACHADA_M} m de distância.</small>` : ''}
            <div class="ia-msg-actions">
                <button class="ia-btn ia-btn-secondary" data-acao="desfazer" type="button">↩️ Desfazer</button>
                <button class="ia-btn ia-btn-success" data-acao="outro" type="button">📐 Espacializar outro grupo</button>
            </div>`);
        msg.querySelector('[data-acao="outro"]').addEventListener('click', () => {
            msg.querySelector('.ia-msg-actions').remove();
            escreverMensagemUser('Espacializar outro grupo');
            iniciarEspacializacao();
        });
        msg.querySelector('[data-acao="desfazer"]').addEventListener('click', () => {
            original.forEach(o => { o.s.latitude = o.lat; o.s.longitude = o.lng; });
            renderizarMarcadoresSurveys();
            msg.querySelector('.ia-msg-actions').remove();
            escreverMensagemUser('Desfazer');
            escreverMensagemIA('Pronto, os surveys voltaram às posições originais.', 300);
        });
    };

    E.onMapClick = (e) => {
        const ponto = () => L.circleMarker(e.latlng, { radius: 5, color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 1 });
        if (!E.pendente) {
            E.pendente = e.latlng;
            E.marca = ponto().addTo(E.camada);
            return;
        }
        const a = E.pendente, b = e.latlng;
        E.pendente = null; E.marca = null;
        L.polyline([a, b], { color: '#7c3aed', weight: 3, dashArray: '6 6' }).addTo(E.camada);
        ponto().addTo(E.camada);
        aplicar(a, b);
    };

    E.painelEl = iaMensagemInterativa(`
        <div class="ia-card-title">📐 Espacialização</div>
        <div data-fase="selecao">
            <strong>Passo 1: escolha os surveys</strong> que serão alinhados.
            <small>Marque só os que ficam na mesma fileira (por exemplo, um lado da rua). Os que não forem marcados não se movem.</small>
            <div class="ia-stats">
                <span class="ia-stat ia-stat-destaque">Selecionados <strong id="espContador"></strong></span>
            </div>
            <ol class="ia-passos">
                <li>Clique nas casinhas no mapa (ficam amarelas). Clique de novo para desmarcar.</li>
                <li>Quando terminar, clique em <strong>Confirmar seleção</strong>.</li>
            </ol>
            <div class="ia-msg-actions">
                <button class="ia-btn ia-btn-secondary" data-acao="limpar" type="button">Limpar seleção</button>
                <button class="ia-btn ia-btn-success" data-acao="confirmar" type="button">✅ Confirmar seleção</button>
            </div>
        </div>
        <div data-fase="linha" hidden>
            <strong>Passo 2: defina a linha.</strong> Seleção confirmada: <strong id="espContador2"></strong> survey(s).
            <small>Clique no <strong>ponto inicial</strong> e depois no <strong>ponto final</strong> no mapa. Só os surveys selecionados serão ajustados.</small>
            <div class="ia-msg-actions">
                <button class="ia-btn ia-btn-secondary" data-acao="voltar" type="button">← Voltar à seleção</button>
            </div>
        </div>
        <div class="ia-msg-actions">
            <button class="ia-btn ia-btn-secondary" data-acao="encerrar" type="button">Encerrar</button>
        </div>`);
    E.contadorEl = E.painelEl.querySelector('#espContador');
    E.btnConfirmar = E.painelEl.querySelector('[data-acao="confirmar"]');
    const bt = (a) => E.painelEl.querySelector(`[data-acao="${a}"]`);
    E.btnConfirmar.addEventListener('click', () => {
        if (E.sel.size < 2) { showToast('Selecione surveys', 'Marque ao menos 2 surveys para espacializar.', 'warning', 3500); return; }
        escreverMensagemUser(`${E.sel.size} surveys selecionados`);
        irParaFase('linha');
    });
    bt('voltar').addEventListener('click', () => irParaFase('selecao'));
    bt('limpar').addEventListener('click', () => {
        const ids = [...E.sel]; E.sel.clear();
        ids.forEach(id => { const s = surveysMemoria.find(x => x._id === id); if (s) pintar(s); });
        E.atualizar();
    });
    bt('encerrar').addEventListener('click', () => {
        escreverMensagemUser('Encerrar');
        encerrarEspacializacao();
        escreverMensagemIA('Tudo bem! Nada foi alterado.', 300);
    });
    E.atualizar();
}

// ============================================
// BASE IBGE — IMPORTAÇÃO (só ATR)
// Lê .xlsx/.xls/.csv e grava em public.logradouros_ibge
// ============================================
(function importarIbge() {
    const btn = document.getElementById('ibgeUploadBtn');
    if (!btn) return;
    const fileInput = document.getElementById('ibgeFile');
    const status = document.getElementById('ibgeStatus');
    const chkSubstituir = document.getElementById('ibgeSubstituir');

    const semAcento = (v) => String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normCab = (h) => semAcento(h).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    // nomes aceitos para cada coluna do arquivo
    const ALIAS = {
        qtd_andares: ['qtd_andares', 'andares', 'qtde_andares', 'numero_andares', 'n_andares', 'qtd_pavimentos', 'pavimentos'],
        cep: ['cep'],
        bairro: ['bairro'],
        tipo: ['tipo', 'tipo_logradouro', 'tipo_lograd', 'tipo_de_logradouro'],
        logradouro: ['logradouro', 'rua', 'nome_logradouro', 'nome_do_logradouro', 'endereco'],
        numero_fachada: ['numero_fachada', 'numero', 'num_fachada', 'fachada', 'numero_da_fachada', 'n_fachada'],
        latitude: ['latitude', 'lat'],
        longitude: ['longitude', 'lng', 'lon', 'long']
    };
    for (let i = 1; i <= 5; i++) {
        ALIAS['tipo_complemento' + i] = ['tipo_complemento' + i, 'tipo_complemento_' + i, 'tipo_comp' + i, 'tipo_comp_' + i];
        ALIAS['complemento' + i] = ['complemento' + i, 'complemento_' + i, 'comp' + i, 'comp_' + i];
    }
    const campoDoCabecalho = {};
    Object.entries(ALIAS).forEach(([campo, nomes]) => nomes.forEach(n => { if (!(n in campoDoCabecalho)) campoDoCabecalho[n] = campo; }));

    const txt = (v) => (v == null ? '' : String(v).trim());
    const num = (v) => {
        if (typeof v === 'number') return isFinite(v) ? v : null;
        const n = parseFloat(txt(v).replace(/\s/g, '').replace(',', '.'));
        return isNaN(n) ? null : n;
    };
    const chaveDe = (r) => [
        r.logradouro, r.cep, r.numero_fachada,
        r.latitude != null ? Number(r.latitude).toFixed(6) : '', r.longitude != null ? Number(r.longitude).toFixed(6) : '',
        r.tipo_complemento1, r.complemento1, r.tipo_complemento2, r.complemento2, r.tipo_complemento3, r.complemento3,
        r.tipo_complemento4, r.complemento4, r.tipo_complemento5, r.complemento5
    ].map(v => semAcento(v == null ? '' : v).toLowerCase().trim()).join('|');

    async function lerPlanilha(file) {
        if (typeof XLSX === 'undefined') throw new Error('Leitor de planilhas (SheetJS) não carregado. Verifique a internet e recarregue (Ctrl+F5).');
        let wb;
        if (/\.csv$/i.test(file.name) || /\.txt$/i.test(file.name)) {
            const texto = await file.text();
            const primeira = texto.split(/\r?\n/)[0] || '';
            const sep = primeira.includes(';') ? ';' : (primeira.includes('\t') ? '\t' : ',');
            wb = XLSX.read(texto, { type: 'string', FS: sep });
        } else {
            wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        }
        const ws = wb.Sheets[wb.SheetNames[0]];
        const linhas = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
        return linhas.map(lin => {
            const r = {};
            Object.keys(lin).forEach(k => {
                const campo = campoDoCabecalho[normCab(k)];
                if (campo && !(campo in r)) r[campo] = lin[k];
            });
            return r;
        });
    }

    function normalizar(r) {
        let lat = num(r.latitude), lng = num(r.longitude);
        if (lat != null && Math.abs(lat) > 90) lat = null;
        if (lng != null && Math.abs(lng) > 180) lng = null;
        if (lat == null || lng == null) { lat = null; lng = null; }
        let cep = txt(r.cep).replace(/\D/g, '');
        if (cep && cep.length < 8) cep = cep.padStart(8, '0');
        const andares = parseInt(txt(r.qtd_andares), 10);
        const out = {
            qtd_andares: isNaN(andares) ? null : andares,
            cep: cep || null,
            bairro: txt(r.bairro) || null,
            tipo: txt(r.tipo) || null,
            logradouro: txt(r.logradouro),
            numero_fachada: txt(r.numero_fachada) || null,
            latitude: lat != null ? +lat.toFixed(8) : null,
            longitude: lng != null ? +lng.toFixed(8) : null,
            origem: 'IBGE',
            usuario_id: (typeof usuarioAtual !== 'undefined' && usuarioAtual) ? usuarioAtual.id : null
        };
        for (let i = 1; i <= 5; i++) {
            out['tipo_complemento' + i] = txt(r['tipo_complemento' + i]) || null;
            out['complemento' + i] = txt(r['complemento' + i]) || null;
        }
        return out;
    }

    btn.addEventListener('click', async () => {
        if (!usuarioEhATR()) {
            showToast('Sem permissão', 'Apenas usuários ATR podem importar a base IBGE.', 'error', 5000);
            return;
        }
        const file = fileInput.files[0];
        if (!file) { showToast('Nenhum arquivo', 'Selecione um arquivo .xlsx, .xls ou .csv.', 'warning'); return; }
        const substituir = !!(chkSubstituir && chkSubstituir.checked);
        if (substituir && !confirm('Isso APAGA toda a base IBGE atual antes de importar este arquivo. Continuar?')) return;

        btn.disabled = true;
        status.textContent = 'Lendo planilha...';
        try {
            const brutas = await lerPlanilha(file);
            const validas = brutas.map(normalizar).filter(r => r.logradouro);
            if (!validas.length) {
                status.textContent = 'Nenhum registro válido (coluna "logradouro" não encontrada ou vazia).';
                showToast('Sem registros', 'Confira os nomes das colunas da planilha.', 'warning', 6000);
                return;
            }
            const semCoord = validas.filter(r => r.latitude == null).length;

            // repetidos dentro do próprio arquivo
            const porChave = new Map();
            validas.forEach(r => porChave.set(chaveDe(r), r));
            let novos = Array.from(porChave.values());
            const repetidosArquivo = validas.length - novos.length;

            let jaExistiam = 0;
            if (substituir) {
                status.textContent = 'Apagando a base IBGE atual...';
                const { error } = await supabaseClient.from('logradouros_ibge').delete().not('id', 'is', null);
                if (error) throw error;
            } else {
                // não duplica o que já está no banco
                status.textContent = 'Verificando o que já existe na base...';
                const nomes = Array.from(new Set(novos.map(r => r.logradouro)));
                const existentes = new Set();
                for (let i = 0; i < nomes.length; i += 40) {
                    const parte = nomes.slice(i, i + 40);
                    for (let de = 0; de < 100000; de += 1000) {
                        const { data, error } = await supabaseClient.from('logradouros_ibge').select('*')
                            .in('logradouro', parte).range(de, de + 999);
                        if (error) throw error;
                        (data || []).forEach(e => existentes.add(chaveDe(e)));
                        if (!data || data.length < 1000) break;
                    }
                    status.textContent = `Verificando o que já existe na base... ${Math.min(i + 40, nomes.length)}/${nomes.length} logradouros`;
                }
                const antes = novos.length;
                novos = novos.filter(r => !existentes.has(chaveDe(r)));
                jaExistiam = antes - novos.length;
            }

            const TAM = 500;
            let inseridos = 0;
            for (let i = 0; i < novos.length; i += TAM) {
                const lote = novos.slice(i, i + TAM);
                const { error } = await supabaseClient.from('logradouros_ibge').insert(lote);
                if (error) throw error;
                inseridos += lote.length;
                status.textContent = `Importando... ${inseridos}/${novos.length}`;
            }

            status.textContent = `${inseridos} importado(s) • ${jaExistiam} já existiam • ${repetidosArquivo} repetido(s) no arquivo` +
                (semCoord ? ` • ${semCoord} sem coordenadas (não aparecem no mapa)` : '') + '.';
            showToast('Base IBGE importada', `${inseridos} registro(s) novo(s).`, 'success', 5000);
            fileInput.value = '';
            atualizarCamadaIbge();     // se já há um logradouro selecionado, atualiza o mapa
        } catch (err) {
            console.error('[IBGE] Erro na importação:', err);
            status.textContent = `Erro: ${err.message}`;
            showToast('Erro na importação', err.message, 'error', 8000);
        } finally {
            btn.disabled = false;
        }
    });
})();

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    iniciar().catch(err => {
        console.error('Erro na inicialização:', err);
        showToast('Erro ao iniciar', err.message, 'error');
    });
});

// ============================================
// PADRONIZAR ENDEREÇOS DO REPORT (.xlsx)
// Lê a coluna F (a partir de F5) da planilha "report", converte cada endereço para o
// padrão "Logradouro fachada, Bairro, Cidade - UF (CEP)" + "Complemento N: ..." e grava
// o resultado na coluna A (título "Endereço Padrão"). Devolve a planilha para download.
// A planilha original é preservada (formatação, colunas e demais abas): só a coluna A muda.
// ============================================
(function padronizarEnderecoReport() {
    const COL_ORIGEM = 'F';
    const COL_DESTINO = 'A';
    const LINHA_CABECALHO = 4;
    const LINHA_INICIAL = 5;
    const TITULO = 'Endereço Padrão';
    const LARGURA_COLUNA_A = 62;
    const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const NS_XML = 'http://www.w3.org/XML/1998/namespace';

    // ---------- Formatação do endereço ----------
    const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

    function titulo(texto) {
        const palavras = String(texto || '').trim().toLowerCase().replace(/\s+/g, ' ')
            .replace(/(^|[\s\-\/(.])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase())
            .split(' ');
        return palavras.map((p, i) => {
            const baixa = p.toLowerCase();
            if (i > 0 && MINUSCULAS.has(baixa)) return baixa;
            if (/^[IVX]{2,}$/i.test(p)) return p.toUpperCase();   // algarismos romanos (Vila Nova II)
            return p;
        }).join(' ');
    }

    function formatarCep(digitos) {
        const d = String(digitos || '').replace(/\D/g, '');
        return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
    }

    // Entrada: "AVENIDA RIO AMAZONAS, 3254, Casa 122, ESTADOS, FAZENDA RIO GRANDE - PR 83830289 "
    // Retorno: { texto, ok }  (ok=false => fora do padrão; devolve o original sem alterar)
    function formatarEnderecoPadrao(bruto) {
        const original = String(bruto == null ? '' : bruto).replace(/\s+/g, ' ').trim();
        if (!original) return { texto: '', ok: true, vazio: true };

        const partes = original.split(',').map(p => p.trim());
        if (partes.length < 4) return { texto: original, ok: false };

        const ultima = partes[partes.length - 1];                   // "CIDADE - UF 12345678"
        const bairro = partes[partes.length - 2];
        const m = ultima.match(/^(.*?)\s*-\s*([A-Za-z]{2})\b\s*(\d{5}-?\d{3})?\s*$/);
        if (!m || !m[1] || !bairro) return { texto: original, ok: false };

        const logradouro = partes[0];
        const fachada = partes[1];
        const complementos = partes.slice(2, -2).filter(Boolean);
        const cidade = titulo(m[1]);
        const uf = m[2].toUpperCase();
        const cep = m[3] ? formatarCep(m[3]) : '';

        const rua = [titulo(logradouro), /^s\/?n$/i.test(fachada) ? 'S/N' : fachada].filter(Boolean).join(' ');
        let linha1 = `${rua}, ${titulo(bairro)}, ${cidade} - ${uf}`;
        if (cep) linha1 += ` (${cep})`;

        const linhas = [linha1];
        complementos.forEach((c, i) => linhas.push(`Complemento ${i + 1}: ${c}`));
        return { texto: linhas.join('\n'), ok: true, complementos: complementos.length };
    }

    // ---------- Leitura/escrita do .xlsx (JSZip + XML) ----------
    const filhos = (el, nome) => Array.from(el.getElementsByTagNameNS('*', nome));
    const parseXml = (txt) => new DOMParser().parseFromString(txt, 'application/xml');
    const serializar = (doc) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        new XMLSerializer().serializeToString(doc).replace(/^<\?xml[^>]*\?>\s*/, '');

    function textoDe(el) {
        return filhos(el, 't').filter(t => t.parentNode.localName !== 'rPh').map(t => t.textContent).join('');
    }

    async function caminhoDaPrimeiraAba(zip) {
        const wb = parseXml(await zip.file('xl/workbook.xml').async('string'));
        const aba = filhos(wb, 'sheet')[0];
        const rid = aba && aba.getAttributeNS(NS_REL, 'id');
        if (rid && zip.file('xl/_rels/workbook.xml.rels')) {
            const rels = parseXml(await zip.file('xl/_rels/workbook.xml.rels').async('string'));
            const rel = filhos(rels, 'Relationship').find(r => r.getAttribute('Id') === rid);
            if (rel) {
                const alvo = rel.getAttribute('Target').replace(/^\//, '');
                const caminho = alvo.startsWith('xl/') ? alvo : 'xl/' + alvo;
                if (zip.file(caminho)) return caminho;
            }
        }
        return 'xl/worksheets/sheet1.xml';
    }

    async function lerTextosCompartilhados(zip) {
        const arq = zip.file('xl/sharedStrings.xml');
        if (!arq) return [];
        return filhos(parseXml(await arq.async('string')), 'si').map(textoDe);
    }

    function valorDaCelula(c, compartilhados) {
        const tipo = c.getAttribute('t');
        if (tipo === 'inlineStr') return textoDe(c);
        const v = filhos(c, 'v')[0];
        if (!v) return '';
        if (tipo === 's') return compartilhados[parseInt(v.textContent, 10)] || '';
        return v.textContent;
    }

    function celulaDoRow(row, ref) {
        return Array.from(row.children).find(c => c.localName === 'c' && c.getAttribute('r') === ref) || null;
    }

    function escreverTexto(doc, row, ref, texto, estilo) {
        const ns = doc.documentElement.namespaceURI;
        let c = celulaDoRow(row, ref);
        if (!c) {
            c = doc.createElementNS(ns, 'c');
            c.setAttribute('r', ref);
            row.insertBefore(c, row.firstChild);                   // coluna A é sempre a primeira
        }
        while (c.firstChild) c.removeChild(c.firstChild);
        c.setAttribute('t', 'inlineStr');
        if (estilo != null) c.setAttribute('s', String(estilo));
        const is = doc.createElementNS(ns, 'is');
        const t = doc.createElementNS(ns, 't');
        t.setAttributeNS(NS_XML, 'xml:space', 'preserve');
        t.textContent = texto;
        is.appendChild(t);
        c.appendChild(is);
    }

    // Cria um estilo de célula igual ao da coluna F (fonte/borda), alinhado à esquerda e com quebra de linha
    function criarEstiloEndereco(stylesDoc, estiloBase) {
        const cellXfs = filhos(stylesDoc, 'cellXfs')[0];
        const xfs = Array.from(cellXfs.children).filter(x => x.localName === 'xf');
        const base = xfs[estiloBase] || xfs[0];
        const novo = base.cloneNode(true);
        Array.from(novo.children).filter(x => x.localName === 'alignment').forEach(x => novo.removeChild(x));
        const al = stylesDoc.createElementNS(stylesDoc.documentElement.namespaceURI, 'alignment');
        al.setAttribute('horizontal', 'left');
        al.setAttribute('vertical', 'center');
        al.setAttribute('wrapText', '1');
        novo.appendChild(al);
        novo.setAttribute('applyAlignment', '1');
        cellXfs.appendChild(novo);
        cellXfs.setAttribute('count', String(xfs.length + 1));
        return xfs.length;
    }

    async function padronizarPlanilha(arrayBuffer) {
        if (typeof JSZip === 'undefined') throw new Error('JSZip não carregado.');
        const zip = await JSZip.loadAsync(arrayBuffer);
        if (!zip.file('xl/workbook.xml')) throw new Error('Arquivo não é uma planilha .xlsx válida.');

        const caminhoAba = await caminhoDaPrimeiraAba(zip);
        const compartilhados = await lerTextosCompartilhados(zip);
        const sheet = parseXml(await zip.file(caminhoAba).async('string'));
        const styles = parseXml(await zip.file('xl/styles.xml').async('string'));

        const linhas = filhos(sheet, 'row');
        const rowDe = (n) => linhas.find(r => parseInt(r.getAttribute('r'), 10) === n);

        // estilos: cabeçalho copia o da coluna F do cabeçalho; dados usam novo estilo baseado em F5
        const estiloCab = (() => { const r = rowDe(LINHA_CABECALHO); const c = r && celulaDoRow(r, COL_ORIGEM + LINHA_CABECALHO); return c ? c.getAttribute('s') : null; })();
        const estiloF5 = (() => { const r = rowDe(LINHA_INICIAL); const c = r && celulaDoRow(r, COL_ORIGEM + LINHA_INICIAL); return c && c.getAttribute('s') ? parseInt(c.getAttribute('s'), 10) : 0; })();
        const estiloDados = criarEstiloEndereco(styles, estiloF5);

        const rowCab = rowDe(LINHA_CABECALHO);
        if (rowCab) escreverTexto(sheet, rowCab, COL_DESTINO + LINHA_CABECALHO, TITULO, estiloCab);

        let total = 0, convertidos = 0;
        const foraDoPadrao = [];
        linhas.forEach(row => {
            const n = parseInt(row.getAttribute('r'), 10);
            if (n < LINHA_INICIAL) return;
            const cel = celulaDoRow(row, COL_ORIGEM + n);
            if (!cel) return;
            const bruto = valorDaCelula(cel, compartilhados);
            if (!String(bruto).trim()) return;
            total++;
            const r = formatarEnderecoPadrao(bruto);
            if (r.ok) convertidos++; else foraDoPadrao.push(n);
            escreverTexto(sheet, row, COL_DESTINO + n, r.texto, estiloDados);
            // garante altura suficiente para as linhas de complemento
            const linhasTexto = r.texto.split('\n').length;
            const ht = parseFloat(row.getAttribute('ht'));
            const precisa = linhasTexto * 12 + 10;
            if (!isNaN(ht) && ht < precisa) { row.setAttribute('ht', String(precisa)); row.setAttribute('customHeight', '1'); }
        });

        // alarga a coluna A (no arquivo original ela é só uma margem estreita)
        const colA = filhos(sheet, 'col').find(c => c.getAttribute('min') === '1' && c.getAttribute('max') === '1');
        if (colA) { colA.setAttribute('width', String(LARGURA_COLUNA_A)); colA.setAttribute('customWidth', '1'); }

        zip.file(caminhoAba, serializar(sheet));
        zip.file('xl/styles.xml', serializar(styles));
        const blob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            compression: 'DEFLATE'
        });
        return { blob, total, convertidos, foraDoPadrao };
    }

    window.PadronizarEndereco = { formatarEnderecoPadrao, padronizarPlanilha };

    // ---------- Botão do cabeçalho ----------
    const btn = document.getElementById('padronizarEnderecoBtn');
    const input = document.getElementById('padronizarEnderecoInput');
    if (!btn || !input) return;

    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', async () => {
        const arquivo = input.files && input.files[0];
        input.value = '';
        if (!arquivo) return;
        if (!/\.xlsx$/i.test(arquivo.name)) {
            showToast('Arquivo inválido', 'Selecione a planilha report no formato .xlsx.', 'error');
            return;
        }
        try {
            showToast('Processando planilha…', arquivo.name, 'info', 2000);
            const res = await padronizarPlanilha(await arquivo.arrayBuffer());
            if (!res.total) {
                showToast('Nenhum endereço encontrado', 'Não há valores na coluna F a partir da linha 5.', 'warning', 6000);
                return;
            }
            const nome = arquivo.name.replace(/\.xlsx$/i, '') + '_endereco_padrao.xlsx';
            const url = URL.createObjectURL(res.blob);
            const a = document.createElement('a');
            a.href = url; a.download = nome;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            if (res.foraDoPadrao.length) {
                showToast('Planilha gerada com avisos',
                    `${res.convertidos} de ${res.total} endereços padronizados. ${res.foraDoPadrao.length} fora do padrão foram mantidos como estavam (linhas: ${res.foraDoPadrao.slice(0, 10).join(', ')}${res.foraDoPadrao.length > 10 ? '…' : ''}).`,
                    'warning', 9000);
            } else {
                showToast('Planilha gerada', `${res.total} endereços padronizados na coluna A. Download iniciado.`, 'success', 5000);
            }
        } catch (err) {
            console.error('Erro ao padronizar planilha:', err);
            showToast('Erro ao processar a planilha', err.message, 'error', 7000);
        }
    });
})();
