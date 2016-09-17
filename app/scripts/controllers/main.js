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
    '$interval',
    '$rootScope',
function ($scope, AppSettings, GtfsUtils, $timeout, $mdToast, $interval, $rootScope) {
    'use strict';

    $scope.operatorReady = false;
    $scope.operator = AppSettings.val('lastOperator');

    $scope.allStations = null;
    $scope.allStationsWKeys = null;
    $scope.allOperators = null;
    $scope.allRoutes = null;
    $scope.tripsByRoute = null;

    $scope.travelLine = AppSettings.val('lastLine');
    $scope.travelStart = AppSettings.val('lastStart');
    $scope.travelEnd = AppSettings.val('lastStop');

    $scope.forecasts = {};

    $scope.formHidden = $scope.travelStart && $scope.travelEnd;
    $scope.allTimesExpanded = false;
    $scope.ttSize = 20;
    $scope.toggleTTsize = function() {
        $scope.allTimesExpanded = !$scope.allTimesExpanded;
        $scope.ttSize = $scope.allTimesExpanded?1000:20;
    };
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
            //$timeout.cancel(forecastTimer);
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

    $scope.timeInCA = null;

    $interval(function(){
        $scope.timeInCA = GtfsUtils.getCATime();
    }, 1000);

    $scope.$watch('timeInCA',function(newVal) {
        if(newVal && $scope.formHidden && $scope.routeMinTime < GtfsUtils.thisTimeString(newVal)){
            console.log('Recalculating...');
            $scope.stationsReady();
        }
    });
    /*
        provide object for each route

        must include:
            * stop sequence for each trip
            * timetable for start point
    */
    var getRoutesBetween = function(a, b) {
        if(!$scope.tripsByRoute || !$scope.allRoutes){
            //console.log('not ready yet');
            return;
        }
        $scope.routeMinTime = '30:00';
        var routesBetween = [];
        var connectingTrips = hasConnection(a, b, true);

        //exclude trips which don't start @ a after this time
        var thisTimeFull = GtfsUtils.thisTimeString();

        connectingTrips = connectingTrips.filter(function(tripId) {
            return !!$scope.stoptimesByTrip[tripId].find(function(stop) {
                return stop.stopId === a && stop.arrivalTime >= thisTimeFull;
            });
        });

        var connectingRoutes = getRoutesForTrips(connectingTrips);

        angular.forEach(connectingRoutes, function(tripIds, routeId) {
            var rData = $scope.allRoutes[routeId];

            rData.tripStops = {};
            rData.tripIds = [];
            rData.stopTimes = {};
            rData.stopTimesRoutes = {};
            rData.stopSequence = {};

            rData.tripDetails = {};

            angular.forEach(tripIds, function(tripId) {
                var stopTimes = $scope.stoptimesByTrip[tripId],
                    stopSequence = GtfsUtils.getTripStopSequence(stopTimes, a, b),
                    scK = stopSequence.map(function(s) { return s.stopId; }).join('-');

                if(!stopSequence.length){ return; }
                var duration = GtfsUtils.getSequenceDuration(stopSequence);

                rData.tripIds.push(tripId);
                rData.tripStops[tripId] = {};
                rData.stopSequence[scK] = {
                    entries: stopSequence,
                    duration: duration
                };

                rData.tripDetails[tripId] = {
                    stopSequenceKey: scK,
                    duration: duration
                };

                angular.forEach(stopSequence, function (stopEntry) {
                    var arrivalTime = GtfsUtils.stripSeconds(stopEntry.arrivalTime);

                    rData.tripStops[tripId][arrivalTime] = stopEntry.stopId;

                    if(!(stopEntry.stopId in rData.stopTimesRoutes)){
                        rData.stopTimesRoutes[stopEntry.stopId] = {};
                    }
                    if(!rData.stopTimesRoutes[stopEntry.stopId][arrivalTime]){
                        rData.stopTimesRoutes[stopEntry.stopId][arrivalTime] = [];
                    }
                    rData.stopTimesRoutes[stopEntry.stopId][arrivalTime].push(tripId);

                });
            });

            angular.forEach(rData.stopTimesRoutes, function(timearr, stopId){
                rData.stopTimes[stopId] = Object.keys(timearr).sort(function(ta,tb) {
                    return ta===tb? 0 : (ta>tb?1:-1);
                });
            });

            if(!rData.stopTimes[a]){
                //debugger;
            }
            if(rData.stopTimes[a][0] < $scope.routeMinTime){
                $scope.routeMinTime = rData.stopTimes[a][0];
            }

            routesBetween.push(rData);
        });

        getForecast();
        //console.log(['routes connecting Data', routesBetween]);
        return routesBetween;
    };

    var getRoutesForTrips = function(tripIds) {
        if(tripIds && typeof tripIds.length === 'undefined'){
            tripIds = [tripIds];
        }

        var routeIds = {};

        tripIds.forEach(function(tripId) {
            var routeId = $scope.allTrips[tripId].routeId;

            if(!(routeId in routeIds)){
                routeIds[routeId] = [];
            }
            routeIds[routeId].push(tripId);
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

    $scope.$watch('operator', function(newVal, oldVal){
        //console.log(['new operator', newVal]);
        $scope.allStations = null;
        $scope.allStationsWKeys = null;
        $scope.allRoutes = null;
        $scope.stoptimesByTrip = null;
        $scope.allTrips = null;
        $scope.tripsByRoute = null;

        $scope.operatorReady = false;

        if(!oldVal){
            $scope.travelStart = null;
            $scope.travelEnd = null;
        }
        if(!newVal){
            return;
        }
        AppSettings.val('lastOperator', newVal);

        GtfsUtils.fetchOperatorStops($scope.operator.Id)
        .then(function(stopData) {
            //console.log('allStations from fetchOperatorStops', stopData);
            $scope.allStationsWKeys = stopData;
            $scope.allStations = Object.keys(stopData).map(function(key){return stopData[key];});

            //console.log('calling fetchOperatorRoutes');
            return GtfsUtils.fetchOperatorRoutes($scope.operator.Id);
        })
        .then(function(routesData){
            //console.log('allRoutes from fetchOperatorRoutes', routesData);
            $scope.allRoutes = routesData;
            //console.log('calling fetchStopTimes');
            return GtfsUtils.fetchStopTimes($scope.operator.Id);
        })
        .then(function(stoptimesData) {
            //console.log('stoptimesByTrip from fetchStopTimes', stoptimesData);
            $scope.stoptimesByTrip = stoptimesData;

            //console.log('calling fetchOperatorTrips');
            return GtfsUtils.fetchOperatorTrips($scope.operator.Id);
        })
        .then(function(tripData) {
            //console.log('allTrips from fetchOperatorTrips', tripData);
            $scope.allTrips = tripData;

            //console.log('calling groupTripsByRoute');
            return GtfsUtils.groupTripsByRoute(tripData);
        })
        .then(function(groupedTripData) {
            //console.log('tripsByRoute from groupTripsByRoute', groupedTripData);
            $scope.tripsByRoute = groupedTripData;
            return Promise.resolve();
        })
        .then(function() {
            $scope.operatorReady = true;
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

    //splash
    var broadcastVar = function(varName){
        $scope.$watch(varName, function(value) {
            console.log('Sending broadcast for', varName, value);
            $rootScope.$broadcast(varName, { value: value });
        });
    };

    broadcastVar('operator');
    broadcastVar('allOperators');
    broadcastVar('operatorReady');
    broadcastVar('allStations');
    broadcastVar('allRoutes');
    broadcastVar('stoptimesByTrip');
    broadcastVar('tripsByRoute');

}]);
