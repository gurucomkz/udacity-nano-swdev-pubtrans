'use strict';

/**
 * @ngdoc service
 * @name pubTransApp.GtfsUtils
 * @description
 * # GtfsUtils
 * Service in the pubTransApp.
 */
angular.module('pubTransApp')
.service('GtfsUtils', [
    '$http',
    'GtfsDB',
function ($http, GtfsDB) {
    var me = this;

    var urlOperators = 'http://localhost:9001/gtfs/carriers.json';
    var urlOperatorRoutes = 'http://localhost:9001/gtfs/{}/routes.txt';
    var urlOperatorStops = 'http://localhost:9001/gtfs/{}/stops.txt';
    var urlOperatorStopsTimes = 'http://localhost:9001/gtfs/{}/stop_times.txt';
    var urlOperatorTrips = 'http://localhost:9001/gtfs/{}/trips.txt';
    var urlOperatorOnline = 'http://localhost:9001/updates/{1}';  //{1}: operator, {2}: stopId

    //fetchers
    this.fetchOperatorRoutes = function(operId) {
        return new Promise(function(resolve, reject) {
            GtfsDB.getRoutes(operId)
                .catch(function() {
                    return $http.get(urlOperatorRoutes.replace('{}',operId))
                            .then(responseParseCSV)
                            .then(function(d) {
                                return GtfsDB.saveRoutes(operId, d);
                            });
                })
                .then(makeKeymaker('id'))
                .then(resolve)
                .catch(reject);
        });
    };

    this.fetchOperatorTrips = function(operId) {
        return $http.get(urlOperatorTrips.replace('{}',operId))
                .then(responseParseCSV)
                .then(makeGrouper('route_id'));
    };

    this.fetchOperatorStops = function(operId) {

        var keymaker = makeKeymaker('id'),
            filler = makeFiller({'operator_id': operId});

        return new Promise(function(resolve, reject) {
            GtfsDB.getStops(operId)
                .catch(function() {
                    return $http.get(urlOperatorStops.replace('{}',operId))
                                .then(responseParseCSV)
                                .then(filler)
                                .then(function(d) {
                                    return GtfsDB.saveStops(operId, d);
                                })
                                .then(keymaker)
                                .then(resolve)
                                .catch(reject);
                })
                .then(keymaker)
                .then(resolve)
                .catch(reject);
        });
    };

    this.fetchStopTimes = function(operId){
        return $http.get(urlOperatorStopsTimes.replace('{}',operId))
                .then(responseParseCSV)
                .then(makeTimeProcessor('arrival_time', 'time'))
                //.then(makeTimeProcessor('departure_time'))
                .then(makeGrouper('trip_id'));
    };

    this.fetchOperators = function () {
        return new Promise(function(resolve, reject) {
            GtfsDB.getOperators()
            .then(resolve)
            .catch(function() {
                console.log('fetching operators from network');
                $http.get(urlOperators)
                    .then(function(response){
                        var opers = response.data.map(function(oper){
                            return {
                                Name: oper.CarrierName,
                                Id: oper.CarrierID,
                                RemoteId: oper.RemoteId
                            };
                        });
                        GtfsDB.saveOperators(opers);
                        resolve(opers);
                    }, reject);
                });
        });
    };

    this.remoteTimetable = function(operId, stopId){
        return new Promise(function(resolve, reject) {
            $http.get(urlOperatorOnline.replace('{1}',operId).replace('{2}',stopId))
                .then(function(response){
                    resolve(response.data);
                }, reject);
        });
    };

    //transformators

    var connCache = {};
    this.hasConnection = function(stoptimesByTrip, id1, id2, all){
        if(!stoptimesByTrip) return false;
        var connCacheKey = [id1, id2, all?1:0].join('-');
        if(connCacheKey in connCache){
            return connCache[connCacheKey];
        }
        var connection = all ? [] : false;
        var _find = function(trip,id){
            return trip.filter(function(stop) {
                return stop.stop_id === id;
            }).length;
        };
        // var _getSeqId = function(trip, stopId){
        //     var entry = trip.find(function(stopEntry) {
        //         return stopEntry.stop_id == stopId;
        //     });
        //     return entry ? entry.stop_sequence : undefined;
        // };

        // var _getAllSeqId = function(trip, stopId){
        //     var entries = trip.filter(function(stopEntry) {
        //         return stopEntry.stop_id == stopId;
        //     });
        //     return entries.map(function(stopEntry) {
        //         return stopEntry.stop_sequence;
        //     });
        // };
        angular.forEach(stoptimesByTrip, function(tripData, trip_id){
            if(_find(tripData,id1) && _find(tripData,id2)){
            //    console.log(['found both '+id1+' and '+ id2+' in trip='+trip_id, _getAllSeqId(tripData,id1), _getAllSeqId(tripData,id2)]);
                if(all){
                    connection.push(parseInt(trip_id));
                }else{
                    connection = true;
                    return false;
                }
            }
        });
        connCache[connCacheKey] = connection;
        return connection;
    };

    //converters
    var makeTimeProcessor = function(field, convertTo){
        return function(dataArray){
            return new Promise(function(resolve) {
                resolve(dataArray.map(function(entry){
                    try{
                        var tms = entry[field].split(':');
                        entry[convertTo || field] = new Date(1970,0,1,parseInt(tms[0]),parseInt(tms[1]),parseInt(tms[2]));
                    }catch(e){}
                    return entry;
                }));
            });
        };
    };

    var makeFiller = function(append){
        return function(dataArray){
            return new Promise(function(resolve) {
                resolve(dataArray.map(function(entry){
                    angular.forEach(append, function(value, key) {
                        entry[key] = value;
                    });
                    return entry;
                }));
            });
        };
    };

    var makeKeymaker = function(keyField){
        return function(dataArray){
            return new Promise(function(resolve) {
                var outObj = {};
                dataArray.forEach(function(dataEntry) {
                    outObj[dataEntry[keyField]] = dataEntry;
                });
                resolve(outObj);
            });
        };
    };

    var makeGrouper = function(keyField){
        return function(dataArray){
            return new Promise(function(resolve) {
                var outObj = {};
                dataArray.forEach(function(dataEntry) {
                    if(!(dataEntry[keyField] in outObj)){
                        outObj[dataEntry[keyField]] = [];
                    }
                    outObj[dataEntry[keyField]].push(dataEntry);
                });
                resolve(outObj);
            });
        };
    };

    this.array2object = function(data, keyField){
        var ret = {};
        for(var e = 0; e < data.length; e++){
            ret[data[e][keyField]] = data[e];
        }
        return ret;
    };

    var responseParseCSV = function(data){
        return Promise.resolve(me.parseCSV(data.data));
    };

    this.parseCSV = function (data){
        var ret = [],
            keys = [],
            exploded = data.split(/\r?\n/);
        if(!exploded.length){
            return ret;
        }
        //keys
        keys = exploded[0].split(',');
        //strip mostly used prefixes
        var keyP = {}, muP='', muPC=0;
        keys.forEach(function(k){
            var p = k.split('_')[0] + '_';
            keyP[p] = (keyP[p] || 0)+1;
        });
        for(var k in keyP){
            if(keyP[k] > muPC){
                muP = k;
                muPC = keyP[k];
            }
        }
        if(muP.length && muPC && muPC > keys.length/2){
            keys = keys.map(function(k){
                return k.replace(muP,'');
            });
        }

        //lines
        for(var line = 1; line < exploded.length-1; line++)
        {
            var lineExploded = exploded[line].split(','),
                entry = {};
            for(var ki=0; ki < keys.length; ki++){
                var key = keys[ki],
                    strVal = lineExploded[ki].replace(/^\"/,'').replace(/\"$/,'');
                if(strVal.match(/^-?\d+(\.\d+)?$/)){
                    entry[key] = parseFloat(strVal);
                }else{
                    entry[key] = strVal;
                }
            }
            ret.push(entry);
        }
        return ret;
    };
}]);
