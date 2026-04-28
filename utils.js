// ============================================================
// utils.js — Helpers gerais
// VelvetMed Angola App
// ============================================================

const Utils = {

  // Formata data yyyy-MM-dd para dd/MM/yyyy
  formatDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  },

  // Formata minutos em "2h 30min"
  formatDuracao(minutos) {
    if (!minutos && minutos !== 0) return '—';
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  },

  // Data de hoje em yyyy-MM-dd (local)
  hoje() {
    return new Date().toISOString().substring(0, 10);
  },

  // Hora actual HH:MM
  horaAgora() {
    return new Date().toTimeString().substring(0, 5);
  },

  // Toast de notificação
  toast(msg, tipo = 'info', duracao = 3000) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast toast--${tipo} toast--visible`;
    clearTimeout(Utils._toastTimer);
    Utils._toastTimer = setTimeout(() => {
      el.classList.remove('toast--visible');
    }, duracao);
  },

  // Loading spinner
  showLoading(msg = 'A carregar…') {
    const el = document.getElementById('loading-overlay');
    if (el) {
      el.querySelector('.loading-msg').textContent = msg;
      el.classList.add('loading--visible');
    }
  },

  hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.classList.remove('loading--visible');
  },

  // Confirmar ação
  confirm(msg) {
    return window.confirm(msg);
  },

  // Distância entre dois pontos GPS em metros (Haversine)
  distanciaGPS(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  // Debounce
  debounce(fn, delay) {
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // Sanitize texto para evitar XSS em innerHTML
  escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};
