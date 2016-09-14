'use strict';

describe('Service: GtfsDB', function () {

  // load the service's module
  beforeEach(module('pubTransApp'));

  // instantiate service
  var GtfsDB;
  beforeEach(inject(function (_GtfsDB_) {
    GtfsDB = _GtfsDB_;
  }));

  it('should do something', function () {
    expect(!!GtfsDB).toBe(true);
  });

});
