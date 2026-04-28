// ============================================================
// criar-farmacia.js — Módulo Criar Farmácia
// VelvetMed Angola App
// ============================================================

const CriarFarmacia = (() => {

  let _gps = null;

  function render() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="page">
        <div class="page-header">
          <button class="btn-back" onclick="App.renderMenu()">&#8592;</button>
          <h1 class="page-title">Nova Farmácia</h1>
        </div>

        <div id="cf-gps-box" class="ci-box ci-box--warn">
          <div class="ci-box__title">📍 GPS</div>
          <div class="ci-box__row">
            <span class="ci-box__lbl">Coordenadas</span>
            <span id="cf-gps-val" class="gps-badge gps-badge--warn">A obter…</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Nome da Farmácia *</label>
          <input class="form-input" type="text" id="cf-nome" placeholder="FARMACIA..." style="text-transform:uppercase">
        </div>
        <div class="form-group">
          <label class="form-label">Local / Morada *</label>
          <input class="form-input" type="text" id="cf-local" placeholder="Bairro, Rua...">
        </div>

        <p class="section-label" style="margin-top:16px">Gerente</p>
        <div class="form-group">
          <label class="form-label">Nome</label>
          <input class="form-input" type="text" id="cf-gerente" placeholder="Nome do gerente">
        </div>
        <div class="form-group">
          <label class="form-label">Telemóvel</label>
          <input class="form-input" type="tel" id="cf-tlm-gerente" placeholder="9XXXXXXXX">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" id="cf-email-gerente" placeholder="email@...">
        </div>

        <p class="section-label" style="margin-top:16px">Resp. Compras</p>
        <div class="form-group">
          <label class="form-label">Nome</label>
          <input class="form-input" type="text" id="cf-resp-compras" placeholder="Nome">
        </div>
        <div class="form-group">
          <label class="form-label">Telemóvel</label>
          <input class="form-input" type="tel" id="cf-tlm-compras" placeholder="9XXXXXXXX">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" type="email" id="cf-email-compras" placeholder="email@...">
        </div>

        <p class="section-label" style="margin-top:16px">Outros</p>
        <div class="form-group">
          <label class="form-label">Classificação ABC</label>
          <select class="form-input" id="cf-abc">
            <option value="">-- seleccionar --</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-input" id="cf-notas" rows="3" placeholder="Observações..."></textarea>
        </div>

        <button class="btn btn--primary btn--full" id="cf-guardar" onclick="CriarFarmacia.guardar()" style="margin-top:8px;margin-bottom:32px">
          💾 Guardar Farmácia
        </button>
      </div>`;

    _iniciarGPS();
  }

  function _iniciarGPS() {
    GPS.getPosicao().then(function(pos) {
      _gps = pos;
      const el = document.getElementById('cf-gps-val');
      const box = document.getElementById('cf-gps-box');
      if (el) {
        el.textContent = pos.lat.toFixed(5) + ', ' + pos.lng.toFixed(5);
        el.className = 'gps-badge gps-badge--ok';
      }
      if (box) box.className = 'ci-box ci-box--ok';
    }).catch(function() {
      const el = document.getElementById('cf-gps-val');
      if (el) { el.textContent = 'GPS indisponível'; el.className = 'gps-badge gps-badge--err'; }
    });
  }

  async function guardar() {
    const nome  = (document.getElementById('cf-nome').value  || '').trim().toUpperCase();
    const local = (document.getElementById('cf-local').value || '').trim();

    if (!nome)  { Utils.toast('Nome é obrigatório', 'error'); return; }
    if (!local) { Utils.toast('Local é obrigatório', 'error'); return; }

    const btn = document.getElementById('cf-guardar');
    btn.disabled = true;
    btn.textContent = 'A guardar…';

    const payload = {
      nome,
      local,
      lat:               _gps ? _gps.lat : '',
      lng:               _gps ? _gps.lng : '',
      nome_gerente:      document.getElementById('cf-gerente').value      || '',
      tlm_gerente:       document.getElementById('cf-tlm-gerente').value  || '',
      email_gerente:     document.getElementById('cf-email-gerente').value|| '',
      nome_resp_compras: document.getElementById('cf-resp-compras').value || '',
      tlm_resp_compras:  document.getElementById('cf-tlm-compras').value  || '',
      email_resp_compras:document.getElementById('cf-email-compras').value|| '',
      abc:               document.getElementById('cf-abc').value          || '',
      notas:             document.getElementById('cf-notas').value        || ''
    };

    try {
      const res = await API.post({ action: 'criar_farmacia', token: Auth.getToken(), ...payload });
      if (res.ok) {
        Utils.toast('Farmácia ' + nome + ' criada ✓', 'success');
        // Actualizar cache local
        await App.refreshDados();
        App.renderMenu();
      } else {
        Utils.toast(res.error || 'Erro ao criar farmácia', 'error');
        btn.disabled = false;
        btn.textContent = '💾 Guardar Farmácia';
      }
    } catch(e) {
      Utils.toast('Erro de ligação', 'error');
      btn.disabled = false;
      btn.textContent = '💾 Guardar Farmácia';
    }
  }

  return { render, guardar };
})();
