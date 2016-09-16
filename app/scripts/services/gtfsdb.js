/**
 * @ngdoc service
 * @name pubTransApp.GtfsDB
 * @description
 * # GtfsDB
 * Service in the pubTransApp.
 */
angular.module('pubTransApp')
.service('GtfsDB', [
    '$indexedDB',
function ($indexedDB) {
    'use strict';

    this.getOperators = function() {
        return new Promise(function(resolve, reject) {
            //console.log('looking operators in db');
            $indexedDB.openStore('operators', function(store){
                store.getAll().then(function(data) {
                    //console.log('operators in db', data);
                    if(data && data.length){
                        resolve(data);
                    }else{
                        reject();
                    }
                })
                .catch(reject);
            });
        });
    };

    this.saveOperators = function(data) {
        return new Promise(function(resolve) {
            $indexedDB.openStore('operators', function(store){
                store.clear().then(function(){
                    store.insert(data);
                    resolve(data);
                });
            });
        });
    };

    this.getRoutes = function(operId) {
        return new Promise(function(resolve, reject) {
            //console.log('looking operators in db');
            $indexedDB.openStore('operator_routes', function(store){
                var find = store.query()
                                .$eq(operId)
                                .$index("operator_idx");

                store.eachWhere(find).then(function(data) {
                //    console.log('routes in db', data);
                    if(data && data.length){
                        resolve(data);
                    }else{
                        reject();
                    }
                })
                .catch(reject);
            })
            .catch(reject);
        });
    };

    this.saveRoutes = function(operId, data) {
        return new Promise(function(resolve) {
            $indexedDB.openStore('operator_routes', function(store){
                store.insert(data);
                resolve(data);
            });
        });
    };

    this.getTrips = function(operId) {
        return new Promise(function(resolve, reject) {
            //console.log('looking operators in db');
            $indexedDB.openStore('operator_trips', function(store){
                var find = store.query()
                                .$eq(operId)
                                .$index("operator_idx");

                store.eachWhere(find).then(function(data) {
                //    console.log('trips in db', data);
                    if(data && data.length){
                        resolve(data);
                    }else{
                        reject();
                    }
                })
                .catch(reject);
            })
            .catch(reject);
        });
    };

    this.saveTrips = function(operId, data) {
        return new Promise(function(resolve, reject) {
            $indexedDB.openStore('operator_trips', function(store){
                angular.forEach(data, function(entry) {
                    entry.id = [entry.route_id, entry.service_id, entry.trip_id, entry.block_id].join('-');
                });
                store.insert(data);
                resolve(data);
            })
            .catch(reject);
        });
    };


    this.getStops = function(operId) {
        return new Promise(function(resolve, reject) {
            // reject();
            // return;
            //console.log('looking stops in db for', operId);
            $indexedDB.openStore('operator_stops', function(store){
                var find = store.query()
                                .$eq(operId)
                                .$index("operator_idx");

                store.eachWhere(find).then(function(data) {
                    //console.log('stops in db', data);
                    if(data && data.length){
                        resolve(data);
                    }else{
                        reject();
                    }
                })
                .catch(reject);
            })
            .catch(reject);
        });
    };

    this.saveStops = function(operId, data) {
        return new Promise(function(resolve, reject) {
            $indexedDB.openStore('operator_stops', function(store){
                store.insert(data);
                resolve(data);
            })
            .catch(reject);
        });
    };

    this.getStopTimes = function(operId) {
        return new Promise(function(resolve, reject) {
            // reject();
            // return;
            //console.log('looking stop times in db for', operId);
            $indexedDB.openStore('operator_stop_times', function(store){
                var find = store.query()
                                .$eq(operId)
                                .$index("operator_idx");

                store.eachWhere(find).then(function(data) {
                //    console.log('stop times in db', data);
                    if(data && data.length){
                        resolve(data);
                    }else{
                        reject();
                    }
                })
                .catch(reject);
            });
        });
    };

    this.saveStopTimes = function(operId, data) {
        return new Promise(function(resolve) {
            $indexedDB.openStore('operator_stop_times', function(store){
                angular.forEach(data, function(entry) {
                    entry.id = [entry.trip_id, entry.stop_id, entry.stop_sequence].join('-');
                });
                store.insert(data);
                resolve(data);
            });
        });
    };

}]);
