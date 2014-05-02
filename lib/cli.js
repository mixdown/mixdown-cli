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
  var self = this;

  this.start = function(callback) {
    callback = callback || function() {};  // fill with no-op if null to make delegate dev easier.
    self.delegate.start(function(err) {
      mixdown.emit('start', err, mixdown);
      callback(err);
    });
  };

  var reload = function() {
    //re-init the apps
    self.stop(function() {
      mixdown.initServices(function(err,newMixdown) {

        mixdown.emit('reload', err, mixdown);
        self.start();
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

      externalConfig.on('update', function(config) {
        
        var isOverlay = function(conf){
          return conf.overlay === true;
        }

        var services = _.reject(config,isOverlay);
        var overlays = _.filter(config,isOverlay);

        mixdown.services = services;
        mixdown.overlays = overlays;

        mixdown
        reload();
      });
    }
  });

};