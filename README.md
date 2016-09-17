# pub-trans

This project is generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.15.1.

## Build & development

* `npm install`
* `bower install`

Run `grunt` for building and `grunt serve` for preview.

## Test Data Server

`grunt serve` also tries to run node server on port 9001.

If you open app from `dist` folder without `grunt serve`, you can manually run server with `node server/index.js`.

I'm sure there is no need to include server into `dist` because it is a separate
instance intended to run in separate environment.

### Server control page

You can use `CTRL` button on top of the app or navigate to `http://localhost:9001/`.

Here you have switch for server mode.

* Online - works without any problems
* Offline - rejects all requests to app-specific data with 500 error.
* Lie-Fi - server simply forgets to answer to requests keeping them open.
* Slow - waits 20 seconds before answering any app-specific requests.

These switches do not affect server's ability to provide us with controls.

## Note about vehicle arrival predictions

Not all carriers provide accurate data about all the vehicles.
Stop ids may differ also.

Therefore there is no guarantee that 511.org will return any realtime data for any particular trip.

## Credits

GTFS data By [511 SF Bay](http://511.org)

Map image By [CountZ. - Own work, CC BY-SA 3.0](https://commons.wikimedia.org/w/index.php?curid=7934658)
