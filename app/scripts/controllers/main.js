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
    '$mdBottomSheet',
function ($scope, $http, AppSettings, $q, GtfsUtils, $timeout, $mdBottomSheet) {
    'use strict';

    $scope.operator = AppSettings.val('lastOperator');

    $scope.allStations = null;
    $scope.allStationsWKeys = null;
    $scope.allOperators = null;
    $scope.allLines = null;
    $scope.travelLine = AppSettings.val('lastLine');
    $scope.travelStart = AppSettings.val('lastStart');
    $scope.travelEnd = AppSettings.val('lastStop');

    $scope.monitoredStop = null;

    $scope.travelStartTT = null;
    $scope.travelEndTT = null;

    $scope.formHidden = $scope.travelStart && $scope.travelEnd;
    //$scope.formHidden = false;

    $scope.toggleForm = function(){
        $scope.formHidden = !$scope.formHidden;
        if(!$scope.formHidden){
            $scope.routes = null;
        }
    }

    $scope.stationsReady = function() {
        $scope.routes = getRoutesBetween($scope.travelStart.id , $scope.travelEnd.id);
        console.log(['routes between', $scope.routes]);
    };

    var thisTimeString = function(d){
        if(!d){ d = new Date(); }
        return [d.getHours(),d.getMinutes()+1,d.getSeconds()].map(function(p){return p > 9 ? p : '0'+p;}).join(':');
    };

    var stripSeconds = function(t){
        return t.replace(/:\d+$/,'');
    };

    var getRoutesBetween = function(a, b) {
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
            rData.stopSequence = null;

            angular.forEach(tripIds, function(tripId) {
                var path = {}, started = false, stopSequenceTpl = [];
                angular.forEach($scope.stoptimesByTrip[tripId], function (stopEntry, seqId) {
                    if(!started && stopEntry.stop_id == b){
                        //looks like reverse trip. swapping
                        var c = b; b = a; a = c;
                    }
                    if(!started && stopEntry.stop_id == a || started){
                        started = true;

                        var arrivalTime = stripSeconds(stopEntry.arrival_time);
                        if(arrivalTime < thisTime){
                            return;
                        }

                        path[arrivalTime] = stopEntry.stop_id;

                        if(!(stopEntry.stop_id in rData.stopTimes)){
                            rData.stopTimes[stopEntry.stop_id] = {};
                        }
                        if(!rData.stopTimes[stopEntry.stop_id][arrivalTime]){
                            rData.stopTimes[stopEntry.stop_id][arrivalTime] = [];
                        }
                        rData.stopTimes[stopEntry.stop_id][arrivalTime].push(tripId);
                        if(!rData.stopSequence){
                            stopSequenceTpl.push(stopEntry.stop_id);
                        }
                        if(stopEntry.stop_id == b){
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
            //angular.forEach(rData.stopTimes,function(timearr))
            routesBetween.push(rData);
        });


        console.log(['routes connecting Data', routesBetween]);
        return routesBetween;
    }

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
                })
            });
            if(have){
                if(!(have in routeIds)){
                    routeIds[have] = [];
                }
                routeIds[have].push(tripId);
            }
        });

        return routeIds;
    }

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

    $scope.showListBottomSheet = function() {
        $mdBottomSheet.show({
            templateUrl: 'monitor-sheet.html',
            controller: 'MonitorCtrl'
        }).then(function(clickedItem) {
            $scope.monitoredStop = null;
        });
    };

    //stop timetable
    //https://api.511.org/transit/stoptimetable?format=json&OperatorRef=SFMTA&MonitoringRef=13008&api_key=4bad51fb-4b43-4464-9f5e-e69576651176

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
        if(!newVal){
            return;
        }
        AppSettings.val('lastOperator', newVal);

        GtfsUtils.fetchOperatorStops($scope.operator.Id)
        .then(function(stopData) {
            console.log(['allStations', stopData]);
            $scope.allStationsWKeys = stopData;
            $scope.allStations = Object.values(stopData);
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

            if($scope.formHidden){
                $scope.stationsReady();
            }
        });
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
    });
}]);
