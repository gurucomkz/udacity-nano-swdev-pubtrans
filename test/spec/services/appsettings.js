'use strict';

describe('Service: AppSettings', function () {

  // load the service's module
  beforeEach(module('pubTransApp'));

  // instantiate service
  var AppSettings;
  beforeEach(inject(function (_AppSettings_) {
    AppSettings = _AppSettings_;
  }));

  it('should do something', function () {
    expect(!!AppSettings).toBe(true);
  });

});
