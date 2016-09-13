# pub-trans

This project is generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.15.1.

## Build & development

Run `grunt` for building and `grunt serve` (NOT `grunt serve:dist` !!!) for preview.

## Test Data Server

You may see `grunt serve` (NOT `grunt serve:dist` !!!) tries to run node server on port 9001.

If you open app from `dist` folder, you can manually run server with `node server/index.js`.

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

## Testing

No tests implemented.
