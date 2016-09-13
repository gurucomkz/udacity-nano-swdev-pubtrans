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
    'AppSettings',
    'GtfsUtils',
    '$timeout',
    '$mdToast',
function ($scope, AppSettings, GtfsUtils, $timeout, $mdToast) {
    'use strict';

    $scope.operator = AppSettings.val('lastOperator');

    $scope.allStations = null;
    $scope.allStationsWKeys = null;
    $scope.allOperators = null;
    $scope.allLines = null;
    $scope.travelLine = AppSettings.val('lastLine');
    $scope.travelStart = AppSettings.val('lastStart');
    $scope.travelEnd = AppSettings.val('lastStop');

    $scope.forecasts = {};

    $scope.formHidden = $scope.travelStart && $scope.travelEnd;
    //$scope.formHidden = false;

    $scope.toggleForm = function(){
        $scope.formHidden = !$scope.formHidden;
    };

    $scope.stationsReady = function() {
        if(!$scope.travelStart || !$scope.travelEnd) {
            $scope.formHidden = false;
            return;
        }
        $scope.formHidden = true;
        $scope.routes = getRoutesBetween($scope.travelStart.id , $scope.travelEnd.id);
        console.log(['routes between', $scope.routes]);
    };

    var forecastTimer = null;
    var stopForecatsFetching = function() {
        $scope.forecasts = {};
        if(forecastTimer){
            forecastTimer();
            forecastTimer = null;
        }
    };
    var getForecast = function(){
        $mdToast.show(
            $mdToast.simple().textContent('Updating forecasts...').position('bottom').hideDelay(1000)
        );
        GtfsUtils.remoteTimetable($scope.operator.RemoteId)
        .then(function(data) {
            $scope.forecasts = {};

            if(!data.updates){
                $mdToast.show(
                    $mdToast.simple().textContent('Sorry, no updates on this operator!').position('bottom').hideDelay(3000)
                );
                return;
            }
            if(!data.updates.length){
                $mdToast.show(
                    $mdToast.simple().textContent('No predictions available. Maybe its night in CA?').position('bottom').hideDelay(30000)
                );
                return;
            }

            angular.forEach(data.updates, function(update) {
                angular.forEach(update.stops, function(timeData, stopId) {
                    if(!(stopId in $scope.forecasts)){
                        $scope.forecasts[stopId] = [];
                    }
                    $scope.forecasts[stopId] = (timeData.arrival || timeData.departure)*1000;
                });
            });

            forecastTimer = $timeout(getForecast, 60000);
        })
        .catch(function() {
            forecastTimer = $timeout(getForecast, 5000);
        });
    };

    var thisTimeString = function(d){
        if(!d){ d = new Date(); }
        return [d.getHours(),d.getMinutes()+1,d.getSeconds()].map(function(p){return p > 9 ? p : '0'+p;}).join(':');
    };

    var stripSeconds = function(t){
        return t.replace(/:\d+$/,'');
    };

    var getRoutesBetween = function(a, b) {
        if(!$scope.tripsByRoute || !$scope.allRoutes){
            console.log('not ready yet');
            return;
        }
        var routesBetween = [];
        var connectingTrips = hasConnection(a, b, true);
        var connectingRoutes = getRoutesForTrips(connectingTrips);
        console.log(['trips connecting', connectingTrips]);
        console.log(['routes connecting', connectingRoutes]);
        routesBetween = [];

        var thisTime = stripSeconds(thisTimeString());

        angular.forEach(connectingRoutes, function(tripIds, routeId) {
            var rData = $scope.allRoutes[routeId];

            rData.tripStops = {};
            rData.tripIds = [];
            rData.stopTimes = {};
            rData.stopTimesRoutes = {};
            rData.stopSequence = null;

            angular.forEach(tripIds, function(tripId) {
                var path = {}, started = false, stopSequenceTpl = [];
                angular.forEach($scope.stoptimesByTrip[tripId], function (stopEntry) {
                    if(!started && stopEntry.stop_id === b){
                        //looks like reverse trip. swapping
                        var c = b; b = a; a = c;
                    }
                    if(!started && stopEntry.stop_id === a || started){
                        started = true;

                        var arrivalTime = stripSeconds(stopEntry.arrival_time);
                        if(arrivalTime < thisTime){
                            return;
                        }

                        path[arrivalTime] = stopEntry.stop_id;

                        if(!(stopEntry.stop_id in rData.stopTimesRoutes)){
                            rData.stopTimesRoutes[stopEntry.stop_id] = {};
                        }
                        if(!rData.stopTimesRoutes[stopEntry.stop_id][arrivalTime]){
                            rData.stopTimesRoutes[stopEntry.stop_id][arrivalTime] = [];
                        }
                        rData.stopTimesRoutes[stopEntry.stop_id][arrivalTime].push(tripId);
                        if(!rData.stopSequence){
                            stopSequenceTpl.push(stopEntry.stop_id);
                        }
                        if(stopEntry.stop_id === b){
                            if(!rData.stopSequence){
                                rData.stopSequence = stopSequenceTpl;
                            }
                            return false;
                        }
                    }
                });
                if(Object.keys(path).length){
                    rData.tripStops[tripId] = path;
                    rData.tripIds.push(tripId);
                }
            });

            angular.forEach(rData.stopTimesRoutes, function(timearr, stopId){
                rData.stopTimes[stopId] = Object.keys(timearr).sort(function(ta,tb) {
                    return ta===tb? 0 : (ta>tb?1:-1);
                });
            });
            routesBetween.push(rData);
        });

        getForecast();
        console.log(['routes connecting Data', routesBetween]);
        return routesBetween;
    };

    var getRoutesForTrips = function(tripIds) {
        if(tripIds && !(length in tripIds)){
            tripIds = [tripIds];
        }

        var routeIds = {},
            allRouteIds = Object.keys($scope.tripsByRoute);

        tripIds.forEach(function(tripId) {
            var have = allRouteIds.find(function(routeId){
                return !!$scope.tripsByRoute[routeId].filter(function(trip) {
                    return trip.trip_id === tripId;
                });
            });
            if(have){
                if(!(have in routeIds)){
                    routeIds[have] = [];
                }
                routeIds[have].push(tripId);
            }
        });

        return routeIds;
    };

    $scope.stationChange = function(station, position){
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

    var hasConnection = function(id1, id2, all){
        return GtfsUtils.hasConnection($scope.stoptimesByTrip, id1, id2, all);
    };

    $scope.stationQuerySearch = function(query, position){
        var ignore = position !== 'start' ? $scope.travelStart : $scope.travelEnd;

        var connected = !ignore ? $scope.allStations : $scope.allStations.filter(function(station) {
            return hasConnection(station.id, ignore.id);
        });

        query = (query||'').toLowerCase();

        //console.log(['lookup', query, position]);
        return connected
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

    $scope.fetchOperatorTrips = function() {
        if(!$scope.operator || !$scope.operator.Id){
            return;
        }
        GtfsUtils.fetchOperatorTrips($scope.operator.Id)
            .then(function(response){
                $scope.allTrips = response;
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
        //console.log(['new operator', newVal]);
        $scope.allStations = null;
        $scope.allStationsWKeys = null;
        $scope.allLines = null;
        $scope.travelStart = null;
        $scope.travelEnd = null;
        if(!newVal){
            return;
        }
        AppSettings.val('lastOperator', newVal);

        GtfsUtils.fetchOperatorStops($scope.operator.Id)
        .then(function(stopData) {
            console.log(['allStations', stopData]);
            $scope.allStationsWKeys = stopData;
            $scope.allStations = Object.keys(stopData).map(function(key){return stopData[key];});
            return GtfsUtils.fetchOperatorRoutes($scope.operator.Id);
        })
        .then(function(routesData){
            console.log(['allRoutes', routesData]);
            $scope.allRoutes = routesData;
            return GtfsUtils.fetchStopTimes($scope.operator.Id);
        })
        .then(function(stoptimesData) {
            console.log(['stoptimesByTrip', stoptimesData]);
            $scope.stoptimesByTrip = stoptimesData;
            return GtfsUtils.fetchOperatorTrips($scope.operator.Id);
        })
        .then(function(tripData) {
            console.log(['tripsByRoute', tripData]);
            $scope.tripsByRoute = tripData;
            $scope.stationsReady();
        });
    });

    $scope.$watch('formHidden', function(newVal){
        if(newVal){
            $scope.stationsReady();
        }else{
            $scope.routes = null;
            stopForecatsFetching();
        }
    });

    $scope.$watch('travelStart', function(newVal){
        AppSettings.val('lastStart', newVal);
    });
    $scope.$watch('travelEnd', function(newVal){
        AppSettings.val('lastStop', newVal);
    });
}]);
