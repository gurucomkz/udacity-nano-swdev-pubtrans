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
function ($http) {
    var me = this;

    //var apiKey = '4bad51fb-4b43-4464-9f5e-e69576651176';

    var urlOperators = 'http://localhost:9001/carriers.json';
    var urlOperatorLines = 'http://localhost:9001/gtfs/{}/routes.txt';
    var urlOperatorStops = 'http://localhost:9001/gtfs/{}/stops.txt';
    var urlOperatorStopsTimes = 'http://localhost:9001/gtfs/{}/stop_times.txt';

    //fetchers
    this.fetchOperatorLines = function(operId) {
        return $http.get(urlOperatorLines.replace('{}',operId))
                .then(responseParseCSV);
    };

    this.fetchOperatorStops = function(operId) {
        return $http.get(urlOperatorStops.replace('{}',operId))
                .then(responseParseCSV);
    };

    this.fetchTimetables = function(operId){
        return $http.get(urlOperatorStopsTimes.replace('{}',operId))
                .then(responseParseCSV);
    };

    this.fetchOperators = function () {
        return new Promise(function(resolve, reject) {
            $http.get(urlOperators)
                .then(function(response){
                    var opers = response.data.map(function(oper){
                        return {
                            Name: oper.CarrierName,
                            Id: oper.CarrierID
                        };
                    });
                    resolve(opers);
                }, reject);
        });
    };

    //converters

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
        if(muP.length && muPC && muPC > keys.length){
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
