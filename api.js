// ============================================================
// api.js — Chamadas ao backend (Google Apps Script)
// VelvetMed Angola App
//
// POST usa application/x-www-form-urlencoded com campo "payload"
// para evitar preflight CORS que o Apps Script não suporta.
// ============================================================

const API = (() => {

  const BASE_URL = window.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycby7bsrX5_wcEJW6Eh6PHhonVDY0atAL9vlawmdQMR9oLsRkR6g-jaJLeFW-HmPvfYMa/exec';

  async function get(params) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}?${qs}`, {
      method: 'GET',
      redirect: 'follow'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function post(body) {
    const fd = new URLSearchParams();
    fd.append('payload', JSON.stringify(body));
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: fd.toString(),
      redirect: 'follow'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  return {
    async login(id_delegado, pin) {
      return post({ action: 'login', id_delegado, pin });
    },
    async logout(token) {
      return post({ action: 'logout', token });
    },
    async checkSession(token) {
      return get({ action: 'check_session', token });
    },
    async getData(token) {
      return get({ action: 'get_data', token });
    },
    async getCounters(token) {
      return get({ action: 'get_counters', token });
    },
    async pontoMarcar(token, tipo, lat, lng) {
      return post({ action: 'ponto_marcar', token, tipo, lat, lng });
    },
    async pontoEstado(token) {
      return get({ action: 'ponto_estado', token });
    },
    async pontoDia(token, data) {
      return get({ action: 'ponto_dia', token, data });
    }
  };
})();
