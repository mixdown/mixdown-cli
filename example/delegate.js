
// This export must return an object (or class) with start/stop functions.  
// When mixdown calls start, mixdown.apps is already initialized.  This is true for start and reload scenarios.
module.exports = function(mixdown, options) {
  this.mixdown = mixdown;
  this.options = options;

  // TODO: add support to override options from argv

  // Start doing stuff.  This should start service or resume the service if stop was previously called.
  this.start = function(done) {

    done();
  };

  // stop running the app.  stop() is responsible for pausing processing, saving state, or whatever so that it can pick up where it left off.
  // This is called on shutdown and also called on reload from config.
  this.stop = function(done) {
    done();
  };
};