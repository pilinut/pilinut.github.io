// Initialize Directions Service and Renderer.
let directionsService = null;
let directionsRenderer = null;
const STORE_JSON = "stores.json";

var markers = [];

//Initializes Map, controls, and adds event listeners to those controls.
function initMap() {
  // Create the map default is Cebu City.
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    center: {lat: 10.308319862522845, lng: 123.93540354192591},
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();

  directionsRenderer.setMap(map);

  map.data.loadGeoJson(STORE_JSON, {idPropertyName: 'storeid'});

  const infoWindow = new google.maps.InfoWindow();

  //Initialize the additional controls.
  // Build and add the search bar
  const card = document.createElement('div');
  const titleBar = document.createElement('div');
  const title = document.createElement('div');
  const container = document.createElement('div');
  const input = document.createElement('input');
  const options = {
    types: ['address'],
    componentRestrictions: {country: 'ph'},
  };
  
  //Create card for current location
  card.setAttribute('id', 'pac-card');
  title.setAttribute('id', 'title');
  title.textContent = 'Find the nearest store';
  titleBar.appendChild(title);
  container.setAttribute('id', 'pac-container');
  input.setAttribute('id', 'pac-input');
  input.setAttribute('type', 'text');
  input.setAttribute('placeholder', 'Enter an address');
  container.appendChild(input);
  card.appendChild(titleBar);
  card.appendChild(container);
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);

  const chkCard = document.createElement('div');
  const cafeChkbox = document.createElement('input');
  const restaurantChkBox = document.createElement('input');
  const cafeLabel = document.createElement('label');
  const restaurantLabel = document.createElement('label');
  const titleDiv = document.createElement('div');

  // Create checkboxes for filters
  titleDiv.textContent = "Filter:";
  chkCard.appendChild(titleDiv);
  chkCard.setAttribute('id', 'pac-card');
  cafeChkbox.setAttribute('class', 'typeChkBox');
  cafeChkbox.setAttribute('type', 'checkbox');
  cafeChkbox.setAttribute('value', 'cafe');
  cafeChkbox.checked = true;
  cafeLabel.textContent = "Cafe";
  chkCard.appendChild(cafeChkbox);
  chkCard.appendChild(cafeLabel);
  restaurantChkBox.setAttribute('class', 'typeChkBox');
  restaurantChkBox.setAttribute('type', 'checkbox');
  restaurantChkBox.setAttribute('value', 'restaurant');
  restaurantChkBox.setAttribute('text', 'Restaurant');
  restaurantLabel.textContent = "Restaurant";
  restaurantChkBox.checked = true;
  chkCard.appendChild(restaurantChkBox);
  chkCard.appendChild(restaurantLabel);
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(chkCard);
  
  const autocomplete = new google.maps.places.Autocomplete(input, options);

  autocomplete.setFields(
      ['address_components', 'geometry', 'name']);

  const originMarker = new google.maps.Marker({map: map});
  originMarker.setVisible(false);
  let originLocation = map.getCenter();

  cafeChkbox.addEventListener('click', function() {
    if(this.checked) {
        // TODO wait for email reply about getting Markers
    } else {
        // TODO wait for email reply about getting Markers
    }
});
  
  restaurantChkBox.addEventListener('click', function() {
    if(this.checked) {
        // TODO wait for email reply about getting Markers
    } else {
        // TODO wait for email reply about getting Markers
    }
});

  map.data.addListener('click', (event) => {
    const category = event.feature.getProperty('category');
    const name = event.feature.getProperty('name');
    const visits = event.feature.getProperty('visits');
    const hours = event.feature.getProperty('hours');
    const phone = event.feature.getProperty('phone');
    const position = event.feature.getGeometry().get();
    const content = `
      <h2>${name}</h2>
      <p>${category}</p>
      <p>
        <b>Open:</b> ${hours}<br/>
        <b>Phone:</b> ${phone}<br/>
        <b>Visits:</b> ${visits}<br/>
      </p>
    `;

    infoWindow.setContent(content);
    infoWindow.setPosition(position);
    infoWindow.setOptions({pixelOffset: new google.maps.Size(0, -30)});
    infoWindow.open(map);
  });

  autocomplete.addListener('place_changed', async () => {
    originMarker.setVisible(false);
    originLocation = map.getCenter();
    const place = autocomplete.getPlace();

    if (!place.geometry) {
      window.alert('No address available for input: \'' + place.name + '\'');
      return;
    }

    // Recenter the map to the selected address
    originLocation = place.geometry.location;
    currentLocation = new google.maps.LatLng(parseFloat(originLocation.lat()), parseFloat(originLocation.lng()));
    map.setCenter(originLocation);
    map.setZoom(13);

    originMarker.setPosition(originLocation);
    originMarker.setVisible(true);

    // Use the selected address as the origin to calculate distances
    // to each of the store locations
    const rankedStores = await calculateDistances(map.data, originLocation);
    showStoresList(map.data, rankedStores);

    return;
  });

}

