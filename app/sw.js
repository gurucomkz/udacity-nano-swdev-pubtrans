(function(self,caches){
	'use strict';

	var cacheNamePrefix = 'pubtrans-';
	var staticCacheName = cacheNamePrefix + 'static-v2';
	var fontsCacheName = cacheNamePrefix + 'fonts-v2';
	var apiCacheName = cacheNamePrefix + 'api-v2';
	var skinCacheName = cacheNamePrefix + 'skin-v1';
	var currentCaches = [
		//staticCacheName,
		fontsCacheName,
		apiCacheName
//		skinCacheName
	];

	function regCaches(){
		return caches.open(staticCacheName).then(function(cache) {
			// return cache.addAll([
			// 	'/'
			// ]);
		});
	}

	function regFonts(){
		return caches.open(fontsCacheName).then(function(cache) {
			return cache.addAll([
				'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
				'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
			]);
		});
	}

	function serveApi(request) {
		return caches.open(apiCacheName).then(function(cache) {
			return cache.match(request).then(function(response) {
				if (response) return response;

				return fetch(request).then(function(networkResponse) {
					cache.put(request, networkResponse.clone());
					return networkResponse;
				});
			});
		});
	}

	function serveSkin(request) {
		var storageUrl = request.url;

		return caches.open(skinCacheName).then(function(cache) {
			var rq = fetch(request).then(function(networkResponse) {
				cache.put(storageUrl, networkResponse.clone());
				return networkResponse;
			});

			return cache.match(storageUrl).then(function(response) {
				 return response || rq;
			});
		});
	}

	self.addEventListener('install', function(event) {
		event.waitUntil(
			regCaches()
			.then(regFonts())
		);
	});

	self.addEventListener('activate', function(event) {
		event.waitUntil(
			caches.keys().then(function(cacheNames) {
				return Promise.all(
					cacheNames.filter(function(cacheName) {
						return cacheName.startsWith(cacheNamePrefix) &&
							!currentCaches.includes(cacheName);
						}).map(function(cacheName) {
							return caches.delete(cacheName);
						})
					);
			})
		);
	});

	self.addEventListener('fetch', function(event) {
		var requestUrl = new URL(event.request.url);

		if (requestUrl.origin === 'http://localhost:9001') {
			if (requestUrl.pathname.startsWith('/gtfs/') ||
				requestUrl.pathname.startsWith('/carriers.json')
			){
				event.respondWith(serveApi(event.request));
				return;
			}
		}

		if (requestUrl.origin === 'https://api.511.org') {
			if (requestUrl.pathname.startsWith('/transit/operators')
				||requestUrl.pathname.startsWith('/transit/stops')
				||requestUrl.pathname.startsWith('/transit/lines')
				||requestUrl.pathname.startsWith('/transit/timetable')
			) {
				event.respondWith(serveApi(event.request));
				return;
			}
		}

		if (requestUrl.origin === location.origin) {
			//skin is retrieved from cache but still looks for updates, just in case
			if (
				//requestUrl.pathname.startsWith('/views/') ||
				requestUrl.pathname.startsWith('/styles/') ||
				requestUrl.pathname.startsWith('/bower_components/')
			)
			{
				event.respondWith(serveSkin(event.request));
				return;
			}
		}
		event.respondWith(
			caches.match(event.request).then(function(response) {
				return response || fetch(event.request);
			})
		);
	});


	self.addEventListener('message', function(event) {
		if (event.data.action === 'skipWaiting') {
			self.skipWaiting();
		}
	});
})(self, caches);
