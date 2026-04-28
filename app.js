// ============================================================
// app.js — Menu principal, contadores e navegação
// VelvetMed Angola App
// ============================================================

const App = (() => {

  let _filtro = 'hoje'; // 'hoje' | 'semana' | 'mes'
  let _contadores = null;

  // ── Menu principal ────────────────────────────────────────
  async function renderMenu() {
    const delegado = Auth.getDelegado();
    if (!delegado) { Auth.renderLogin(); return; }

    document.getElementById('app').innerHTML = `
      <div class="shell">

        <!-- Topo -->
        <header class="topbar">
          <span class="topbar__brand">VelvetMed</span>
          <span class="topbar__user">${Utils.escHtml(delegado.nome || delegado.id)}</span>
          <span id="sync-indicator" class="sync-indicator sync-indicator--ok" title="Sincronizado">●</span>
        </header>

        <!-- Contadores -->
        <section class="counters">
          <div class="counter-tabs">
            <button class="counter-tab counter-tab--active" data-filtro="hoje">Hoje</button>
            <button class="counter-tab" data-filtro="semana">Semana</button>
            <button class="counter-tab" data-filtro="mes">Mês</button>
          </div>
          <div class="counter-cards" id="counter-cards">
            <div class="counter-card">
              <span class="counter-card__value" id="cnt-visitas">—</span>
              <span class="counter-card__label">Visitas</span>
            </div>
            <div class="counter-card">
              <span class="counter-card__value" id="cnt-flyers">—</span>
              <span class="counter-card__label">Flyers</span>
            </div>
            <div class="counter-card">
              <span class="counter-card__value" id="cnt-proformas">—</span>
              <span class="counter-card__label">Proformas</span>
            </div>
          </div>
        </section>

        <!-- Menu principal -->
        <main id="main-content">
          <div class="menu-grid">
            ${_menuItems(delegado).map(item => `
              <button class="menu-btn" onclick="${item.action}">
                <span class="menu-btn__icon">${item.icon}</span>
                <span class="menu-btn__label">${item.label}</span>
              </button>`).join('')}
          </div>
        </main>

        <!-- Toast -->
        <div id="toast" class="toast"></div>

        <!-- Loading overlay -->
        <div id="loading-overlay" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p class="loading-msg">A carregar…</p>
        </div>

      </div>`;

    // Tab de filtro
    document.querySelectorAll('.counter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.counter-tab').forEach(b => b.classList.remove('counter-tab--active'));
        btn.classList.add('counter-tab--active');
        _filtro = btn.dataset.filtro;
        _renderContadores();
      });
    });

    // Carregar contadores
    Sync.updateIndicator();
    await _carregarContadores();
  }

  function _menuItems(delegado) {
    const items = [
      { icon: '⏱', label: 'Ponto',          action: 'Ponto.render()' },
      { icon: '🗺', label: 'Mapa',           action: 'Mapa.render()' },
      { icon: '💊', label: 'Visita Farmácia',action: 'App.modulo("visita-farmacia")' },
      { icon: '➕', label: 'Criar Farmácia', action: 'App.modulo("criar-farmacia")' },
      { icon: '🏥', label: 'Visita Clínica', action: 'App.modulo("visita-clinica")' },
      { icon: '🏗',  label: 'Criar Clínica',  action: 'App.modulo("criar-clinica")' },
      { icon: '👨‍⚕️', label: 'Criar Médico',  action: 'App.modulo("criar-medico")' },
      { icon: '📋', label: 'Enviar Proforma', action: 'App.modulo("proforma")' },
      { icon: '📄', label: 'Enviar Flyer',    action: 'App.modulo("flyer")' },
      { icon: '🕐', label: 'Histórico',       action: 'App.modulo("historico")' },
      { icon: '📅', label: 'Agenda',          action: 'App.modulo("agenda")' },
      { icon: '🌴', label: 'Férias',          action: 'App.modulo("ferias")' },
      { icon: '🔄', label: 'Refresh Dados',   action: 'App.refreshDados()' },
      { icon: '🚪', label: 'Sair',            action: 'Auth.logout()' },
    ];

    if (delegado.admin) {
      items.splice(items.length - 2, 0,
        { icon: '⚙️', label: 'Painel Admin', action: 'App.modulo("admin")' }
      );
    }
    if (delegado.painel_reuniao || delegado.admin) {
      items.splice(items.length - 2, 0,
        { icon: '📊', label: 'Reunião', action: 'App.modulo("reuniao")' }
      );
    }

    return items;
  }

  // ── Contadores ────────────────────────────────────────────
  async function _carregarContadores() {
    if (navigator.onLine) {
      try {
        const res = await API.getCounters(Auth.getToken());
        if (res.ok) { _contadores = res; _renderContadores(); }
      } catch(e) {}
    }
  }

  function _renderContadores() {
    if (!_contadores) return;
    const f = _filtro;
    document.getElementById('cnt-visitas').textContent  = _contadores.visitas?.[f]  ?? '—';
    document.getElementById('cnt-flyers').textContent   = _contadores.flyers?.[f]   ?? '—';
    document.getElementById('cnt-proformas').textContent= _contadores.proformas?.[f]?? '—';
  }

  // ── Refresh dados ─────────────────────────────────────────
  async function refreshDados() {
    Utils.showLoading('A atualizar dados…');
    try {
      const res = await API.getData(Auth.getToken());
      if (res.ok) {
        Store.saveData(res);
        Utils.toast('Dados atualizados ✓', 'success');
      } else {
        Utils.toast('Erro ao atualizar dados', 'error');
      }
    } catch(e) {
      Utils.toast('Sem ligação', 'warning');
    } finally {
      Utils.hideLoading();
    }
  }

  // ── Módulos (fases seguintes) ─────────────────────────────
  function modulo(nome) {
    const main = document.getElementById('main-content');
    if (!main) return;
    main.innerHTML = `
      <div class="page">
        <div class="page-header">
          <button class="btn-back" onclick="App.renderMenu()">&#8592;</button>
          <h1 class="page-title">${_moduloNome(nome)}</h1>
        </div>
        <div class="empty-state" style="margin-top:60px">
          🚧 Em desenvolvimento — Fase seguinte
        </div>
      </div>`;
  }

  function _moduloNome(nome) {
    const nomes = {
      'visita-farmacia': 'Visita Farmácia',
      'criar-farmacia':  'Criar Farmácia',
      'visita-clinica':  'Visita Clínica',
      'criar-clinica':   'Criar Clínica',
      'criar-medico':    'Criar Médico',
      'proforma':        'Enviar Proforma',
      'flyer':           'Enviar Flyer',
      'historico':       'Histórico',
      'agenda':          'Agenda',
      'ferias':          'Férias / Ausência',
      'admin':           'Painel Admin',
      'reuniao':         'Painel de Reunião',
    };
    return nomes[nome] || nome;
  }

  return { renderMenu, refreshDados, modulo };
})();
