// ============================================================
// sync.js — Fila offline e sincronização automática
// VelvetMed Angola App
// ============================================================

const Sync = (() => {

  const QUEUE_KEY = 'vm_sync_queue';

  function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch(e) { return []; }
  }

  function saveQueue(q) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  }

  // Adiciona operação à fila
  function enqueue(action, payload) {
    const q = getQueue();
    q.push({ id: Date.now() + '_' + Math.random(), action, payload, ts: new Date().toISOString() });
    saveQueue(q);
    _updateIndicator();
  }

  // Tenta processar toda a fila
  async function flush() {
    if (!navigator.onLine) return;
    const q = getQueue();
    if (!q.length) return;

    const token = Auth.getToken();
    if (!token) return;

    const failed = [];
    for (const item of q) {
      try {
        const res = await API.post({ ...item.payload, action: item.action, token });
        if (!res.ok) failed.push(item);
      } catch(e) {
        failed.push(item);
      }
    }
    saveQueue(failed);
    _updateIndicator();
    if (failed.length === 0 && q.length > 0) {
      Utils.toast('Dados sincronizados ✓', 'success');
    }
  }

  function pendingCount() {
    return getQueue().length;
  }

  // Atualiza o indicador visual no topo
  function _updateIndicator() {
    const el = document.getElementById('sync-indicator');
    if (!el) return;
    const count = pendingCount();
    if (!navigator.onLine) {
      el.className = 'sync-indicator sync-indicator--offline';
      el.title = 'Sem ligação';
    } else if (count > 0) {
      el.className = 'sync-indicator sync-indicator--pending';
      el.title = `${count} registo(s) por sincronizar`;
    } else {
      el.className = 'sync-indicator sync-indicator--ok';
      el.title = 'Sincronizado';
    }
  }

  // Listeners de rede
  window.addEventListener('online',  () => { _updateIndicator(); flush(); });
  window.addEventListener('offline', () => { _updateIndicator(); });

  // Tentar sincronizar a cada 30s se online
  setInterval(() => { if (navigator.onLine) flush(); }, 30000);

  return { enqueue, flush, pendingCount, updateIndicator: _updateIndicator };
})();
