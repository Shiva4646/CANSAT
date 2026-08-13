// --- Map and Timer Code (unchanged) ---
    let map, currentMarker, pathPolyline;
    let pathCoordinates = [];

    function initMap() {
      if (typeof L === 'undefined') {
        return false;
      }

      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        return false;
      }

      const defaultLat = 13.7331, defaultLon = 80.2047;
      map = L.map("map").setView([defaultLat, defaultLon], 13);

        // Hybrid layer: Satellite imagery + labels overlay
        const esriSat = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution:
              "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
            maxZoom: 18,
          }
        );
        const esriLabels = L.tileLayer(
          "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "Labels © Esri",
            maxZoom: 18,
          }
        );
        esriSat.addTo(map);
        esriLabels.addTo(map);

      currentMarker = L.marker([defaultLat, defaultLon])
        .addTo(map)
        .bindPopup(`Rocket Location<br>Lat: ${defaultLat}<br>Lon: ${defaultLon}`)
        .openPopup();

      pathPolyline = L.polyline([], { color: "red", weight: 3 }).addTo(map);
      return true;
    }

    document.addEventListener('DOMContentLoaded', () => {
      let attempts = 0;
      const maxAttempts = 25;

      const tryInitMap = () => {
        if (map) return;
        const isReady = initMap();
        if (isReady) return;

        attempts += 1;
        if (attempts < maxAttempts) {
          setTimeout(tryInitMap, 200);
        } else {
          console.error('Leaflet failed to initialize. Check script loading and launch method.');
        }
      };

      tryInitMap();
    });

    function updateMap(lat, lon, alt) {
      if (!map || lat === undefined || lon === undefined || lat === null || lon === null) return;
      const parsedLat = parseFloat(lat);
      const parsedLon = parseFloat(lon);
      if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) return;
      const newLatLng = [parsedLat, parsedLon];

      currentMarker.setLatLng(newLatLng);
      currentMarker.setPopupContent(`Rocket Location<br>Lat: ${lat}<br>Lon: ${lon}<br>Alt: ${alt}M`);

      pathCoordinates.push(newLatLng);
      pathPolyline.setLatLngs(pathCoordinates);
      map.setView(newLatLng, map.getZoom());

      if (pathCoordinates.length > 100) {
        pathCoordinates = pathCoordinates.slice(-100);
      }
    }