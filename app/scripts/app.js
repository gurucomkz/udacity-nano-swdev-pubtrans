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
.config(function ($routeProvider, $mdThemingProvider) {
    'use strict';

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
