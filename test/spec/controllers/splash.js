'use strict';

describe('Controller: SplashCtrl', function () {

  // load the controller's module
  beforeEach(module('pubTransApp'));

  var SplashCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SplashCtrl = $controller('SplashCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(SplashCtrl.awesomeThings.length).toBe(3);
  });
});
