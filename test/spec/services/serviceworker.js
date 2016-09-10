'use strict';

describe('Service: ServiceWorker', function () {

  // load the service's module
  beforeEach(module('pubTransApp'));

  // instantiate service
  var ServiceWorker;
  beforeEach(inject(function (_ServiceWorker_) {
    ServiceWorker = _ServiceWorker_;
  }));

  it('should do something', function () {
    expect(!!ServiceWorker).toBe(true);
  });

});
