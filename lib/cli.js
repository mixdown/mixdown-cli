var _ = require('lodash');
var util = require('util');
var async = require('async');
var pluginUtil = require('./pluginutil.js');

var loadDelegate = function(mixdown, options) {
  var delegateOptions = options.main;
  var Module = pluginUtil.require({ plugin: delegateOptions });
  var delegate = new Module(mixdown, delegateOptions.options);

  return delegate;
};

module.exports = function(mixdown, options) {
  var mainDelegate = loadDelegate(mixdown, options);  // TODO: load main from the config options.
  var that = this;

  this.start = this.reload = function(callback) {
    callback = callback || function() {};  // fill with no-op if null to make delegate dev easier.
    
    // map the init fns to an array for async
    var inits = _.map(mixdown.apps, function(app) {
      return app.init.bind(app);
    });

    // async the inits and notify when they are done.
    // TODO: see if a single app failure could cause all apps to fail.
    mainDelegate.stop(function() {
      async.parallel(inits, function(err) {
        if (err) {
          logger.error('Initialize failed.', async);
          return;
        }
        mainDelegate.start(callback);
        mixdown.emit('reload', err, mixdown);
      });
    });

  };

  // check if the external Config is enabled and starting listening if so.
  mixdown.getExternalConfig(function(err, externalConfig) {

    if (err) {
      logger.error(err);
    }
    else if (externalConfig) {

      logger.info('External Config initialized: ' + util.inspect(externalConfig));

      externalConfig.on('update', function(services) {
        mixdown.services = services;
        that.reload();
      });
    }
  });

};