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
    var main = mixdown.start(function(err, delegate) {
      assert.ifError(err);
      
      var emitCount = 0;

      // should be printing numbers now and they should alternate between apps.
      // listen for 4 events and check that the correct number is emitted each time.
      delegate.on('number', function(number) {
        emitCount++;

        if (emitCount > 4) {
          mixdown.stop(done);
          return;
        }

        if (emitCount % 2 !== 0) {
          assert.equal(number, 100, "Number should match service 1's number value");
        }
        else {
          assert.equal(number, 200, "Number should match service 1's number value");
        }

      });
    });

  });
});