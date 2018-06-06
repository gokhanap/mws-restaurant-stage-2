let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

fetchRestaurants = () => {
  DBHelper.fetchRestaurants((callback) => {
    if (false) { // Got an error
      console.error(error);
    } else {
      console.log(callback);
    }
  });
}
fetchRestaurants();
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  // setTimeout(lazyLoad, 3000);
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.id = cuisine + "-opt";
   
    const label = document.createElement('label');
    label.innerHTML = cuisine;
    label.htmlFor = cuisine + "-opt";
       
    select.append(label);
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
  lazyLoad();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';

  const imgUrl = DBHelper.imageUrlForRestaurant(restaurant);
  // image.dataset.srcset = `${imgUrl}_400.jpg 400w, ${imgUrl}_720.jpg 720w, ${imgUrl}.jpg 800w`;
  image.sizes = "100%";
  image.dataset.src = `${imgUrl}.jpg`;
  // image.alt = restaurant.alt;
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

let observer;
let images;
let imageCount;

// Source: https://github.com/deanhume/lazy-observer-load/blob/master/lazy-load.js
function lazyLoad () {
  // Get all of the images that are marked up to lazy load
  images = document.querySelectorAll('.restaurant-img');
  const config = {
    // If the image gets within 10px in the Y axis, start the download.
    rootMargin: '10px 0px',
    threshold: 0.01
  };

  imageCount = images.length;

  // If we don't have support for intersection observer, loads the images immediately
  if (!('IntersectionObserver' in window)) {
    loadImagesImmediately(images);
  } else {
    // It is supported, load the images
    observer = new IntersectionObserver(onIntersection, config);

    // foreach() is not supported in IE
    for (let i = 0; i < images.length; i++) { 
      let image = images[i];
      if (image.classList.contains('restaurant-img--handled')) {
        continue;
      }

      observer.observe(image);
    }
  }

  /**
   * Fetchs the image for the given URL
   * @param {string} url 
   */
  function fetchImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = url;
      image.onload = resolve;
      image.onerror = reject;
    });
  }

  /**
   * Preloads the image
   * @param {object} image 
   */
  function preloadImage(image) {
    const src = image.dataset.src;
    if (!src) {
      return;
    }

    return fetchImage(src).then(() => { applyImage(image, src); });
  }

  /**
   * Load all of the images immediately
   * @param {NodeListOf<Element>} images 
   */
  function loadImagesImmediately(images) {
    // foreach() is not supported in IE
    for (let i = 0; i < images.length; i++) { 
      let image = images[i];
      preloadImage(image);
    }
  }

  /**
   * Disconnect the observer
   */
  function disconnect() {
    if (!observer) {
      return;
    }

    observer.disconnect();
  }

  /**
   * On intersection
   * @param {array} entries 
   */
  function onIntersection(entries) {
    // Disconnect if we've already loaded all of the images
    if (imageCount === 0) {
      observer.disconnect();
    }

    // Loop through the entries
    for (let i = 0; i < entries.length; i++) { 
      let entry = entries[i];
      // Are we in viewport?
      if (entry.intersectionRatio > 0) {
        imageCount--;

        // Stop watching and load the image
        observer.unobserve(entry.target);
        preloadImage(entry.target);
      }
    }
  }

  /**
   * Apply the image
   * @param {object} img 
   * @param {string} src 
   */
  function applyImage(img, src) {
    // Prevent this from being lazy loaded a second time.
    img.classList.add('restaurant-img--handled');
    img.src = src;
    img.classList.add('fade-in');
  }

}