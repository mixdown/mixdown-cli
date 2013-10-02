
// This export must return an object (or class) with start/stop functions.  
// When mixdown calls start, mixdown.apps is already initialized.  This is true for start and reload scenarios.
module.exports = function(mixdown, options) {
  this.mixdown = mixdown;
  this.options = options;

  var keyIndex = 0;
  var keys = [];
  var isRunning = false;

  var printNumber = function() {
    if (!isRunning) {
      return;
    }

    keyIndex = keyIndex < keys.length ? keyIndex : 0;
    var app = mixdown.apps[keys[keyIndex++]];

    if (!app) {
      logger.error('No app available for service.');
      return;
    }

    console.log(app.plugins.number.get());
    setImmediate(printNumber); // re-queue itself
  };

  // TODO: add support to override options from argv

  // Start doing stuff.  This should start service or resume the service if stop was previously called.
  this.start = function(done) {
    keys = Object.keys(mixdown.apps);

    setImmediate(printNumber);
    isRunning = true;

    done();
  };

  // stop running the app.  stop() is responsible for pausing processing, saving state, or whatever so that it can pick up where it left off.
  // This is called on shutdown and also called on reload from config.
  this.stop = function(done) {
    isRunning = false;
    done();
  };
};
