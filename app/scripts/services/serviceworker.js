/**
 * @ngdoc service
 * @name pubTransApp.ServiceWorker
 * @description
 * # ServiceWorker
 * Service in the pubTransApp.
 */
angular.module('pubTransApp')
.service('ServiceWorker',[
    '$mdToast',
function ($mdToast) {
    'use strict';

    if (!navigator.serviceWorker) {
        console.log("Navigator dows not support serviceWorker");
        return;
    }

    var toast = $mdToast.simple()
        .textContent("New version available")
        .action('REFRESH')
        .highlightAction(true)
        .position('bottom');

    var _updateReady = function(worker) {
        $mdToast.show(toast)
        .then(function() {
            worker.postMessage({action: 'skipWaiting'});
        });
    };

    var _trackInstalling = function(worker) {
        worker.addEventListener('statechange', function() {
            if (worker.state === 'installed') {
                _updateReady(worker);
            }
        });
    };

    navigator.serviceWorker.register('/sw.js')
    .then(function(reg) {
        if (!navigator.serviceWorker.controller) {
            return;
        }

        if (reg.waiting) {
            _updateReady(reg.waiting);
            return;
        }

        if (reg.installing) {
            _trackInstalling(reg.installing);
            return;
        }

        reg.addEventListener('updatefound', function() {
            _trackInstalling(reg.installing);
        });
    });

    // Ensure refresh is only called once.
    // This works around a bug in "force update on reload".
    var refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
    });
}]);
