/**
 * @ngdoc function
 * @name pubTransServerApp.controller:ServerCtrl
 * @description
 * # ServerCtrl
 * Controller of the pubTransApp
 */
angular.module('pubTransServerApp')
.controller('ServerCtrl', [
	'$scope',
	'$http',
function ($scope, $http) {
	'use strict';

	$scope.rqMode = 'online';

	$scope.currentMode = 'unknown';
	$scope.getMode = function() {
		$http.get('/getmode')
		.then(function(rsp) {
			$scope.currentMode = rsp.data.mode;
		})
	};

	var requestNewMode = function(mode){
		$http.get('/setmode/'+mode)
		.then(function() {
			$scope.getMode();
		})
	};

	$scope.getMode();
	$scope.$watch('rqMode',requestNewMode);
}]);
