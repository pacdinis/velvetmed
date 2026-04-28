// ============================================================
// auth.js — Login, sessão e controlo de acesso (frontend)
// VelvetMed Angola App
// ============================================================

const Auth = (() => {

  function getToken() {
    const s = Store.getSession();
    return s ? s.token : null;
  }

  function getDelegado() {
    const s = Store.getSession();
    return s ? s.delegado : null;
  }

  function isLoggedIn() {
    const s = Store.getSession();
    if (!s || !s.token || !s.expiry) return false;
    return new Date() < new Date(s.expiry);
  }

  function isAdmin() {
    const d = getDelegado();
    return d && d.admin === true;
  }

  function isPainelReuniao() {
    const d = getDelegado();
    return d && d.painel_reuniao === true;
  }

  // Inicializa o módulo de login (rende o ecrã de login)
  function renderLogin() {
    document.getElementById('app').innerHTML = `
      <div class="login-screen">
        <div class="login-card">
          <div class="login-logo">
            <span class="login-logo__text">VelvetMed</span>
            <span class="login-logo__sub">Angola</span>
          </div>
          <form id="login-form" autocomplete="off">
            <div class="form-group">
              <label class="form-label" for="login-id">ID Delegado</label>
              <input class="form-input" type="text" id="login-id"
                     placeholder="Ex: D001" autocapitalize="characters" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="login-pin">PIN</label>
              <input class="form-input" type="password" id="login-pin"
                     placeholder="••••••" inputmode="numeric" maxlength="6" required>
            </div>
            <button class="btn btn--primary btn--full" type="submit" id="login-btn">
              Entrar
            </button>
            <p class="login-error" id="login-error"></p>
          </form>
        </div>
      </div>`;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await _handleLogin();
    });
  }

  async function _handleLogin() {
    const id  = document.getElementById('login-id').value.trim().toUpperCase();
    const pin = document.getElementById('login-pin').value.trim();
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('login-error');

    err.textContent = '';
    btn.disabled = true;
    btn.textContent = 'A verificar…';

    try {
      const res = await API.login(id, pin);
      if (!res.ok) {
        err.textContent = res.error || 'Credenciais inválidas';
        return;
      }
      // Guardar sessão
      Store.saveSession({ token: res.token, expiry: res.expiry, delegado: res.delegado });

      // Carregar dados de referência
      Utils.showLoading('A carregar dados…');
      await _refreshData(res.token);
      Utils.hideLoading();

      // Ir para o menu principal
      App.renderMenu();

    } catch(e) {
      err.textContent = 'Erro de ligação. Verifique a sua internet.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  }

  async function _refreshData(token) {
    try {
      const res = await API.getData(token || getToken());
      if (res.ok) Store.saveData(res);
    } catch(e) {
      // offline — usa dados em cache
    }
  }

  async function logout() {
    const token = getToken();
    try { await API.logout(token); } catch(e) {}
    Store.clearSession();
    renderLogin();
  }

  // Verifica sessão ao iniciar a app
  async function init() {
    if (!isLoggedIn()) {
      renderLogin();
      return;
    }
    // Verificar com o servidor (pode estar expirado server-side)
    try {
      const res = await API.checkSession(getToken());
      if (!res.ok) { Store.clearSession(); renderLogin(); return; }
    } catch(e) {
      // offline — confiar no cache local
    }

    // Atualizar dados em background se online
    if (navigator.onLine) _refreshData();

    App.renderMenu();
  }

  return { init, logout, getToken, getDelegado, isLoggedIn, isAdmin, isPainelReuniao };
})();
