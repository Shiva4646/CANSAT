(function () {
  const DEFAULT_COORDS = {
    lat: 13.7331,
    lon: 80.2047,
    alt: 0.6
  };

  let map;
  let currentMarker;
  let metadataOverlay;

  function createMetaOverlay(text) {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return null;

    let overlay = mapContainer.querySelector('.map-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'map-overlay';
      mapContainer.appendChild(overlay);
    }

    overlay.textContent = text;
    return overlay;
  }

  function createMapPinIcon() {
    return L.divIcon({
      className: 'custom-map-pin',
      html: '<span class="map-pin-dot"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 17],
      popupAnchor: [0, -16]
    });
  }

  function initMap() {
    if (typeof L === 'undefined') return false;

    const mapContainer = document.getElementById('map');
    if (!mapContainer) return false;

    map = L.map(mapContainer, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true
    }).setView([DEFAULT_COORDS.lat, DEFAULT_COORDS.lon], 15);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles © Esri'
    }).addTo(map);

    metadataOverlay = createMetaOverlay(
      `LAT: ${DEFAULT_COORDS.lat.toFixed(4)}° N | LON: ${DEFAULT_COORDS.lon.toFixed(4)}° E | ALT: ${DEFAULT_COORDS.alt.toFixed(2)} m`
    );

    currentMarker = L.marker([DEFAULT_COORDS.lat, DEFAULT_COORDS.lon], {
      icon: createMapPinIcon()
    }).addTo(map);

    currentMarker.bindPopup(`Location<br>Lat: ${DEFAULT_COORDS.lat.toFixed(4)}<br>Lon: ${DEFAULT_COORDS.lon.toFixed(4)}<br>Alt: ${DEFAULT_COORDS.alt.toFixed(2)} m`);
    map.invalidateSize();
    return true;
  }

  function updateMap(lat, lon, alt) {
    if (!map || !currentMarker) return;

    const parsedLat = Number(lat);
    const parsedLon = Number(lon);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLon)) return;

    currentMarker.setLatLng([parsedLat, parsedLon]);
    if (metadataOverlay) {
      metadataOverlay.textContent = `LAT: ${parsedLat.toFixed(4)}° N | LON: ${parsedLon.toFixed(4)}° E | ALT: ${Number(alt || 0).toFixed(2)} m`;
    }
    map.setView([parsedLat, parsedLon], Math.max(map.getZoom(), 15));
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof L === 'undefined') return;

    let tries = 0;
    const maxTries = 25;

    function attempt() {
      if (map) return;
      const ready = initMap();
      if (ready) return;

      tries += 1;
      if (tries < maxTries) setTimeout(attempt, 200);
    }

    attempt();
  });

  window.updateMapPosition = updateMap;
  window.currentMap = function () {
    return map;
  };
})();
