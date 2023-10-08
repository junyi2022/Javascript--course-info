import * as csv from 'https://unpkg.com/csv-parse@5.5.1/dist/esm/sync.js';
import * as d3 from 'https://cdn.skypack.dev/d3-scale-chromatic@3';

const map = L.map('census-map', {
  zoomSnap: 0, // if zoomSnap=1, zoom level have to be integer; if zoomSnap=0, can be anything
});
map.setView([39.96, -75.15], 11.5);
// L is leaflet stuff, map start a map, latitude & longtitude
// number is zoom in level, 11 is zoom-in level for entire world

L.tileLayer('https://api.mapbox.com/styles/v1/junyiy/clng7r3oq083901qx0eu9gaor/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoianVueWl5IiwiYSI6ImNsbXMza292bjAxcXoybG1meHhuZ3N1cjYifQ.EYo5VECxk9-NCAEgc3dm9w', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);
// always put attrubution: cite sources

async function downloadGeographicData() {
  const resp = await fetch('../data/phl_blockgroups.geojson'); // making http request from local
  const json = await resp.json(); // reading that file
  return json;
}

async function downloadDemographicData() {
  const resp = await fetch('../data/phl_blockgroup_dmg.csv'); // making http request from local server
  const text = await resp.text(); // download content of that file, at this point it's just text
  const rows = csv.parse(text, { // function from csv library
    from_line: 2, // skip the first line
    columns: false, // get array instead of objects
  });
  const dmgByGeoid = {};
  for (const row of rows) { // current row of all the rows
    const [state, county, tract, bgid] = row.slice(row.length - 4); // slice used to subset array, here take last four things from a row (shortcut)
    const geoid = state + county + tract + bgid;
    row.push(geoid);
    dmgByGeoid[geoid] = row;
  }
  return dmgByGeoid;
}

const geoData = await downloadGeographicData(); // use function
const dmgData = await downloadDemographicData();

// geoData.merge(dmgData, 'GEOID'); function not exist in JS
// option 1
// const joinedData = {
//   'type': 'FeatureCollection',
//   'feature': [],
// }
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

const joinedData = {
  'type': 'FeatureCollection',
  'features': geoData.features.map((feature) => {
    return {
      type: 'Feature',
      properties: {
        ...feature.properties, // ...is spread syntax, copy from old to new, similar to flattern in GH
        demographics: dmgData[feature.properties.GEOID],
      },
      geometry: feature.geometry,
    };
  }),
};
window.joinedData = joinedData;

function calcFeatureStyle(blockgroup) {
//   const geoid = blockgroup.properties['GEOID'];
//   const row = dmgData[geoid];
  const totalPop = blockgroup.properties.demographics[0];
  const colors = d3.schemeCategory10; // array of color
// comments below is to show how to display population without race considerations
//   const allTotalPops = joinedData.features.map((f) => parseInt(f.properties.demographics[0])); // parseInt is to change string to integers
//   const maxPop = Math.max(...allTotalPops);

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
const dataLayer = L.geoJSON(joinedData, { // create geojason layer using the data we read
  style: calcFeatureStyle, // change the style of data, e.g. style:{color:'red'}
});
dataLayer.addTo(map);

window.map = map;
window.geoData = geoData;
window.dmgData = dmgData;
window.dataLayer - dataLayer;
window.joinData = joinedData;
// window command is globally avaliable, can use in WDT


