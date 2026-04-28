// ============================================================
// ponto.js — Módulo Ponto (frontend)
// VelvetMed Angola App
// ============================================================

const Ponto = (() => {

  let _estadoAtual = null; // { entrada_aberta, entrada }

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
      // offline — tentar a partir do localStorage
      _renderOffline();
    }

    // Carregar histórico do dia
    await _carregarDia();
  }

  function _renderEstado() {
    const body = document.getElementById('ponto-body');
    if (!body) return;

    const aberta = _estadoAtual.entrada_aberta;
    const entrada = _estadoAtual.entrada;

    body.innerHTML = `
      <div class="ponto-status ponto-status--${aberta ? 'dentro' : 'fora'}">
        <span class="ponto-status__icon">${aberta ? '🟢' : '🔴'}</span>
        <span class="ponto-status__text">
          ${aberta
            ? `Em serviço desde ${entrada ? entrada.HORA_ENTRADA : '—'}`
            : 'Fora de serviço'}
        </span>
      </div>

      <div class="ponto-actions">
        ${!aberta ? `
          <button class="btn btn--primary btn--full ponto-btn" id="btn-entrada">
            ⏱ Marcar Entrada
          </button>` : `
          <button class="btn btn--danger btn--full ponto-btn" id="btn-saida">
            ⏹ Marcar Saída
          </button>`}
      </div>

      <div id="ponto-historico" class="ponto-historico">
        <p class="section-label">Registos de hoje</p>
        <div id="ponto-lista" class="loading-inline">A carregar…</div>
      </div>`;

    if (!aberta) {
      document.getElementById('btn-entrada').addEventListener('click', () => _marcar('ENTRADA'));
    } else {
      document.getElementById('btn-saida').addEventListener('click', () => _marcar('SAIDA'));
    }
  }

  function _renderOffline() {
    document.getElementById('ponto-body').innerHTML = `
      <div class="alert alert--warning">
        Sem ligação. O ponto será sincronizado quando houver rede.
      </div>
      <div class="ponto-actions">
        <button class="btn btn--primary btn--full" id="btn-entrada-off">
          ⏱ Marcar Entrada
        </button>
        <button class="btn btn--danger btn--full" id="btn-saida-off" style="margin-top:12px">
          ⏹ Marcar Saída
        </button>
      </div>`;

    document.getElementById('btn-entrada-off').addEventListener('click', () => _marcar('ENTRADA'));
    document.getElementById('btn-saida-off').addEventListener('click', () => _marcar('SAIDA'));
  }

  async function _marcar(tipo) {
    const btn = document.getElementById(tipo === 'ENTRADA' ? 'btn-entrada' : 'btn-saida')
             || document.getElementById(tipo === 'ENTRADA' ? 'btn-entrada-off' : 'btn-saida-off');
    if (btn) { btn.disabled = true; btn.textContent = 'A registar…'; }

    // Obter GPS
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
          Utils.toast(`${tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} registada ✓`, 'success');
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
    Sync.enqueue('ponto_marcar', { tipo, lat, lng });
    Utils.toast(`${tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} guardada — sincroniza quando houver rede`, 'warning', 4000);
    // Atualizar UI localmente
    if (document.getElementById('ponto-body')) _renderOffline();
  }

  async function _carregarDia() {
    const lista = document.getElementById('ponto-lista');
    if (!lista) return;

    try {
      const res = await API.pontoDia(Auth.getToken(), Utils.hoje());
      if (!res.ok || !res.registos.length) {
        lista.innerHTML = '<p class="empty-state">Sem registos hoje</p>';
        return;
      }
      lista.innerHTML = res.registos.map(r => `
       `<div class="ponto-item">
  <span class="ponto-item__tipo">▶ ${r.HORA_ENTRADA ? String(r.HORA_ENTRADA).substring(0,5) : '—'} → ${r.HORA_SAIDA ? String(r.HORA_SAIDA).substring(0,5) : 'em curso'}</span>
  ${r.DURACAO_MINUTOS ? `<span class="ponto-item__dur">${Utils.formatDuracao(r.DURACAO_MINUTOS)}</span>` : ''}
</div>`.join('');
    } catch(e) {
      lista.innerHTML = '<p class="empty-state">Sem ligação</p>';
    }
  }

  return { render };
})();
