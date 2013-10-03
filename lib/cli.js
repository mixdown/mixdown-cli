var _ = require('lodash');
var util = require('util');
var async = require('async');
var pluginUtil = require('./pluginutil.js');

var loadDelegate = function(mixdown, options) {
  var delegateOptions = options.delegate;
  var Module = pluginUtil.require({ plugin: delegateOptions });
  var delegate = new Module(mixdown, delegateOptions.options);

  return delegate;
};

module.exports = function(mixdown, options) {
  this.delegate = loadDelegate(mixdown, options);  // TODO: load main from the config options.
  var that = this;

  this.start = function(callback) {
    callback = callback || function() {};  // fill with no-op if null to make delegate dev easier.
    that.delegate.start(function(err) {
      mixdown.emit('start', err, mixdown);
      callback(err);
    });
  };

  var reload = function() {
    
    // map the init fns to an array for async
    var inits = _.map(mixdown.apps, function(app) {
      return app.init.bind(app);
    });

    // async the inits and notify when they are done.
    // TODO: see if a single app failure could cause all apps to fail.
    that.stop(function() {
      async.parallel(inits, function(err) {
        if (err) {
          logger.error('Initialize failed.', async);
          return;
        }
        mixdown.emit('reload', err, mixdown);
        that.start();
      });
    });

  };

  this.stop = function(callback) {
    this.delegate.stop(callback);
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
        reload();
      });
    }
  });

};