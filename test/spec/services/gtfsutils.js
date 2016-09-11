'use strict';

describe('Service: GtfsUtils', function () {

  // load the service's module
  beforeEach(module('pubTransApp'));

  // instantiate service
  var GtfsUtils;
  beforeEach(inject(function (_GtfsUtils_) {
    GtfsUtils = _GtfsUtils_;
  }));

  it('should do something', function () {
    expect(!!GtfsUtils).toBe(true);
  });

});
