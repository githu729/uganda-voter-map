const geojsonPath = "data/uganda_districts.geojson";
const csvPath = "data/Uganda_Voter_Count_2021_With_Code.csv";

const map = L.map('map').setView([1.3733, 32.2903], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 10,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let districtData = {};
let geojsonLayer;

// Load both GeoJSON and CSV
Promise.all([
  fetch('data/uganda_districts.geojson').then(r => r.json()),
  fetch('data/Uganda_Voter_Count_2021_With_Code.csv').then(r => r.text())
]).then(([geojson, csvText]) => {
  const csv = Papa.parse(csvText, { header: true }).data;

  csv.forEach(row => {
    const name = row.District_Name.trim().toUpperCase();
    districtData[name] = {
      code: row.District_Code,
      voters: +row.Total_Voters
    };
  });

  geojsonLayer = L.geoJson(geojson, {
    style: feature => styleFeature(feature),
    onEachFeature: (feature, layer) => {
      const name = feature.properties.DISTRICT_NAME?.trim().toUpperCase();
      const info = districtData[name];
      const voters = info ? info.voters.toLocaleString() : "N/A";
      const code = info ? info.code : "N/A";

      layer.bindTooltip(
        `<strong>${feature.properties.DISTRICT_NAME}</strong><br>
         Code: ${code}<br>
         Voters: ${voters}`,
        { sticky: true }
      );

      layer.on({
        mouseover: e => e.target.setStyle({ weight: 3, color: '#333' }),
        mouseout: e => geojsonLayer.resetStyle(e.target)
      });
    }
  }).addTo(map);

  addLegend();
});

function getColor(voters) {
  return voters > 500000 ? '#800026' :
         voters > 200000 ? '#BD0026' :
         voters > 100000 ? '#E31A1C' :
         voters > 50000  ? '#FD8D3C' :
         voters > 25000  ? '#FEB24C' :
         voters > 10000  ? '#FED976' :
                           '#FFEDA0';
}

function styleFeature(feature) {
  const name = feature.properties.DISTRICT_NAME?.trim().toUpperCase();
  const voters = districtData[name]?.voters || 0;
  return {
    fillColor: getColor(voters),
    weight: 1,
    color: 'white',
    fillOpacity: 0.8
  };
}

function addLegend() {
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'legend');
    const grades = [0, 10000, 25000, 50000, 100000, 200000, 500000];
    for (let i = 0; i < grades.length; i++) {
      const from = grades[i];
      const to = grades[i + 1];
      div.innerHTML +=
        '<i style="background:' + getColor(from + 1) + '"></i> ' +
        from.toLocaleString() + (to ? '&ndash;' + to.toLocaleString() + '<br>' : '+');
    }
    return div;
  };
  legend.addTo(map);
}

