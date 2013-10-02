var assert = require('assert');
var Mixdown = require('mixdown');

suite('Test application loading', function () {
  var cliConfig = require('../fixture/mixdown.json');
  var mixdown = new Mixdown(cliConfig);

  // mocha setup hook.
  setup(function(done){
    mixdown.init(done);
  });

  test('Run mixdown service.', function (done) {

    assert.equal(Object.keys(mixdown.apps).length, 2, '2 apps should exist.');
    
    // start cli
    mixdown.start(function(err) {
      // should be printing numbers now and they should alternate between apps.
      // TODO: intercept the number printing and assert.

      setTimeout(function() {
        mixdown.stop(done);
      }, 2000);

    });

  });

});