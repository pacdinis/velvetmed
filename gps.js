// ============================================================
// gps.js — Geolocalização e geofencing
// VelvetMed Angola App
// ============================================================

const GPS = (() => {

  const RAIO_DEFAULT = 50; // metros — sobrescrito por CONFIGS

  function getRaio() {
    const cfg = Store.getConfigs();
    return parseInt(cfg && cfg['RAIO_GEOFENCING_METROS'], 10) || RAIO_DEFAULT;
  }

  // Obter posição actual (Promise)
  function getPosicao(opcoes = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não suportada neste dispositivo'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, precisao: pos.coords.accuracy }),
        err => reject(new Error(_erroGPS(err))),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, ...opcoes }
      );
    });
  }

  // Validar se está dentro do raio de um local
  async function validarCheckin(latLocal, lngLocal) {
    try {
      const pos = await getPosicao();
      const dist = Utils.distanciaGPS(pos.lat, pos.lng, parseFloat(latLocal), parseFloat(lngLocal));
      const raio = getRaio();
      return {
        valido:   dist <= raio,
        distancia: Math.round(dist),
        raio,
        lat: pos.lat,
        lng: pos.lng,
        precisao: pos.precisao
      };
    } catch(e) {
      return { valido: false, erro: e.message, lat: null, lng: null };
    }
  }

  function _erroGPS(err) {
    switch(err.code) {
      case 1: return 'Permissão de localização negada';
      case 2: return 'Localização indisponível';
      case 3: return 'Tempo limite de GPS excedido';
      default: return 'Erro de GPS desconhecido';
    }
  }

  return { getPosicao, validarCheckin };
})();
