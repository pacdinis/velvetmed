// ============================================================
// ponto.js — Módulo Ponto (frontend)
// VelvetMed Angola App
// ============================================================

const Ponto = (() => {

  let _estadoAtual = null;

  async function render() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="page">
        <div class="page-header">
          <button class="btn-back" onclick="App.renderMenu()">&#8592;</button>
          <h1 class="page-title">Ponto</h1>
        </div>
        <div id="ponto-body" class="ponto-body">
          <div class="loading-inline">A verificar estado…</div>
        </div>
      </div>`;

    await _carregarEstado();
  }

  async function _carregarEstado() {
    try {
      const res = await API.pontoEstado(Auth.getToken());
      if (res.ok) {
        _estadoAtual = res;
        _renderEstado();
      }
    } catch(e) {
      _renderOffline();
    }
    await _carregarDia();
  }

  function _renderEstado() {
    const body = document.getElementById('ponto-body');
    if (!body) return;

    const aberta  = _estadoAtual.entrada_aberta;
    const entrada = _estadoAtual.entrada;

    const hora = entrada && entrada.HORA_ENTRADA
      ? String(entrada.HORA_ENTRADA).substring(0, 5)
      : '—';

    const statusHtml = aberta
      ? '<div class="ponto-status ponto-status--dentro"><span class="ponto-status__icon">🟢</span><span class="ponto-status__text">Em serviço desde ' + hora + '</span></div>'
      : '<div class="ponto-status ponto-status--fora"><span class="ponto-status__icon">🔴</span><span class="ponto-status__text">Fora de serviço</span></div>';

    const btnHtml = aberta
      ? '<button class="btn btn--danger btn--full ponto-btn" id="btn-saida">⏹ Marcar Saída</button>'
      : '<button class="btn btn--primary btn--full ponto-btn" id="btn-entrada">⏱ Marcar Entrada</button>';

    body.innerHTML = statusHtml
      + '<div class="ponto-actions">' + btnHtml + '</div>'
      + '<div id="ponto-historico" class="ponto-historico">'
      + '<p class="section-label">Registos de hoje</p>'
      + '<div id="ponto-lista" class="loading-inline">A carregar…</div>'
      + '</div>';

    if (!aberta) {
      document.getElementById('btn-entrada').addEventListener('click', function() { _marcar('ENTRADA'); });
    } else {
      document.getElementById('btn-saida').addEventListener('click', function() { _marcar('SAIDA'); });
    }
  }

  function _renderOffline() {
    const body = document.getElementById('ponto-body');
    if (!body) return;
    body.innerHTML = '<div class="alert alert--warning">Sem ligação. O ponto será sincronizado quando houver rede.</div>'
      + '<div class="ponto-actions">'
      + '<button class="btn btn--primary btn--full" id="btn-entrada-off">⏱ Marcar Entrada</button>'
      + '<button class="btn btn--danger btn--full" id="btn-saida-off" style="margin-top:12px">⏹ Marcar Saída</button>'
      + '</div>';

    document.getElementById('btn-entrada-off').addEventListener('click', function() { _marcar('ENTRADA'); });
    document.getElementById('btn-saida-off').addEventListener('click', function() { _marcar('SAIDA'); });
  }

  async function _marcar(tipo) {
    const btnId = tipo === 'ENTRADA' ? 'btn-entrada' : 'btn-saida';
    const btnIdOff = tipo === 'ENTRADA' ? 'btn-entrada-off' : 'btn-saida-off';
    const btn = document.getElementById(btnId) || document.getElementById(btnIdOff);
    if (btn) { btn.disabled = true; btn.textContent = 'A registar…'; }

    let lat = '', lng = '';
    try {
      const pos = await GPS.getPosicao();
      lat = pos.lat;
      lng = pos.lng;
    } catch(e) {
      Utils.toast('GPS indisponível — registo sem localização', 'warning');
    }

    if (navigator.onLine) {
      try {
        const res = await API.pontoMarcar(Auth.getToken(), tipo, lat, lng);
        if (res.ok) {
          Utils.toast((tipo === 'ENTRADA' ? 'Entrada' : 'Saída') + ' registada ✓', 'success');
          await _carregarEstado();
        } else {
          Utils.toast(res.error || 'Erro ao registar', 'error');
          if (btn) { btn.disabled = false; btn.textContent = tipo === 'ENTRADA' ? '⏱ Marcar Entrada' : '⏹ Marcar Saída'; }
        }
      } catch(e) {
        _enqueueOffline(tipo, lat, lng);
      }
    } else {
      _enqueueOffline(tipo, lat, lng);
    }
  }

  function _enqueueOffline(tipo, lat, lng) {
    Sync.enqueue('ponto_marcar', { tipo: tipo, lat: lat, lng: lng });
    Utils.toast((tipo === 'ENTRADA' ? 'Entrada' : 'Saída') + ' guardada — sincroniza quando houver rede', 'warning', 4000);
    if (document.getElementById('ponto-body')) _renderOffline();
  }

  async function _carregarDia() {
    const lista = document.getElementById('ponto-lista');
    if (!lista) return;

    try {
      const res = await API.pontoDia(Auth.getToken(), Utils.hoje());
      if (!res.ok || !res.registos || !res.registos.length) {
        lista.innerHTML = '<p class="empty-state">Sem registos hoje</p>';
        return;
      }
      var html = '';
      for (var i = 0; i < res.registos.length; i++) {
        var r = res.registos[i];
        var hEnt = r.HORA_ENTRADA ? String(r.HORA_ENTRADA).substring(0, 5) : '—';
        var hSai = r.HORA_SAIDA  ? String(r.HORA_SAIDA).substring(0, 5)  : 'em curso';
        var dur  = r.DURACAO_MINUTOS ? Utils.formatDuracao(r.DURACAO_MINUTOS) : '';
        html += '<div class="ponto-item">';
        html += '<span class="ponto-item__tipo">▶ ' + hEnt + ' → ' + hSai + '</span>';
        if (dur) html += '<span class="ponto-item__dur">' + dur + '</span>';
        html += '</div>';
      }
      lista.innerHTML = html;
    } catch(e) {
      lista.innerHTML = '<p class="empty-state">Sem ligação</p>';
    }
  }

  return { render };
})();
