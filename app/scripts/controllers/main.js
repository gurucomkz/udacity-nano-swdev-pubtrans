/**
 * @ngdoc function
 * @name pubTransApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the pubTransApp
 */
angular.module('pubTransApp')
.controller('MainCtrl', [
    '$scope',
    '$http',
    'AppSettings',
function ($scope, $http, AppSettings) {
    'use strict';

    var apiKey = '4bad51fb-4b43-4464-9f5e-e69576651176';

    $scope.operator = AppSettings.val('lastOperator');

    $scope.allStations = null;
    $scope.allOperators = null;
    $scope.travelLine = AppSettings.val('lastLine');
    $scope.travelStart = AppSettings.val('lastStart');
    $scope.travelEnd = AppSettings.val('lastStop');


    $scope.stationsReady = function() {

    };

    $scope.stationChange = function(station, position){
        console.log([station, position]);

        $scope[position === 'start' ? 'travelStart' : 'travelEnd'] = station;

        if($scope.travelStart && $scope.travelEnd){
            $scope.stationsReady();
        }
    };

    $scope.operatorChange = function(newOperator) {
        console.log(['new operator', newOperator]);
        $scope.operator = newOperator;
    }

    $scope.stationSearchTextStart = '';
    $scope.stationSearchTextEnd = '';

    $scope.stationQuerySearch = function(query, position){
        var ignore = position !== 'start' ? $scope.travelStart : $scope.travelEnd;

        query = (query||'').toLowerCase();
        return $scope.allStations
                    .filter(function(candidate){
                        return candidate && candidate.Name && candidate.id != (ignore || {id:null}).id &&
                            candidate.Name.toLowerCase().indexOf(query)>=0;
                    });
    };

    $scope.filterOperators = function(query){
        query = (query||'').toLowerCase();
        return $scope.allOperators
                    .filter(function(candidate){
                        return candidate && candidate.Name &&
                            candidate.Name.toLowerCase().indexOf(query)>=0;
                    });
    };


    //timetable
    //https://api.511.org/transit/timetable?api_key={yourkey}&operator_id=BART&line_id=COLS/OAKL
    //stop timetable
    //https://api.511.org/transit/stoptimetable?format=json&OperatorRef=SFMTA&MonitoringRef=13008&api_key=4bad51fb-4b43-4464-9f5e-e69576651176

    $scope.fetchOperatorStops = function() {
        if(!$scope.operator || !$scope.operator.Id){
            return;
        }
        $http.get('https://api.511.org/transit/stops?format=json&operator_id='+$scope.operator.Id+'&api_key='+apiKey)
            .then(function(response){
                var pre = response.data.Contents.dataObjects.ScheduledStopPoint;

                var ids = [];
                $scope.allStations = pre.filter(function(station){
                    if(ids.indexOf(station.id) >= 0){
                        return false;
                    }
                    ids.push(station.id);
                    return true;
                });
            });
    };

    $scope.fetchOperators = function () {
        $http.get('https://api.511.org/transit/operators?format=json&api_key='+apiKey)
            .then(function(response){
                $scope.allOperators = response.data.filter(function(oper){
                    return oper && oper.Id && (oper.Monitored || oper.Montiored);
                });
            });
    };

    $scope.fetchOperators();
    ////////////////
    //  watchers  //
    ////////////////

    $scope.$watch('operator', function(newVal, oldVal){
        AppSettings.val('lastOperator', newVal);
        $scope.allStations = null;
        $scope.fetchOperatorStops();
    });
    $scope.$watch('travelLine', function(newVal, oldVal){
        AppSettings.val('lastLine', newVal);
    });
    $scope.$watch('travelStart', function(newVal, oldVal){
        AppSettings.val('lastStart', newVal);
    });
    $scope.$watch('travelEnd', function(newVal, oldVal){
        AppSettings.val('lastStop', newVal);
    });
}]);
