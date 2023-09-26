const map = L.map('census-map', {
    zoomSnap: 0,
});
map.setView([39.96, -75.15], 11.5);
//L is leaflet stuff, map start a map, latitude & longtitude
//number is zoom in level, 11 is zoom-in level for entire world

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
//always put attrubution: cite sources

async function downloadGeographicData() {
    const resp = await fetch('../data/phl_blockgroups.geojson'); //making http request
    const json = await resp.json(); //reading that file
    return json;
}

async function downloadDemographic() {
    const resp = await fetch('../data/phl_blockgroup_dwg.csv'); //making http request
    const test = await resp.text(); //reading that file
    const rows = csv.parse(text, {
        from_line: 2,
        columns: false,
    });
    console.log(rows);

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
const dmgData = await downloadDemographic();

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
const dataLayer = L.geoJSON(geoData, {
    style: calcFeatureStyle,
});
dataLayer.addTo(map);

window.map = map;
window.geoData = geoData;
window.dmgData = dmgData;
window.dataLayer - dataLayer;
//window command is globally avaliable
