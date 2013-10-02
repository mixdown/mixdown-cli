var _ = require('lodash');
var path = require('path');

// This is copied from mixdown.  It is copied to avoid a circular dependency on mixdown.
// https://github.com/mixdown/mixdown/blob/20f8ce2a6d62ffc4310f3fe91edc68bf5b8adbd7/lib/pluginutil.js
var pluginUtility = {


  require: function(options) {

    if (!options || !options.plugin) {
      throw new Error('No plugin was passed into require. Cannot require module.');
    }

    var Mod = null;
    var modulePath = (options.plugin.module || '').split('#');
    var requirePath = modulePath.length ? modulePath[0] : null;
    var prop = modulePath.length > 1 ? modulePath[1] : null;
    var err = [];

    var emitError = function() {
        var msg = _.map(err, function(e) { return e.message; }).join('\\n');
        throw new Error('Could not load plugin: ' + options.plugin.module + ', ' + msg);
    };

    if (requirePath) {
      try {
        Mod = require(requirePath);
      } catch (e) {
        err.push(e);
      }

      if (!Mod) {
        try {
          Mod = require(path.join(process.cwd(), requirePath));
        } catch (e) {
          e.message += ' ' + path.join(process.cwd(), requirePath);
          err.push(e);
        }
      }

      if (Mod) {
        try {
          Mod = prop ? Mod[prop] : Mod;
        }
        catch (e) {
          err.push(e);
          emitError();
        }
      }
      else {
        emitError();
      }
    }

    return Mod;
  },

  use: function(options) {

    if (!options || !options.plugin) {
      throw new Error('No plguin was passed into resolve. Cannot require module.');
    }

    if (!options || !options.app) {
      throw new Error('No app was passed into resolve. Cannot attach plugin');
    }

    var Mod = pluginUtility.require(options);
    var app = options.app;
    app.plugins.use(new Mod(options.namespace), _.extend({ app: app }, options.plugin.options || {}));

    return app;
  }
};

module.exports = pluginUtility;   