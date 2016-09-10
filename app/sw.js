(function(self,caches){
	'use strict';

	var cacheNamePrefix = 'pubtrans-';
	var staticCacheName = cacheNamePrefix + 'static-v2';
	var fontsCacheName = cacheNamePrefix + 'fonts-v2';
	var apiCacheName = cacheNamePrefix + 'api-v1';
	var currentCaches = [
		staticCacheName,
		fontsCacheName,
		apiCacheName
	];

	function regCaches(){
		return caches.open(staticCacheName).then(function(cache) {
			return cache.addAll([
				'/'
			]);
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
		console.log(requestUrl.origin);

		if (requestUrl.origin === 'https://api.511.org') {
			if (requestUrl.pathname.startsWith('/transit/operators')) {
				event.respondWith(serveApi(event.request));
				return;
			}
			// if (requestUrl.pathname.startsWith('/avatars/')) {
			// 	event.respondWith(serveAvatar(event.request));
			// 	return;
			// }
			// TODO: respond to avatar urls by responding with
			// the return value of serveAvatar(event.request)
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
