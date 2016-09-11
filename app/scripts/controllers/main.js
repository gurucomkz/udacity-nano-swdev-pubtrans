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
    '$q',
    'GtfsUtils',
    '$timeout',
function ($scope, $http, AppSettings, $q, GtfsUtils, $timeout) {
    'use strict';

    $scope.operator = AppSettings.val('lastOperator');

    $scope.allStations = null;
    $scope.allOperators = null;
    $scope.allLines = null;
    $scope.travelLine = AppSettings.val('lastLine');
    $scope.travelStart = AppSettings.val('lastStart');
    $scope.travelEnd = AppSettings.val('lastStop');

    $scope.travelStartTT = null;
    $scope.travelEndTT = null;


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
        $scope.operator = newOperator;
    };

    $scope.stationSearchTextStart = '';
    $scope.stationSearchTextEnd = '';

    $scope.stationQuerySearch = function(query, position){
        var ignore = position !== 'start' ? $scope.travelStart : $scope.travelEnd;

        query = (query||'').toLowerCase();
        return $scope.allStations
                    .filter(function(candidate){
                        return candidate && candidate.name && candidate.id !== (ignore || {id:null}).id &&
                            (candidate.name.toLowerCase().indexOf(query)>=0 ||
                            (''+candidate.id).indexOf(query)>=0
                            );
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

    //stop timetable
    //https://api.511.org/transit/stoptimetable?format=json&OperatorRef=SFMTA&MonitoringRef=13008&api_key=4bad51fb-4b43-4464-9f5e-e69576651176

    $scope.fetchOperatorStops = function() {
        if(!$scope.operator || !$scope.operator.Id){
            return;
        }
        GtfsUtils.fetchOperatorStops($scope.operator.Id)
            .then(function(response){
                $scope.allStations = response;
                $scope.fetchTimetables();
            });
    };

    $scope.fetchOperatorLines = function() {
        if(!$scope.operator || !$scope.operator.Id){
            return;
        }
        GtfsUtils.fetchOperatorLines($scope.operator.Id)
            .then(function(response){
                $scope.allLines = response;
                $scope.fetchTimetables();
            });
    };

    $scope.fetchTimetables = function () {
        if(!$scope.operator || !$scope.operator.Id){
            return;
        }
        GtfsUtils.fetchOperators($scope.operator.Id)
        .then(function(times){
            $scope.allTimes = times;
        });
    };

    $scope.fetchOperators = function() {
        GtfsUtils.fetchOperators()
        .then(function(operators){
            $scope.allOperators = operators;
        })
        .catch(function(){
            $timeout(function(){
                $scope.fetchOperators();
            },5000);
        });
    };

    $scope.fetchOperators();
    ////////////////
    //  watchers  //
    ////////////////

    $scope.$watch('operator', function(newVal){
        $scope.allStations = null;
        $scope.allLines = null;
        if(!newVal){
            return;
        }
        AppSettings.val('lastOperator', newVal);
        $scope.fetchOperatorStops();
        $scope.fetchOperatorLines();
        $scope.fetchTimetables();
    });
    $scope.$watch('travelLine', function(newVal){
        AppSettings.val('lastLine', newVal);
    });
    $scope.$watch('travelStart', function(newVal){
        if(!newVal){
            return;
        }
        AppSettings.val('lastStart', newVal);
        // $scope.fetchTimetables(newVal.id)
        // .then(function(data) {
        //     console.log(['travelStart TT',data]);
        //     try{
        //         data = data.Siri.ServiceDelivery.TimetableStopVisit;
        //     }catch(e){}
        //     $scope.travelStartTT = data;
        // })
    });
    $scope.$watch('travelEnd', function(newVal){
        if(!newVal){
            return;
        }
        AppSettings.val('lastStop', newVal);
        $scope.fetchTimetable(newVal.id)
        .then(function(data) {
            console.log(['travelEnd TT',data]);
            try{
                data = data.Siri.ServiceDelivery.TimetableStopVisit;
            }catch(e){}
            $scope.travelEndTT = data;
        });
    });
}]);
