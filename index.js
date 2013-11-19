var _ = require('lodash');
var opt = require('optimist')
var util = require('util');
var cluster = require('cluster');
var MixdownCLI = require('./lib/cli.js');
var path = require('path');
var packageJSON = require(path.join(process.cwd(), '/package.json'));

// Export the factory
exports.create = function(mixdown, options) {
  var main = new Main(mixdown, options);

// placeholder for options for starting the server
  var argv = opt
    .alias('h', 'help')
    .alias('?', 'help')
    .describe('help', 'Display help')
    .usage('Starts ' + packageJSON.name + ' framework for serving multiple sites.\n\nVersion: ' + packageJSON.version + '\nAuthor: ' + packageJSON.author)
    .alias('v', 'version')
    .describe('version', 'Display Mixdown application version.')
    .argv;

  if(argv.help) {
    opt.showHelp();
    process.exit();
  }

  if(argv.version) {
    console.log(packageJSON.version);
    process.exit();
  }

  return main;
};

var Main = function(mixdown, options) {

  // instance attrs
  this.service = null;
  this.workers = {};

  // passed configs.
  this.mixdown = mixdown;
  this.options = options;
};

Main.prototype.stop = function(callback) {
  if (this.service) {
    this.service.stop(callback);
  }
  else {
    callback();
  }
};

Main.prototype.start = function(callback) {
  var that = this;
  var mixdown = this.mixdown;

  var logServerInfo = function(message) {
    var hmap = _.map(mixdown.apps, function(app) { return _.pick(app, 'vhosts', 'id'); });
    logger.info(message || 'Service Information. ', Object.keys(mixdown.apps));
  };

  // this reload listener just logs the reload info.
  mixdown.on('reload', logServerInfo.bind(null, 'Mixdown reloaded.  '));

  var createService = function(done) {
    // start server.  Sets up server, port, and starts the app.
    that.service = new MixdownCLI(that.mixdown, that.options);

    that.service.start(function(err, data) {
      if (err) {
        logger.critical("Could not start service.  Stopping process.", err);
        process.exit();
      }
      else {
        logServerInfo('Service started successfully.');
        done(err, that.service.delegate);
      }
    });
  };

  // Start cluster.
  var children = this.workers;
  var clusterConfig = mixdown.main.options.cluster || {};

  if(clusterConfig.on){
    logger.info("Using cluster");
    
    var numCPUs = clusterConfig.workers || require('os').cpus().length;
    
    if(cluster.isMaster){
      logger.info("Starting master with " + numCPUs + " CPUs");

      // spawn n workers
      for (var i = 0; i < numCPUs; i++) {
        var child = cluster.fork();
        children[child.process.pid] = child;
      }

      // Add application kill signals.
      var signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
      _.each(signals, function(sig) {

        process.on(sig, function() {

          _.each(children, function(child) {
            child.destroy();  // send suicide signal
          });

          // create function to check that all workers are dead.
          var checkExit = function() {
            if (_.keys(children).length == 0) {
              that.stop(process.exit);
            }
            else {
              setImmediate(checkExit);   // keep polling for safe shutdown.
            }
          };

          // poll the master and exit when children are all gone.
          setImmediate(checkExit);
          
        });

      });

      cluster.on('exit', function(worker) {
        logger.error('Worker exited unexpectedly. Spawning new worker', worker);

        // remove the child from the tracked running list..
        delete children[worker.process.pid];

        // if it purposely destroyed itself, then do no re-spawn.  
        // Otherwise, it was killed for some external reason and should create a new child in the pool.
        if (!worker.suicide) {

          // spawn new child
          var child = cluster.fork();
          children[child.process.pid] = child;
        }
         
      });

    } else {
      logger.info("Worker ID", process.env.NODE_WORKER_ID);
      createService(callback);
    }
    
  } 
  else {
    createService(callback);
  }
};

