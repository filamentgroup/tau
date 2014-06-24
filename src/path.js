(function( window, $ ) {
  window.componentNamespace = window.componentNamespace || window;

  var Path = window.componentNamespace.Tau.Path = function() {
    this.reset();
  };

  Path.prototype.isSufficient = function() {
    return !!this.prevPoint && this.prevPrevPoint;
  };

  Path.prototype.distance = function() {
    return this.prevPoint.x - this.prevPrevPoint.x;
  };

  Path.prototype.duration = function() {
    return this.prevTime - this.prevPrevTime;
  };

  // TODO sort out variable names
  Path.prototype.record = function( point ) {
    this.prevPrevTime = this.prevTime;
    this.prevPrevPoint = this.prevPoint;

    // record the most recent drag point for decel on release
    this.prevTime = Date.now();
    this.prevPoint = point;
  };

  Path.prototype.velocity = function( timeStep ) {
    var distance, time;

    distance = this.distance();
    time = this.duration();

    return distance / ( time / timeStep );
  };

  Path.prototype.reset = function() {
    this.prevPoint = undefined;
    this.prevTime = undefined;

    this.prevPrevTime = undefined;
    this.prevPrevPoint = undefined;
  };

  Path.prototype.last = function() {
    return this.prevPoint;
  };
})(this, jQuery);
