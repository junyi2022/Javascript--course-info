import * as csv from 'https://unpkg.com/csv-parse@5.5.0/dist/esm/sync.js';
import * as d3 from 'https://cdn.skypack.dev/d3-scale-chromatic@3';


const map = L.map('census-map', {
  zoomSnap: 0,
});
map.setView([39.96, -75.15], 11);

L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

async function downloadGeographicData() {
  const resp = await fetch('../data/phl_blockgroups.geojson');
  const json = await resp.json();
  return json;
}

async function downloadDemographicData() {
  const resp = await fetch('../data/phl_blockgroup_dmg.csv');
  const text = await resp.text();
  const rows = csv.parse(text, {
    from_line: 2,
    columns: false,
  });
  const dmgByGeoid = {};
  for (const row of rows) {
    const [state, county, tract, bgid] = row.slice(row.length - 4);
    const geoid = state + county + tract + bgid;
    row.push(geoid);
    dmgByGeoid[geoid] = row;
  }
  return dmgByGeoid;
}

const geoData = await downloadGeographicData();
const dmgData = await downloadDemographicData();

// const joinedData = {
//   'type': 'FeatureCollection',
//   'features': [],
// };
// for (const feature of geoData.features) {
//   const geoid = feature.properties.GEOID;
//   const dmg = dmgData[geoid];
//   const newFeature = {
//     'type': 'Feature',
//     'properties': feature.properties,
//     'geometry': feature.geometry,
//   };
//   newFeature.properties.demographics = dmg;
//   joinedData.features.push(newFeature);
// }

// const joinedData = {
//   'type': 'FeatureCollection',
//   'features': geoData.features.map((feature) => {
//     const geoid = feature.properties.GEOID;
//     const dmg = dmgData[geoid];
//     const newFeature = {
//       'type': 'Feature',
//       'properties': feature.properties,
//       'geometry': feature.geometry,
//     };
//     newFeature.properties.demographics = dmg;
//     return newFeature;
//   }),
// };

const joinedData = {
  'type': 'FeatureCollection',
  'features': geoData.features.map((feature) => {
    return {
      type: 'Feature',
      properties: {
        ...feature.properties,
        demographics: dmgData[feature.properties.GEOID],
      },
      geometry: feature.geometry,
    };
  }),
};
window.joinedData = joinedData;


function calcFeatureStyle(blockgroup) {
  const totalPop = blockgroup.properties.demographics[0];
  const colors = d3.schemeCategory10;
  // const allTotalPops = joinedData.features.map((f) => parseInt(f.properties.demographics[0]));
  // const maxPop = Math.max(...allTotalPops);

  const racePops = blockgroup.properties.demographics.slice(2, 8);
  let maxIndex = 0;
  let maxPop = 0;
  for (let i = 0; i < racePops.length; i++) {
    if (maxPop < parseInt(racePops[i])) {
      maxPop = parseInt(racePops[i]);
      maxIndex = i;
    }
  }

  return {
    // fillOpacity: totalPop * 1.0 / maxPop,
    fillOpacity: 0.8,
    color: colors[maxIndex],
    weight: 1,
  };
}

const dataLayer = L.geoJSON(joinedData, {
  style: calcFeatureStyle,
});
dataLayer.addTo(map);

window.map = map;
window.geoData = geoData;
window.dmgData = dmgData;
window.dataLayer = dataLayer;
