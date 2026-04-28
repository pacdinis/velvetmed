// ============================================================
// api.js — Chamadas ao backend (Google Apps Script)
// VelvetMed Angola App
// ============================================================

const API = (() => {

  // URL do Apps Script — substituir após deploy
  const BASE_URL = window.APPS_SCRIPT_URL || 'APPS_SCRIPT_URL_AQUI';

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
    const res = await fetch(BASE_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  return {

    // ── Auth ──────────────────────────────────────────────
    async login(id_delegado, pin) {
      return post({ action: 'login', id_delegado, pin });
    },

    async logout(token) {
      return post({ action: 'logout', token });
    },

    async checkSession(token) {
      return get({ action: 'check_session', token });
    },

    // ── Dados de referência ───────────────────────────────
    async getData(token) {
      return get({ action: 'get_data', token });
    },

    async getCounters(token) {
      return get({ action: 'get_counters', token });
    },

    // ── Ponto ─────────────────────────────────────────────
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
