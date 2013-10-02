module.exports = function(namespace) {
  namespace = namespace || 'randomNumber';

  this.attach = function(options) {

    this[namespace] = {
      get: function() {
        return options.value;
      }
    };

  };

  this.init = function(done) {
    this[namespace].initialized = true;
    done();
  };
};