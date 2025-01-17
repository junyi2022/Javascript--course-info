import { initIssueReporter } from './issue_reporter.js';

// Import the functions you need from the SDKs you need
// https://firebase.google.com/docs/web/learn-more#available-libraries
// initialize firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js'; // initialize your application as a firebase application
import { getFirestore, getDocs, collection } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// specific to your project
const firebaseConfig = {
  apiKey: 'AIzaSyBogSi6Saxt3ebZqIV5XPsuwmHiAoJpFUM',
  authDomain: 'musa-344004.firebaseapp.com',
  projectId: 'musa-344004',
  storageBucket: 'musa-344004.appspot.com',
  messagingSenderId: '483377634328',
  appId: '1:483377634328:web:e0d6c8061d2e00dbbfb76d',
  measurementId: 'G-BYWR8ZWPKL',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const issuesCollection = await collection(db, 'trail_waze_issues');

const map = L.map('map').setView([39.95, -75.16], 13);

L.tileLayer('https://api.mapbox.com/styles/v1/mjumbe-test/cl1yh1ojk000014o5l2u4tiff/tiles/{tileSize}/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWp1bWJlLXRlc3QiLCJhIjoiY2wwb3BudmZ3MWdyMjNkbzM1c2NrMGQwbSJ9.2ATDPobUwpa7Ou5jsJOGYA', {
  tileSize: 512,
  zoomOffset: -1,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

async function loadTrails() {
  const resp = await fetch('https://opendata.arcgis.com/datasets/48323d574068405bbf5336b9b5b29455_0.geojson');
  const data = await resp.json();

  const trailsLayer = L.geoJSON(data, {
    style: {
      weight: 6,
      opacity: 0,
    },
  });
  trailsLayer.bindTooltip(
      (l) => l.feature.properties['TRAIL_NAME'],
      { sticky: true },
  );
  trailsLayer.addTo(map);
  return trailsLayer;
}

async function loadIssues() {
  const issuesQuery = await getDocs(issuesCollection); // load the document that so far has been collected in your firestore database. Give you a query object with an attribute called docs
  const issues = issuesQuery.docs.map((doc) => doc.data()); // .docs is the attribute on the query object. doc.data() give you the actual thing that was stored in firebase instead of the reference of things

  // doc.id can get the random number/id of the documentation

  const data = {
    type: 'FeatureCollection',
    features: issues,
  };
  console.log(data);

  const issuesLayer = L.geoJSON(data, {
    pointToLayer: (feature, latlng) => {
      const icon = L.icon({
        iconUrl: `images/markers/${feature.properties.category}-marker.png`,
        iconSize: [35, 41],
        iconAnchor: [18, 41],
        shadowUrl: 'images/markers/marker-shadow.png',
        shadowSize: [35, 41],
        shadowAnchor: [13, 41],
      });
      return L.marker(latlng, { icon });
    },
  });
  issuesLayer.addTo(map);
  return issuesLayer;
}

const [trailsLayer, issuesLayer] = await Promise.all([
  loadTrails(),
  loadIssues(),
]);
initIssueReporter(map, trailsLayer, issuesLayer, issuesCollection);
