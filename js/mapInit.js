// Create the script tag, set the appropriate attributes
var script = document.createElement('script');
script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBhxMhVy0haqNi6Cehd9q_wp8iOrG0edbQ&callback=initMap&libraries=places';
script.defer = true;
script.async = true;

// Attach your callback function to the `window` object
window.initMap = function() {
};

// Append the 'script' element to 'head'
document.head.appendChild(script);