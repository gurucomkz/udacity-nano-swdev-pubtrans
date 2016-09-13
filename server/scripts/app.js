/**
 * @ngdoc overview
 * @name pubTransApp
 * @description
 * # pubTransApp
 *
 * Main module of the application.
 */
angular
.module('pubTransServerApp', [
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngSanitize',
    'ngMaterial'
])
.config(function ($mdThemingProvider) {
    'use strict';

    $mdThemingProvider.theme('default').primaryPalette('pink')
    .accentPalette('orange');
});
