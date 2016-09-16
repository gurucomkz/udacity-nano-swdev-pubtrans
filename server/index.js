var express = require('express'),
    app = express(),
    GtfsRealtimeBindings = require('gtfs-realtime-bindings'),
    request = require('request'),
    api511key = '4bad51fb-4b43-4464-9f5e-e69576651176',
    port = process.env.PORT || 9001;

var options = {
    dotfiles: 'ignore',
    etag: true,
    extensions: ['htm', 'html', 'json', 'txt'],
    index: 'index.html',
    maxAge: '1d',
    redirect: false
};

var MODE = 'online'; //online|offline|liefi|slow

function CORS(req, res, next) {
    //CORS!
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'accept, content-type');
    next();
}

function checkMode(req, res, next) {
    switch(MODE){
        case 'offline':
            res.sendStatus(500);
            return;
        case 'liefi':
            //just forget
            return;
        case 'slow':
            //wait 10 s
            setTimeout(next, 20*1000);
            return;
        default: next();
    }
}

app.get('/setmode/:mode',function(req, res, next){
    //here we process
    MODE = req.params.mode;
    res.send('OK');
});

app.get('/getmode',function(req, res, next){
    res.json({
        mode: MODE
    });
});

app.use('/gtfs', CORS, checkMode, express.static(__dirname + '/gtfs', options));

app.use('/', express.static(__dirname, options));

app.use('/bower_components',express.static(__dirname + '/../bower_components', options));

app.get('/updates/:agency', CORS, checkMode,
function(req, res, next){
    var agency = req.params.agency || 'caltrain';
    var requestSettings = {
        method: 'GET',
        url: 'https://api.511.org/transit/TripUpdates?format=json&agency='+agency+'&api_key=' + api511key,
        encoding: null
    };

    request(requestSettings, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var feed = GtfsRealtimeBindings.FeedMessage.decode(body),
                respObject = {
                    agency: agency,
                    updates: [],
                    source: feed
                };
            feed.entity.forEach(function(entity) {
                if (entity.trip_update) {
                    var respEntry = {
                        vehicle: entity.trip_update.vehicle.id,
                        tripId: entity.trip_update.trip.trip_id,
                        stops:{}
                    };
                    if(entity.trip_update.stop_time_update){
                        entity.trip_update.stop_time_update.forEach(function(update) {
                            var updateEntry = {
                                stopId: update.stop_id,
                                arrival: update.arrival && update.arrival.time ? (update.arrival.time.low || update.arrival.time.high) : null,
                                departure: update.departure && update.departure.time ? (update.departure.time.low || update.departure.time.high) : null
                            };
                            respEntry.stops[update.stop_id] = updateEntry;
                        });
                    }
                    respObject.updates.push(respEntry);
                    //console.log(entity.trip_update);
                }
            });
            res.json(respObject);
        }else{
            res.json([]);
        }
    });

});

app.listen(port);