// Function to get the waypoint from origin to destination.
function calculateAndDisplayRoute(directionsService, directionsRenderer, origin, destination) {
    console.log(origin);
    console.log(destination);
  directionsService.route(
    {
      origin: {
        query: origin,
      },
      destination: {
        query: destination,
      },
      travelMode: google.maps.TravelMode.DRIVING,
    },
    (response, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(response);
      } else {
        window.alert("Directions request failed due to " + status);
      }
    }
  );
}

// Get the distances of each store to be displayed in the panel.
async function calculateDistances(data, origin) {
  const stores = [];
  const destinations = [];

  data.forEach((store) => {
    const storeNum = store.getProperty('storeid');
    const storeLoc = store.getGeometry().get();

    stores.push(storeNum);
    destinations.push(storeLoc);
  });

  const service = new google.maps.DistanceMatrixService();
  const getDistanceMatrix =
    (service, parameters) => new Promise((resolve, reject) => {
      service.getDistanceMatrix(parameters, (response, status) => {
        if (status != google.maps.DistanceMatrixStatus.OK) {
          reject(response);
        } else {
          const distances = [];
          const results = response.rows[0].elements;
          for (let j = 0; j < results.length; j++) {
            const element = results[j];
            const distanceText = element.distance.text;
            const distanceVal = element.distance.value;
            const distanceObject = {
              storeid: stores[j],
              distanceText: distanceText,
              distanceVal: distanceVal,
            };
            distances.push(distanceObject);
          }

          resolve(distances);
        }
      });
    });

  const distancesList = await getDistanceMatrix(service, {
    origins: [origin],
    destinations: destinations,
    travelMode: 'DRIVING',
    unitSystem: google.maps.UnitSystem.METRIC,
  });

  distancesList.sort((first, second) => {
    return first.distanceVal - second.distanceVal;
  });

  return distancesList;
}

// Displays stores on a left side panel.
function showStoresList(data, stores) {
  if (stores.length == 0) {
    console.log('empty stores');
    return;
  }

  let panel = document.createElement('div');
  if (document.getElementById('panel')) {
    panel = document.getElementById('panel');
    if (panel.classList.contains('open')) {
      panel.classList.remove('open');
    }
  } else {
    panel.setAttribute('id', 'panel');
    const body = document.body;
    body.insertBefore(panel, body.childNodes[0]);
  }

  while (panel.lastChild) {
    panel.removeChild(panel.lastChild);
  } 
  

  stores.forEach((store) => {
    const div = document.createElement('div');
    panel.appendChild(div);

    const name = document.createElement('p');
    name.classList.add('place');
    name.addEventListener("click", onClickEvent);
    const currentStore = data.getFeatureById(store.storeid);
    name.textContent = currentStore.getProperty('name');
    console.log(currentStore.getGeometry().get().lat());
    div.appendChild(name);
    const distanceText = document.createElement('p');
    distanceText.classList.add('distanceText');
    distanceText.textContent = store.distanceText;
    div.appendChild(distanceText);
    const coordinates = document.createElement('p');
    coordinates.classList.add('hidden');
    coordinates.textContent = currentStore.getGeometry().get().lat() + "," + currentStore.getGeometry().get().lng();
    div.appendChild(coordinates);
  });

  panel.classList.add('open');

  return;
}

// Click event when the text on the left panel is clicked.
function onClickEvent(event) {
    const origin = currentLocation;
    const destination = getLatLng(event.path[1].childNodes[2].textContent);
    calculateAndDisplayRoute(directionsService, directionsRenderer, origin, destination);
}

// Function to split the coordinate string and then create a LatLng object.
function getLatLng(coordinateString) {
    let splitArr = coordinateString.split(",");
    return new google.maps.LatLng(parseFloat(splitArr[0]), parseFloat(splitArr[1]));
}