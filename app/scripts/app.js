/**
 * @ngdoc overview
 * @name pubTransApp
 * @description
 * # pubTransApp
 *
 * Main module of the application.
 */
angular
.module('pubTransApp', [
    'indexedDB',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngMaterial'
])
.run(function(ServiceWorker){
    'use strict';
    ServiceWorker.init();
})
.config(function ($routeProvider, $mdThemingProvider, $indexedDBProvider) {
    'use strict';

    $indexedDBProvider
        .connection('pubTransAppDb')
        .upgradeDatabase(1, function(event, db){
            db.createObjectStore('operators', {keyPath: 'Id'});
        })
        .upgradeDatabase(2, function(event, db){
            db.deleteObjectStore('operators');
            db.createObjectStore('operators', {keyPath: 'Id'});
        })
        .upgradeDatabase(3, function(event, db){
            var objStore = db.createObjectStore('operator_stops', {keyPath: 'id'});
            objStore.createIndex('operator_idx', 'operator_id', {unique: false});
        })
        .upgradeDatabase(4, function(event, db){
            var objStore = db.createObjectStore('operator_stop_times', {keyPath: 'id'});
            objStore.createIndex('operator_idx', 'operator_id', {unique: false});
            objStore.createIndex('trip_idx', 'trip_id', {unique: false});
            objStore.createIndex('stop_idx', 'stop_id', {unique: false});
        })
        .upgradeDatabase(5, function(event, db){
            var objStore = db.createObjectStore('operator_routes', {keyPath: 'id'});
            objStore.createIndex('operator_idx', 'agency_id', {unique: false});
        })
        .upgradeDatabase(6, function(event, db){
            var objStore = db.createObjectStore('operator_trips', {keyPath: 'id'});
            objStore.createIndex('operator_idx', 'operator_id', {unique: false});
            objStore.createIndex('trip_idx', 'trip_id', {unique: false});
            objStore.createIndex('route_idx', 'route_id', {unique: false});
        })
        .upgradeDatabase(7, function(event, db){
            db.deleteObjectStore('operator_stops');
            db.deleteObjectStore('operator_stop_times');
            db.deleteObjectStore('operator_routes');
            db.deleteObjectStore('operator_trips');
        })
        .upgradeDatabase(8, function(event, db){
            var objStore;

            objStore = db.createObjectStore('operator_stops', {keyPath: 'id'});
            objStore.createIndex('operator_idx', 'operatorId', {unique: false});

            objStore = db.createObjectStore('operator_stop_times', {keyPath: 'id'});
            objStore.createIndex('operator_idx', 'operatorId', {unique: false});
            objStore.createIndex('trip_idx', 'tripId', {unique: false});
            objStore.createIndex('stop_idx', 'stopId', {unique: false});

            objStore = db.createObjectStore('operator_routes', {keyPath: 'id'});
            objStore.createIndex('operator_idx', 'agencyId', {unique: false});

            objStore = db.createObjectStore('operator_trips', {keyPath: 'id'});
            objStore.createIndex('operator_idx', 'operatorId', {unique: false});
            objStore.createIndex('trip_idx', 'tripId', {unique: false});
            objStore.createIndex('route_idx', 'routeId', {unique: false});
        });

    $mdThemingProvider.theme('default');

    $routeProvider
        .when('/', {
            templateUrl: 'views/main.html',
            controller: 'MainCtrl',
            controllerAs: 'main'
        })
        .when('/about', {
            templateUrl: 'views/about.html',
            controller: 'AboutCtrl',
            controllerAs: 'about'
        })
        .otherwise({
            redirectTo: '/'
        });
});
