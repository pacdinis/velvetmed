// ============================================================
// store.js — Cache local (localStorage) dos dados de referência
// VelvetMed Angola App
// ============================================================

const Store = (() => {

  const KEYS = {
    SESSION:   'vm_session',
    DATA:      'vm_data',
    DATA_TS:   'vm_data_ts'
  };

  // ── Sessão ────────────────────────────────────────────────
  function saveSession(session) {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(KEYS.SESSION)); }
    catch(e) { return null; }
  }

  function clearSession() {
    localStorage.removeItem(KEYS.SESSION);
  }

  // ── Dados de referência ───────────────────────────────────
  function saveData(data) {
    localStorage.setItem(KEYS.DATA, JSON.stringify(data));
    localStorage.setItem(KEYS.DATA_TS, new Date().toISOString());
  }

  function getData() {
    try { return JSON.parse(localStorage.getItem(KEYS.DATA)); }
    catch(e) { return null; }
  }

  function getDataTimestamp() {
    return localStorage.getItem(KEYS.DATA_TS);
  }

  // Helpers rápidos
  function getFarmacias()      { return (getData() || {}).farmacias      || []; }
  function getClinicas()       { return (getData() || {}).clinicas       || []; }
  function getMedicos()        { return (getData() || {}).medicos        || []; }
  function getProdutos()       { return (getData() || {}).produtos       || []; }
  function getDistribuidores() { return (getData() || {}).distribuidores || []; }
  function getFarmDist()       { return (getData() || {}).farm_dist      || []; }
  function getEspMedicos()     { return (getData() || {}).esp_medicos    || []; }
  function getEspClinicas()    { return (getData() || {}).esp_clinicas   || []; }
  function getEspecialidades() { return (getData() || {}).especialidades || []; }
  function getConfigs()        { return (getData() || {}).configs        || {}; }

  // Distribuidores de uma farmácia específica
  function getDistribuidoresDeFarmacia(idFarmacia) {
    const fd = getFarmDist();
    const distribuidores = getDistribuidores();
    const ids = fd
      .filter(r => String(r['ID_FARMACIA']).trim() === String(idFarmacia).trim())
      .map(r => String(r['ID_DISTRIBUIDOR']).trim());
    return distribuidores.filter(d => ids.indexOf(String(d['ID_DISTRIBUIDOR']).trim()) >= 0);
  }

  // Médicos de uma clínica
  function getMedicosDaClinica(idClinica) {
    const espClin = getEspClinicas();
    // Via ESP_MEDICOS — encontrar médicos que partilham especialidades com a clínica
    // Simplificado: devolver todos os médicos (a filtrar no futuro por associação directa)
    return getMedicos();
  }

  function clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }

  return {
    saveSession, getSession, clearSession,
    saveData, getData, getDataTimestamp,
    getFarmacias, getClinicas, getMedicos, getProdutos,
    getDistribuidores, getFarmDist,
    getEspMedicos, getEspClinicas, getEspecialidades, getConfigs,
    getDistribuidoresDeFarmacia, getMedicosDaClinica,
    clearAll
  };
})();
