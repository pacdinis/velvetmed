// ============================================================
// visita-farmacia.js — Módulo Visita Farmácia
// VelvetMed Angola App
// ============================================================

const VisitaFarmacia = (() => {

  let _visita     = null;  // visita em aberto
  let _farmacia   = null;  // farmácia seleccionada
  let _gps        = null;
  let _gpsTimer   = null;

  // ── Ecrã de selecção de farmácia ─────────────────────────

  async function render() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="page">
        <div class="page-header">
          <button class="btn-back" onclick="App.renderMenu()">&#8592;</button>
          <h1 class="page-title">Visita Farmácia</h1>
        </div>
        <div id="vf-body">
          <div class="loading-inline">A verificar…</div>
        </div>
      </div>`;

    // Verificar se há visita em aberto
    try {
      const res = await API.get({ action: 'visita_aberta', token: Auth.getToken() });
      if (res.ok && res.visita) {
        _visita = res.visita;
        _renderFormulario();
        return;
      }
    } catch(e) {}

    _renderSeleccao();
  }

  function _renderSeleccao() {
    const farmacias = Store.getFarmacias();
    const body = document.getElementById('vf-body');

    var listHtml = '';
    if (!farmacias.length) {
      listHtml = '<p class="empty-state">Sem farmácias atribuídas.<br>Crie uma primeiro.</p>';
    } else {
      farmacias.forEach(function(f) {
        const id    = f['ID_FARMACIA'] || '';
        const nome  = f['NOME_FARMACIA'] || '';
        const local = f['LOCAL_FARMACIA'] || '';
        listHtml += '<div class="list-item" onclick="VisitaFarmacia.selecionarFarmacia(\'' + Utils.escHtml(id) + '\')">'
          + '<div class="list-item__icon">💊</div>'
          + '<div class="list-item__info">'
          + '<div class="list-item__name">' + Utils.escHtml(nome) + '</div>'
          + '<div class="list-item__sub">'  + Utils.escHtml(local) + '</div>'
          + '</div>'
          + '<div class="list-item__arrow">›</div>'
          + '</div>';
      });
    }

    body.innerHTML = '<div class="form-group">'
      + '<input class="form-input" type="text" id="vf-pesquisa" placeholder="Pesquisar farmácia..." oninput="VisitaFarmacia.filtrar()">'
      + '</div>'
      + '<div id="vf-lista">' + listHtml + '</div>';
  }

  function filtrar() {
    const q = (document.getElementById('vf-pesquisa').value || '').toLowerCase().trim();
    const farmacias = Store.getFarmacias();
    const lista = document.getElementById('vf-lista');
    if (!lista) return;

    const filtradas = q.length < 2 ? farmacias : farmacias.filter(function(f) {
      return (f['NOME_FARMACIA'] || '').toLowerCase().includes(q) ||
             (f['LOCAL_FARMACIA'] || '').toLowerCase().includes(q);
    });

    if (!filtradas.length) { lista.innerHTML = '<p class="empty-state">Sem resultados</p>'; return; }

    var html = '';
    filtradas.forEach(function(f) {
      const id    = f['ID_FARMACIA'] || '';
      const nome  = f['NOME_FARMACIA'] || '';
      const local = f['LOCAL_FARMACIA'] || '';
      html += '<div class="list-item" onclick="VisitaFarmacia.selecionarFarmacia(\'' + Utils.escHtml(id) + '\')">'
        + '<div class="list-item__icon">💊</div>'
        + '<div class="list-item__info">'
        + '<div class="list-item__name">' + Utils.escHtml(nome) + '</div>'
        + '<div class="list-item__sub">'  + Utils.escHtml(local) + '</div>'
        + '</div><div class="list-item__arrow">›</div></div>';
    });
    lista.innerHTML = html;
  }

  function selecionarFarmacia(id) {
    const farmacias = Store.getFarmacias();
    _farmacia = farmacias.find(function(f) {
      return (f['ID_FARMACIA'] || '') === id;
    });
    if (!_farmacia) return;
    _renderCheckin();
  }

  // ── Ecrã de check-in ─────────────────────────────────────

  function _renderCheckin() {
    const nome  = _farmacia['NOME_FARMACIA'] || _farmacia['NOME'] || '';
    const local = _farmacia['MORADA'] || _farmacia['LOCAL'] || '';
    const body  = document.getElementById('vf-body');

    body.innerHTML = '<div class="ci-box ci-box--wait" id="vf-ci-box">'
      + '<div class="ci-box__title">📍 ' + Utils.escHtml(nome) + '</div>'
      + '<div class="ci-box__row"><span class="ci-box__lbl">Estado GPS</span><span id="vf-gps-badge" class="gps-badge gps-badge--warn">A obter…</span></div>'
      + '<div class="ci-box__row"><span class="ci-box__lbl">Distância</span><span id="vf-dist" class="ci-box__val">--</span></div>'
      + '<div class="ci-box__row"><span class="ci-box__lbl">Local</span><span class="ci-box__val">' + Utils.escHtml(local) + '</span></div>'
      + '</div>'
      + '<button class="btn btn--primary btn--full" id="vf-btn-checkin" onclick="VisitaFarmacia.doCheckin()" disabled style="margin-top:12px">'
      + '▶ Iniciar Visita'
      + '</button>';

    _iniciarGPS();
  }

  function _iniciarGPS() {
    if (_gpsTimer) clearInterval(_gpsTimer);

    function _atualizar() {
      GPS.getPosicao().then(function(pos) {
        _gps = pos;
        _atualizarGPSUI();
      }).catch(function() {
        _gps = null;
        _atualizarGPSUI();
      });
    }

    _atualizar();
    _gpsTimer = setInterval(_atualizar, 5000);
  }

  function _atualizarGPSUI() {
    const badge = document.getElementById('vf-gps-badge');
    const distEl = document.getElementById('vf-dist');
    const btn = document.getElementById('vf-btn-checkin');
    const box = document.getElementById('vf-ci-box');
    if (!badge) { clearInterval(_gpsTimer); return; }

    if (!_gps) {
      badge.textContent = 'GPS indisponível';
      badge.className = 'gps-badge gps-badge--err';
      if (distEl) distEl.textContent = '--';
      if (btn) btn.disabled = true;
      return;
    }

    badge.textContent = 'GPS ±' + Math.round(_gps.precisao || 0) + 'm';
    badge.className = 'gps-badge gps-badge--ok';

    const lat = parseFloat(_farmacia['GPS_LAT'] || _farmacia['LAT'] || 0);
    const lng = parseFloat(_farmacia['GPS_LNG'] || _farmacia['LNG'] || 0);

    if (lat && lng) {
      const dist = Math.round(Utils.distanciaGPS(_gps.lat, _gps.lng, lat, lng));
      const cfg  = Store.getConfigs();
      const raio = parseInt(cfg['RAIO_GEOFENCING_METROS'] || 50, 10);
      const ok   = dist <= raio;
      if (distEl) {
        distEl.textContent = dist + 'm ' + (ok ? '✓' : '✗');
        distEl.style.color = ok ? 'var(--success)' : 'var(--danger)';
      }
      if (box) box.className = 'ci-box ' + (ok ? 'ci-box--ok' : 'ci-box--err');
      if (btn) {
        btn.disabled = false; // sempre permite, GPS_VALIDO fica registado
        btn.textContent = ok ? '▶ Iniciar Visita' : '▶ Iniciar Visita (fora do raio)';
      }
    } else {
      if (distEl) distEl.textContent = 'Sem coordenadas';
      if (btn) btn.disabled = false;
    }
  }

  async function doCheckin() {
    const btn = document.getElementById('vf-btn-checkin');
    if (btn) { btn.disabled = true; btn.textContent = 'A registar…'; }
    if (_gpsTimer) clearInterval(_gpsTimer);

    const lat = _gps ? _gps.lat : '';
    const lng = _gps ? _gps.lng : '';

    // Calcular GPS_VALIDO
    const farmLat = parseFloat(_farmacia['GPS_LAT'] || _farmacia['LAT'] || 0);
    const farmLng = parseFloat(_farmacia['GPS_LNG'] || _farmacia['LNG'] || 0);
    let gpsValido = 'N';
    if (_gps && farmLat && farmLng) {
      const dist = Utils.distanciaGPS(_gps.lat, _gps.lng, farmLat, farmLng);
      const cfg  = Store.getConfigs();
      const raio = parseInt(cfg['RAIO_GEOFENCING_METROS'] || 50, 10);
      gpsValido  = dist <= raio ? 'S' : 'N';
    }

    try {
      const res = await API.post({
        action:      'checkin_farmacia',
        token:       Auth.getToken(),
        id_farmacia: _farmacia['ID_FARMACIA'] || _farmacia['ID'],
        lat, lng,
        gps_valido:  gpsValido
      });

      if (res.ok) {
        _visita = res;
        Utils.toast('Check-in registado ✓', 'success');
        _renderFormulario();
      } else {
        Utils.toast(res.error || 'Erro no check-in', 'error');
        if (btn) { btn.disabled = false; btn.textContent = '▶ Iniciar Visita'; }
      }
    } catch(e) {
      Utils.toast('Erro de ligação', 'error');
      if (btn) { btn.disabled = false; btn.textContent = '▶ Iniciar Visita'; }
    }
  }

  // ── Formulário de visita ──────────────────────────────────

  function _renderFormulario() {
    const nome = _visita.nome_farmacia || (_farmacia && (_farmacia['NOME_FARMACIA'] || _farmacia['NOME'])) || '';
    const hora = _visita.hora_checkin  || '';
    const produtos = Store.getProdutos();
    const distribuidores = _farmacia
      ? Store.getDistribuidoresDeFarmacia(_farmacia['ID_FARMACIA'] || _farmacia['ID'])
      : Store.getDistribuidores();

    var prodsHtml = '';
    produtos.forEach(function(p) {
      const id   = p['ID_PRODUTO'] || '';
      const nome = p['NOME_PRODUTO'] || '';
      prodsHtml += '<div class="chip" id="chip-apres-' + id + '" onclick="VisitaFarmacia.toggleChip(\'apres\',\'' + id + '\')">' + Utils.escHtml(nome) + '</div>';
    });

    var compraHtml = '';
    produtos.forEach(function(p) {
      const id   = p['ID_PRODUTO'] || '';
      const nome = p['NOME_PRODUTO'] || '';
      compraHtml += '<div class="chip" id="chip-compra-' + id + '" onclick="VisitaFarmacia.toggleChip(\'compra\',\'' + id + '\')">' + Utils.escHtml(nome) + '</div>';
    });

    var flyerHtml = '';
    produtos.forEach(function(p) {
      const id   = p['ID_PRODUTO'] || '';
      const nome = p['NOME_PRODUTO'] || '';
      flyerHtml += '<div class="chip" id="chip-flyer-' + id + '" onclick="VisitaFarmacia.toggleChip(\'flyer\',\'' + id + '\')">' + Utils.escHtml(nome) + '</div>';
    });

    var distHtml = '';
    distribuidores.forEach(function(d) {
      const id   = d['ID_DISTRIBUIDOR'] || '';
      const nome = d['NOME_DISTRIBUIDOR'] || '';
      distHtml += '<option value="' + Utils.escHtml(id) + '">' + Utils.escHtml(nome) + '</option>';
    });

    const body = document.getElementById('vf-body');
    body.innerHTML = '<div class="ci-box ci-box--ok" style="margin-bottom:16px">'
      + '<div class="ci-box__title">✓ Em visita — ' + Utils.escHtml(nome) + '</div>'
      + '<div class="ci-box__row"><span class="ci-box__lbl">Check-in</span><span class="ci-box__val">' + hora.substring(0,5) + '</span></div>'
      + '</div>'

      + '<div class="form-group">'
      + '<label class="form-label">Pessoa entrevistada *</label>'
      + '<input class="form-input" type="text" id="vf-pessoa" placeholder="Nome...">'
      + '</div>'

      + '<div class="form-group">'
      + '<label class="form-label">Cargo *</label>'
      + '<input class="form-input" type="text" id="vf-cargo" placeholder="Gerente, Técnico...">'
      + '</div>'

      + '<p class="section-label" style="margin-top:16px">Produtos apresentados</p>'
      + '<div class="chips-group">' + prodsHtml + '</div>'

      + '<p class="section-label" style="margin-top:16px">Intenção de compra</p>'
      + '<div class="chips-group">' + compraHtml + '</div>'

      + '<p class="section-label" style="margin-top:16px">Enviar proforma?</p>'
      + '<div class="toggle-group">'
      + '<button class="toggle-btn" id="pf-nao" onclick="VisitaFarmacia.toggleProforma(false)">Não</button>'
      + '<button class="toggle-btn" id="pf-sim" onclick="VisitaFarmacia.toggleProforma(true)">Sim</button>'
      + '</div>'
      + '<div id="pf-dist-wrap" style="display:none;margin-top:8px">'
      + '<label class="form-label">Distribuidor *</label>'
      + '<select class="form-input" id="vf-distribuidor"><option value="">-- seleccionar --</option>' + distHtml + '</select>'
      + '</div>'

      + '<p class="section-label" style="margin-top:16px">Flyer — produtos a enviar</p>'
      + '<div class="chips-group">' + flyerHtml + '</div>'

      + '<div class="form-group" style="margin-top:16px">'
      + '<label class="form-label">Notas *</label>'
      + '<textarea class="form-input" id="vf-notas" rows="4" placeholder="Notas da visita..."></textarea>'
      + '</div>'

      + '<button class="btn btn--danger btn--full" onclick="VisitaFarmacia.doCheckout()" style="margin-top:8px;margin-bottom:32px">'
      + '⏹ Terminar Visita'
      + '</button>';
  }

  function toggleChip(grupo, id) {
    const el = document.getElementById('chip-' + grupo + '-' + id);
    if (el) el.classList.toggle('chip--selected');
  }

  function toggleProforma(ativo) {
    document.getElementById('pf-sim').classList.toggle('toggle-btn--active', ativo);
    document.getElementById('pf-nao').classList.toggle('toggle-btn--active', !ativo);
    document.getElementById('pf-dist-wrap').style.display = ativo ? '' : 'none';
  }

  function _getChipsSelecionados(grupo) {
    const selecionados = [];
    document.querySelectorAll('.chip--selected[id^="chip-' + grupo + '-"]').forEach(function(el) {
      selecionados.push(el.id.replace('chip-' + grupo + '-', ''));
    });
    return selecionados;
  }

  async function doCheckout() {
    const pessoa = (document.getElementById('vf-pessoa').value || '').trim();
    const cargo  = (document.getElementById('vf-cargo').value  || '').trim();
    const notas  = (document.getElementById('vf-notas').value  || '').trim();

    if (!pessoa) { Utils.toast('Pessoa entrevistada é obrigatório', 'error'); return; }
    if (!cargo)  { Utils.toast('Cargo é obrigatório', 'error'); return; }
    if (!notas)  { Utils.toast('Notas são obrigatórias', 'error'); return; }

    const proformaAtivo = document.getElementById('pf-sim').classList.contains('toggle-btn--active');
    const idDist = proformaAtivo ? (document.getElementById('vf-distribuidor').value || '') : '';
    if (proformaAtivo && !idDist) { Utils.toast('Seleccione o distribuidor para a proforma', 'error'); return; }

    const prodApres  = _getChipsSelecionados('apres');
    const prodCompra = _getChipsSelecionados('compra');
    const prodFlyer  = _getChipsSelecionados('flyer');

    let lat = '', lng = '';
    try { const pos = await GPS.getPosicao(); lat = pos.lat; lng = pos.lng; } catch(e) {}

    Utils.showLoading('A registar checkout…');

    try {
      const res = await API.post({
        action:               'checkout_farmacia',
        token:                Auth.getToken(),
        id_visita:            _visita.id_visita || _visita.ID_REL_FAR,
        lat, lng,
        pessoa_entrevistada:  pessoa,
        cargo,
        notas,
        produtos_apresentados: prodApres,
        intencao_compra:       prodCompra,
        proforma: { ativo: proformaAtivo, id_distribuidor: idDist },
        flyer:    { produtos: prodFlyer }
      });

      Utils.hideLoading();

      if (res.ok) {
        _visita   = null;
        _farmacia = null;
        Utils.toast('Visita concluída ✓ (' + (res.duracao || 0) + ' min)', 'success', 4000);
        App.renderMenu();
      } else {
        Utils.toast(res.error || 'Erro no checkout', 'error');
      }
    } catch(e) {
      Utils.hideLoading();
      Utils.toast('Erro de ligação', 'error');
    }
  }

  return { render, filtrar, selecionarFarmacia, doCheckin, toggleChip, toggleProforma, doCheckout };
})();
