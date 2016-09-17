/**
 * @ngdoc function
 * @name pubTransApp.controller:SplashCtrl
 * @description
 * # SplashCtrl
 * Controller of the pubTransApp
 */
angular.module('pubTransApp')
.controller('SplashCtrl', [
    '$rootScope',
    '$scope',
function ($rootScope, $scope) {
    'use strict';

    var acceptVar = function(varName){
        $rootScope.$on(varName, function(e, data) {
            console.log('Received broadcast for', varName, data);
            $scope[varName] = !!data.value;
        });
    };

    acceptVar('operator');
    acceptVar('allOperators');
    acceptVar('operatorReady');
    acceptVar('allStations');
    acceptVar('allRoutes');
    acceptVar('stoptimesByTrip');
    acceptVar('tripsByRoute');

}]);
