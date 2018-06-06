if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

var CACHE_NAME = 'restaurant-reviews-v1';
var urlsToCache = [
  '/manifest.json',
  '/sw.js',
  '/index.html',
  '/css/normalize.css',
  '/css/styles.css',
  '/img/1.jpg',
  '/img/1_400.jpg',
  '/img/1_720.jpg',
  '/img/2.jpg',
  '/img/2_400.jpg',
  '/img/2_720.jpg',
  '/img/3.jpg',
  '/img/3_400.jpg',
  '/img/3_720.jpg',
  '/img/4.jpg',
  '/img/4_400.jpg',
  '/img/4_720.jpg',
  '/img/5.jpg',
  '/img/5_400.jpg',
  '/img/5_720.jpg',
  '/img/6.jpg',
  '/img/6_400.jpg',
  '/img/6_720.jpg',
  '/img/7.jpg',
  '/img/7_400.jpg',
  '/img/7_720.jpg',
  '/img/8.jpg',
  '/img/8_400.jpg',
  '/img/8_720.jpg',
  '/img/9.jpg',
  '/img/9_400.jpg',
  '/img/9_720.jpg',
  '/img/10.jpg',
  '/img/10_400.jpg',
  '/img/10_720.jpg',
  '/img/review.svg',
  '/img/review.png',
  '/js/dbhelper.js',
  '/js/idb.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  'https://fonts.googleapis.com/css?family=Ubuntu:700|Ubuntu+Condensed'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. Since we are consuming this
        // once by cache and once by the browser for fetch, we need
        // to clone the response.
        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});