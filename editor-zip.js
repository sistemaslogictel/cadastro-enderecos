// ============================================
// 7. EDITAR ZIP EM LOTE (todos os logins)
// Lê um ZIP exportado (moradiaN/moradiaN.xml), grava o nº do survey em <gravado>,
// permite edição individual/em lote e gera um novo ZIP.
// Depende de script.js: showToast, COMPLEMENTO_LISTA, TIPO_IMOVEL_LISTA, JSZip.
// ============================================
(function () {
    const $ = (id) => document.getElementById(id);
    if (!$('editZipPanel')) return;

    // ---------- estilos ----------
    const st = document.createElement('style');
    st.textContent = `
    .ez-row{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start;margin-bottom:12px}
    .ez-row textarea{flex:1;min-width:160px;min-height:110px;padding:8px 10px;font:inherit;border:1px solid var(--border-color,#cbd5e0);border-radius:8px;background:var(--bg-secondary,#f5f7fa);color:inherit;resize:vertical}
    .ez-box{border:1px solid var(--border-color,#e2e8f0);border-radius:10px;padding:12px;margin:12px 0;background:var(--bg-secondary,#f5f7fa)}
    .ez-box h3{font-size:14px;margin:0 0 8px}
    .ez-item{border:1px solid var(--border-color,#e2e8f0);border-radius:10px;margin-bottom:8px;background:var(--bg-primary,#fff)}
    .ez-head{display:flex;gap:8px;align-items:center;padding:8px 10px;flex-wrap:wrap}
    .ez-head .ez-sv{width:90px;font-weight:700}
    .ez-head .ez-res{flex:1;min-width:140px;font-size:13px;opacity:.85}
    .ez-grid{display:none;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px;padding:0 10px 10px}
    .ez-item.open .ez-grid{display:grid}
    .ez-grid label{font-size:12px;display:flex;flex-direction:column;gap:3px}
    .ez-grid input,.ez-grid select,.ez-head input[type=text],.ez-box input[type=text],.ez-box select{padding:6px 8px;font:inherit;border:1px solid var(--border-color,#cbd5e0);border-radius:6px;background:var(--bg-secondary,#f5f7fa);color:inherit}
    .ez-comp{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .ez-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}
    .ez-sem{border-color:#e53e3e}
    `;
    document.head.appendChild(st);

    // ---------- estado ----------
    let zip = null, zipNome = 'surveys', itens = [];
    const NCOMP = 5;
    const CAMPOS = [
        { k: 'logradouro', l: 'Logradouro', up: 1 },
        { k: 'numero_fachada', l: 'Nº fachada', up: 1 },
        { k: 'bairro', l: 'Bairro', up: 1 },
        { k: 'cep', l: 'CEP' },
        { k: 'localidade', l: 'Localidade' },
        { k: 'zona', l: 'Zona' },
        { k: 'id_roteiro', l: 'ID roteiro' },
        { k: 'id_localidade', l: 'ID localidade' },
        { k: 'cod_lograd', l: 'Cód. logradouro' },
        { k: 'numPisos', l: 'Pisos' },
        { k: 'arg_imovel', l: 'Imóvel (argumento)' },
        { k: 'observacoes', l: 'Observações' }
    ];
    const ESC = (s) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const UNESC = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
    const h = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const toast = (a, b, c) => (typeof showToast === 'function' ? showToast(a, b, c || 'info') : alert(a + ' ' + (b || '')));

    // ---------- leitura/escrita de tags no texto do XML ----------
    const bloco = (xml) => { const m = xml.match(/<enderecoEdificio>[\s\S]*?<\/enderecoEdificio>/); return m ? m[0] : ''; };
    const getTag = (txt, tag) => { const m = txt.match(new RegExp('<' + tag + '>([\\s\\S]*?)</' + tag + '>')); return m ? UNESC(m[1]) : ''; };
    const EOL = (xml) => (xml.includes('\r\n') ? '\r\n' : '\n');
    const OPCIONAIS = ['arg_imovel', 'observacoes', 'id_tipo_imovel'];
    const ANCORAS = { id_tipo_imovel: ['numero_fachada'], arg_imovel: ['id_tipo_imovel', 'numero_fachada'], observacoes: ['data'] };

    function setTag(xml, tag, val) {
        val = String(val ?? '');
        const re = new RegExp('<' + tag + '>[\\s\\S]*?</' + tag + '>');
        if (re.test(xml)) {
            if (!val && OPCIONAIS.includes(tag)) return xml.replace(new RegExp('[ \\t]*<' + tag + '>[\\s\\S]*?</' + tag + '>(\\r?\\n)?'), '');
            return xml.replace(re, () => '<' + tag + '>' + ESC(val) + '</' + tag + '>');
        }
        if (!val) return xml;
        for (const a of (ANCORAS[tag] || [])) {
            const m = xml.match(new RegExp('([ \\t]*)<' + a + '>[\\s\\S]*?</' + a + '>'));
            if (m) return xml.replace(m[0], () => m[0] + EOL(xml) + m[1] + '<' + tag + '>' + ESC(val) + '</' + tag + '>');
        }
        return xml;
    }

    function lerCampos(xml) {
        const b = bloco(xml);
        const f = {
            logradouro: getTag(b, 'logradouro'), numero_fachada: getTag(b, 'numero_fachada'), bairro: getTag(b, 'bairro'),
            cep: getTag(b, 'cep'), id_roteiro: getTag(b, 'id_roteiro'), id_localidade: getTag(b, 'id_localidade'),
            cod_lograd: getTag(b, 'cod_lograd'), arg_imovel: getTag(b, 'arg_imovel'), id_tipo_imovel: getTag(b, 'id_tipo_imovel'),
            localidade: getTag(xml, 'localidade'), zona: getTag(xml, 'nomeZona') || getTag(xml, 'codigoZona'),
            numPisos: getTag(xml, 'numPisos'), observacoes: getTag(xml, 'observacoes'), comps: []
        };
        for (let n = 1; n <= 12; n++) {
            const id = getTag(b, 'id_complemento' + n), arg = getTag(b, 'argumento' + n);
            if (id || arg) f.comps.push({ id, arg });
        }
        while (f.comps.length < NCOMP) f.comps.push({ id: '', arg: '' });
        return f;
    }

    function montarXml(it) {
        let xml = it.xml;
        const f = it.f, eol = EOL(xml);
        xml = setTag(xml, 'gravado', it.survey || 'false');
        // bloco do endereço
        let b = bloco(xml), nb = b;
        ['logradouro', 'numero_fachada', 'id_tipo_imovel', 'arg_imovel', 'cep', 'bairro', 'id_roteiro', 'id_localidade', 'cod_lograd']
            .forEach(k => { nb = setTag(nb, k, f[k]); });
        // complementos: remove todos e regrava em sequência antes de <cep>
        nb = nb.replace(/[ \t]*<(id_complemento|argumento)\d+>[\s\S]*?<\/\1\d+>(\r?\n)?/g, '');
        const validos = f.comps.filter(c => String(c.id).trim() || String(c.arg).trim());
        const ind = (nb.match(/([ \t]*)<cep>/) || [, '    '])[1];
        const txt = validos.map((c, i) => ind + '<id_complemento' + (i + 1) + '>' + ESC(c.id) + '</id_complemento' + (i + 1) + '>' + eol +
            ind + '<argumento' + (i + 1) + '>' + ESC(c.arg) + '</argumento' + (i + 1) + '>' + eol).join('');
        nb = nb.replace(/([ \t]*)<cep>/, () => txt + ind + '<cep>');
        if (b) xml = xml.replace(b, () => nb);
        ['localidade', 'numPisos', 'observacoes'].forEach(k => { xml = setTag(xml, k, f[k]); });
        xml = setTag(xml, 'codigoZona', f.zona);
        xml = setTag(xml, 'nomeZona', f.zona);
        return xml.replace(/<([A-Za-z_][\w.\-]*)\s*\/>/g, '<$1></$1>'); // nunca tags auto-fechadas
    }

    // ---------- listas ----------
    const nomeTipoImovel = (id) => { const x = (typeof TIPO_IMOVEL_LISTA !== 'undefined' ? TIPO_IMOVEL_LISTA : []).find(a => String(a[1]) === String(id)); return x ? x[0] : ''; };
    const optsTipoImovel = (sel) => '<option value="">— nenhum —</option>' + (typeof TIPO_IMOVEL_LISTA !== 'undefined' ? TIPO_IMOVEL_LISTA : [])
        .map(([n, id]) => `<option value="${id}"${String(id) === String(sel) ? ' selected' : ''}>${h(n)}</option>`).join('') +
        (sel && !nomeTipoImovel(sel) ? `<option value="${h(sel)}" selected>(id ${h(sel)})</option>` : '');
    const compOk = (id) => (typeof COMPLEMENTO_LISTA !== 'undefined' ? COMPLEMENTO_LISTA : []).some(a => String(a[1]) === String(id));
    const optsComp = (sel, vazio) => `<option value="">${vazio || '— nenhum —'}</option>` + (typeof COMPLEMENTO_LISTA !== 'undefined' ? COMPLEMENTO_LISTA : [])
        .map(([n, id]) => `<option value="${id}"${String(id) === String(sel) ? ' selected' : ''}>${h(n)}</option>`).join('') +
        (sel && !compOk(sel) ? `<option value="${h(sel)}" selected>(id ${h(sel)})</option>` : '');

    // ---------- carregar ZIP ----------
    async function carregar() {
        const file = $('ezFile').files[0];
        if (!file) return toast('Nenhum ZIP', 'Selecione o arquivo .zip.', 'warning');
        if (typeof JSZip === 'undefined') return toast('Erro', 'JSZip não carregado.', 'error');
        const codigos = $('ezSurveys').value.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
        try {
            zip = await JSZip.loadAsync(file);
        } catch (e) { return toast('Erro', 'O arquivo não parece ser um ZIP válido.', 'error'); }
        zipNome = file.name.replace(/\.zip$/i, '');
        const caminhos = Object.keys(zip.files).filter(n => !zip.files[n].dir && /\.xml$/i.test(n) && !/^__MACOSX/.test(n));
        const numDe = (p) => { const m = p.match(/moradia\s*(\d+)/i); return m ? parseInt(m[1], 10) : 1e9; };
        caminhos.sort((a, b) => numDe(a) - numDe(b) || a.localeCompare(b, undefined, { numeric: true }));
        itens = [];
        for (const p of caminhos) {
            const xml = (await zip.files[p].async('string')).replace(/^\uFEFF/, '');
            if (!/<edificio[\s>]/.test(xml)) continue;
            itens.push({ path: p, xml, f: lerCampos(xml), survey: '', sel: true, open: false });
        }
        if (!itens.length) return toast('Sem XML', 'Nenhum XML de edifício encontrado no ZIP.', 'error');
        itens.forEach((it, i) => { it.survey = codigos[i] || ''; });
        if (codigos.length !== itens.length)
            toast('Atenção', `${itens.length} moradia(s) no ZIP e ${codigos.length} número(s) de survey informados.`, 'warning');
        render();
        $('ezWork').style.display = '';
        $('ezStatus').textContent = `${itens.length} survey(s) carregado(s) de ${file.name}.`;
    }

    // ---------- render ----------
    const resumo = (it) => `${it.f.logradouro || '(sem logradouro)'}, ${it.f.numero_fachada || 'SN'}${it.f.bairro ? ' — ' + it.f.bairro : ''}`;
    const pasta = (p) => (p.match(/moradia\s*\d+/i) || [p.split('/').pop()])[0];

    function render() {
        const lista = $('ezList');
        lista.innerHTML = itens.map((it, i) => {
            const f = it.f;
            const campos = CAMPOS.map(c => `<label>${c.l}<input type="text" data-i="${i}" data-k="${c.k}" value="${h(f[c.k])}"></label>`).join('');
            const comps = f.comps.slice(0, Math.max(NCOMP, f.comps.length)).map((c, n) =>
                `<div class="ez-comp"><label>Complemento ${n + 1} (tipo)<select data-i="${i}" data-c="${n}" data-p="id">${optsComp(c.id)}</select></label>` +
                `<label>Complemento ${n + 1} (valor)<input type="text" data-i="${i}" data-c="${n}" data-p="arg" value="${h(c.arg)}"></label></div>`).join('');
            return `<div class="ez-item${it.open ? ' open' : ''}" data-i="${i}">
                <div class="ez-head">
                    <input type="checkbox" class="ez-sel" data-i="${i}"${it.sel ? ' checked' : ''} aria-label="Selecionar">
                    <input type="text" class="ez-sv${it.survey ? '' : ' ez-sem'}" data-i="${i}" data-sv="1" value="${h(it.survey)}" placeholder="Survey">
                    <span class="ez-res" id="ezRes${i}"><b>${h(pasta(it.path))}</b> · ${h(resumo(it))}</span>
                    <button type="button" class="btn-secondary" data-tog="${i}">Editar</button>
                </div>
                <div class="ez-grid">${campos}
                    <label>Tipo de imóvel<select data-i="${i}" data-k="id_tipo_imovel">${optsTipoImovel(f.id_tipo_imovel)}</select></label>
                    ${comps}
                </div></div>`;
        }).join('');
    }

    // ---------- eventos da lista ----------
    $('ezList').addEventListener('click', (e) => {
        const t = e.target.closest('[data-tog]'); if (!t) return;
        const i = +t.dataset.tog; itens[i].open = !itens[i].open;
        t.closest('.ez-item').classList.toggle('open', itens[i].open);
    });
    $('ezList').addEventListener('input', (e) => {
        const el = e.target, i = el.dataset.i; if (i === undefined) return;
        const it = itens[+i];
        if (el.classList.contains('ez-sel')) { it.sel = el.checked; return; }
        if (el.dataset.sv) { it.survey = el.value.trim(); el.classList.toggle('ez-sem', !it.survey); return; }
        if (el.dataset.c !== undefined) it.f.comps[+el.dataset.c][el.dataset.p] = el.value;
        else {
            const c = CAMPOS.find(x => x.k === el.dataset.k);
            it.f[el.dataset.k] = el.value;
            if (c && c.up) it.f[el.dataset.k] = el.value.toUpperCase();
        }
        const r = $('ezRes' + i); if (r) r.innerHTML = `<b>${h(pasta(it.path))}</b> · ${h(resumo(it))}`;
    });
    $('ezList').addEventListener('change', (e) => { if (e.target.classList.contains('ez-sel')) itens[+e.target.dataset.i].sel = e.target.checked; });

    // ---------- edição em lote ----------
    const campoLote = $('ezCampo');
    campoLote.innerHTML = CAMPOS.map(c => `<option value="${c.k}">${c.l}</option>`).join('') +
        '<option value="id_tipo_imovel">Tipo de imóvel</option>' +
        Array.from({ length: NCOMP }, (_, n) => `<option value="comp${n}">Complemento ${n + 1}</option>`).join('');
    function atualizaLote() {
        const k = campoLote.value, ehComp = k.startsWith('comp'), ehTipo = k === 'id_tipo_imovel';
        $('ezValorBox').innerHTML = ehTipo ? `<select id="ezValor">${optsTipoImovel('')}</select>`
            : ehComp ? `<select id="ezValorTipo">${optsComp('', '— manter tipo —')}</select> <input type="text" id="ezValor" placeholder="valor (vazio = manter)">`
            : '<input type="text" id="ezValor" placeholder="novo valor">';
    }
    campoLote.addEventListener('change', atualizaLote); atualizaLote();

    $('ezSelTodos').addEventListener('change', (e) => { itens.forEach(it => it.sel = e.target.checked); document.querySelectorAll('.ez-sel').forEach(c => c.checked = e.target.checked); });

    $('ezAplicar').addEventListener('click', () => {
        const alvo = itens.filter(it => it.sel);
        if (!alvo.length) return toast('Nada selecionado', 'Marque ao menos um survey.', 'warning');
        const k = campoLote.value, ehComp = k.startsWith('comp');
        let v = ($('ezValor').value || '').trim();
        if (ehComp) {
            const n = +k.slice(4), tipo = $('ezValorTipo').value;
            if (!tipo && !v) return toast('Vazio', 'Informe o tipo e/ou o valor do complemento.', 'warning');
            alvo.forEach(it => { if (tipo) it.f.comps[n].id = tipo; if (v) it.f.comps[n].arg = v; });
        } else {
            if (!v && k !== 'id_tipo_imovel' && !confirm(`Limpar este campo em ${alvo.length} survey(s)?`)) return;
            const c = CAMPOS.find(x => x.k === k); if (c && c.up) v = v.toUpperCase();
            alvo.forEach(it => { it.f[k] = v; });
        }
        render();
        toast('Lote aplicado', `${alvo.length} survey(s) atualizado(s).`, 'success');
    });

    // ---------- gerar novo ZIP ----------
    async function gerar() {
        if (!zip || !itens.length) return;
        const sem = itens.filter(it => !it.survey).length;
        if (sem && !confirm(`${sem} survey(s) sem número (<gravado> ficará "false"). Continuar?`)) return;
        itens.forEach(it => zip.file(it.path, montarXml(it)));
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = zipNome + '_editado.zip';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        toast('ZIP gerado', zipNome + '_editado.zip', 'success');
    }

    $('ezCarregar').addEventListener('click', carregar);
    $('ezGerar').addEventListener('click', gerar);
})();
