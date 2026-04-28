// ============================================================
// mapa.js — Módulo Mapa (Leaflet + OpenStreetMap, sem API key)
// VelvetMed Angola App
// ============================================================

const Mapa = (() => {

  let _map = null;

  function render() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="page page--map">
        <div class="page-header">
          <button class="btn-back" onclick="App.renderMenu()">&#8592;</button>
          <h1 class="page-title">Mapa</h1>
          <div class="mapa-legend">
            <span class="legend-item"><span class="legend-dot legend-dot--farmacia"></span>Farmácia</span>
            <span class="legend-item"><span class="legend-dot legend-dot--clinica"></span>Clínica</span>
          </div>
        </div>
        <div id="mapa-container" class="mapa-container"></div>
      </div>`;

    // Leaflet carregado via CDN no index.html
    if (typeof L === 'undefined') {
      document.getElementById('mapa-container').innerHTML =
        '<p class="empty-state">Mapa não disponível offline.</p>';
      return;
    }

    _initMap();
  }

  function _initMap() {
    _map = L.map('mapa-container').setView([-8.8383, 13.2344], 12); // Luanda default

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(_map);

    _addMarcadores();
    _centrarNaLocalizacao();
  }

  function _addMarcadores() {
    const farmacias = Store.getFarmacias();
    const clinicas  = Store.getClinicas();

    const iconFarmacia = L.divIcon({
      className: '',
      html: '<div class="map-marker map-marker--farmacia">💊</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });

    const iconClinica = L.divIcon({
      className: '',
      html: '<div class="map-marker map-marker--clinica">🏥</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });

    farmacias.forEach(f => {
      const lat = parseFloat(f['GPS_LAT'] || f['LAT'] || 0);
      const lng = parseFloat(f['GPS_LNG'] || f['LNG'] || 0);
      if (!lat || !lng) return;

      L.marker([lat, lng], { icon: iconFarmacia })
        .addTo(_map)
        .bindPopup(_popupFarmacia(f));
    });

    clinicas.forEach(c => {
      const lat = parseFloat(c['GPS_LAT'] || c['LAT'] || 0);
      const lng = parseFloat(c['GPS_LNG'] || c['LNG'] || 0);
      if (!lat || !lng) return;

      L.marker([lat, lng], { icon: iconClinica })
        .addTo(_map)
        .bindPopup(_popupClinica(c));
    });
  }

  function _popupFarmacia(f) {
    const nome    = Utils.escHtml(f['NOME_FARMACIA'] || f['NOME'] || '—');
    const morada  = Utils.escHtml(f['MORADA'] || f['LOCAL'] || '—');
    const lat     = f['GPS_LAT'] || f['LAT'] || '';
    const lng     = f['GPS_LNG'] || f['LNG'] || '';
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    return `
      <div class="map-popup">
        <strong>💊 ${nome}</strong>
        <p>${morada}</p>
        <a href="${mapsUrl}" target="_blank" class="btn-nav">🧭 Navegar</a>
      </div>`;
  }

  function _popupClinica(c) {
    const nome    = Utils.escHtml(c['NOME_CLINICA'] || c['NOME'] || '—');
    const morada  = Utils.escHtml(c['MORADA'] || c['LOCAL'] || '—');
    const lat     = c['GPS_LAT'] || c['LAT'] || '';
    const lng     = c['GPS_LNG'] || c['LNG'] || '';
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    return `
      <div class="map-popup">
        <strong>🏥 ${nome}</strong>
        <p>${morada}</p>
        <a href="${mapsUrl}" target="_blank" class="btn-nav">🧭 Navegar</a>
      </div>`;
  }

  function _centrarNaLocalizacao() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      _map.setView([pos.coords.latitude, pos.coords.longitude], 13);
      L.circle([pos.coords.latitude, pos.coords.longitude], {
        radius: 30, color: '#1F4E79', fillOpacity: 0.3
      }).addTo(_map).bindPopup('A sua localização');
    });
  }

  return { render };
})();
