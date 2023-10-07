import * as csv from 'https://unpkg.com/csv-parse@5.5.1/dist/esm/sync.js'

const map = L.map('census-map', {
    zoomSnap: 0, // if zoomSnap=1, zoom level have to be integer; if zoomSnap=0, can be anything
});
map.setView([39.96, -75.15], 11.5);
// L is leaflet stuff, map start a map, latitude & longtitude
// number is zoom in level, 11 is zoom-in level for entire world

L.tileLayer('https://api.mapbox.com/styles/v1/junyiy/clng7r3oq083901qx0eu9gaor/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoianVueWl5IiwiYSI6ImNsbXMza292bjAxcXoybG1meHhuZ3N1cjYifQ.EYo5VECxk9-NCAEgc3dm9w', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
  const rows = csv.parse(text, {
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

function calcFeatureStyle(blockgroup) {
  const geoid = blockgroup.properties['GEOID'];
  const row = dmgData[geoid];
  const totalPop = row[0];
  const maxPop = 4657;

  return { 
    fillOpacity: totalPop * 1.0 / maxPop,
    weight: 0,
  };
}
const dataLayer = L.geoJSON(geoData, { // create geojason layer using the data we read
  style: calcFeatureStyle, // change the style of data, e.g. style:{color:'red'}
});
dataLayer.addTo(map);

window.map = map;
window.geoData = geoData;
window.dmgData = dmgData;
window.dataLayer - dataLayer;
// window command is globally avaliable, can use in WDT
