(function( window, $ ) {
  var $window, $doc;

  $window = $(window);
  $doc = $( document.documentElement );

  window.componentNamespace = window.componentNamespace || window;

  Function.prototype.bind = function( context ) {
    var self = this;

    return function() {
      self.apply( context, arguments );
    };
  };

  var Tau = window.componentNamespace.Tau = function( element ) {
    var startIndex;

    this.element = element;
    this.$element = $( element );
    this.$initial = this.$element.find( "img" );
    this.$loading = this.$element.find( ".loading" );

    // make sure the initial image stays visible after enhance
    this.$initial.addClass( "focused" );

    // hide all other images
    this.$element.addClass( "enhanced" );

    // create the rest of the images
    this.createImages();

    // set the initial index and image
    this.goto( 0 );

    // start the automatic rotation
    this.autoRotate();

    // setup the event bindings for touch drag and mouse drag rotation
    this.bind();
  };

  Tau.autoRotateDelay = 64;
  Tau.verticalScrollRatio = 4;

  Tau.prototype.change = function( delta ) {
    this.goto( this.index + delta );
  };

  Tau.prototype.goto = function( index ) {
    var $next, normalizedIndex;

    index = index % this.$images.length;

    // stay within the bounds of the array
    normalizedIndex = (this.$images.length + index) % this.$images.length;

    // set the next image that's going to be shown/focused
    $next = this.$images.eq( normalizedIndex );

    // skip this action if the desired image isn't loaded yet
    // TODO do something fancier here instead of just throwing up hands
    if( !$next[0].tauImageLoaded ) {
      this.showLoading();
      return;
    }

    // record the updated index only after advancing is possible
    this.index = normalizedIndex;

    // hide the old focused image
    if( this.$current ) {
      this.$current.removeClass( "focused" );
    }

    // record the current focused image and make it visible
    this.$current = $next;

    // show the new focused image
    this.$current.addClass( "focused" );
  };

  // TODO transplant the attributes from the initial image
  Tau.prototype.createImages = function() {
    var src, frames, $new, boundImageLoaded;

    // avoid doing rebinding in a tight loop
    boundImageLoaded = this.imageLoaded.bind( this );

    src = this.$initial.attr( "data-src-template" );
    frames = parseInt( this.$initial.attr( "data-frames" ), 10 );

    // mark the initial image as loaded
    this.markImageLoaded( this.$initial[0] );

    for( var i = 2; i <= frames; i++) {
      $new = $( "<img src=" + src.replace("$FRAME", i) + "></img>" );

      // record when each image has loaded
      $new.bind( "load", boundImageLoaded );

      this.$element.append( $new );
    }

    this.$images = this.$element.find( "img" );
  };

  Tau.prototype.imageLoaded = function( event ) {
    this.markImageLoaded( event.target );
    this.hideLoading();
  };

  Tau.prototype.markImageLoaded = function( element ) {
    element.tauImageLoaded = true;
  };

  Tau.prototype.bind = function() {
    this.$element.bind( "mousedown touchstart", this.track.bind(this) );
  };

  Tau.prototype.autoRotate = function() {
    this.autoInterval = setInterval(function() {
      this.change( 1 );
    }.bind(this), Tau.autoRotateDelay);
  };

  Tau.prototype.stopAutoRotate = function() {
    clearInterval( this.autoInterval );
  };

  Tau.prototype.track = function( event ) {
    var point;

    // prevent dragging behavior for mousedown
    if( event.type === "mousedown"  ){
      event.preventDefault();
    }

    if( this.tracking ) {
      return;
    }

    $doc.one( "mouseup", this.release.bind(this) );
    $doc.one( "touchend", this.release.bind(this) );

    this.tracking = true;

    this.prevPoint = undefined;
    this.prevTime = undefined;

    this.cursorGrab();

    // calculate/store how many pixels makes for an image switch
    this.rotateThreshold = $doc[0].clientWidth / this.$images.length;

    // record the x for threshold calculations
    point = this.getPoint( event );
    this.downX = point.x;
    this.downY = point.y;
    this.downIndex = this.index;

    $doc.bind( "mousemove", this.rotateEvent.bind(this) );
    $doc.bind( "touchmove", this.rotateEvent.bind(this) );
  };

  Tau.prototype.decel = function() {
    var distance, time, point, velocity;

    if( !this.prevPoint || !this.prevPrevPoint ) {
      return;
    }

    distance = this.prevPoint.x - this.prevPrevPoint.x;
    time = this.prevTime - this.prevPrevTime;
    velocity = distance / (time/20);

    // console.log( "distance: " + distance );
    // console.log( "time: " + time );
    console.log( "initial velocity: " + velocity );

    var timeout = setInterval(function() {
      if( !this.prevPoint || !this.prevPrevPoint ) {
        clearInterval(timeout);
        return;
      }

      var point = {
        x: this.prevPoint.x + velocity,
        y: this.prevPoint.y
      };

      this.rotate( point );

      if( velocity > 0 ){
        velocity = velocity - 3;

        if( velocity <= 0 ){
          clearInterval(timeout);
        }
      } else {
        velocity = velocity + 2;

        if( velocity >= 0 ){
          clearInterval(timeout);
        }
      }
    }.bind(this), 20);
  };

  Tau.prototype.release = function( event ) {
    this.decel();

    this.cursorRelease();

    // TODO sort out why shoestring borks when unbinding with a string split list
    $doc.unbind( "mousemove", this.rotateEvent.bind(this) );
    $doc.unbind( "touchmove", this.rotateEvent.bind(this) );

    this.tracking = false;
  };

  Tau.prototype.cursorGrab = function() {
    $doc.addClass( "grabbing" );
  };

  Tau.prototype.cursorRelease = function() {
    $doc.removeClass( "grabbing" );
  };

  Tau.prototype.showLoading = function() {
    this.$loading.attr( "style" , "display: block" );
  };

  Tau.prototype.hideLoading = function() {
    this.$loading.attr( "style" , "display: none" );
  };

  Tau.prototype.getPoint = function( event ) {
    var touch = event.touches || (event.originalEvent && event.originalEvent.touches);

    if( touch ){
      return {
        x: touch[0].pageX,
        y: touch[0].pageY
      };
    }

    return {
      x: event.pageX,
      y: event.pageY
    };
  };

  Tau.prototype.rotateEvent = function( event ) {
    // NOTE it might be better to prevent when the rotation returns anything BUT false
    //      so that slow drags still get the scroll prevented
    if( this.rotate(this.getPoint(event)) ){
      event.preventDefault();
    };
  };

  Tau.prototype.rotate = function( point ) {
    var deltaX, deltaY;

    deltaX = point.x - this.downX;
    deltaY = point.y - this.downY;

    // if the movement on the Y dominates X then skip and allow scroll
    if( Math.abs(deltaY) / Math.abs(deltaX) >= Tau.verticalScrollRatio ) {
      return false;
    }

    // NOTE works better on mousedown, here allows autorotate to continue on scroll though
    this.stopAutoRotate();

    this.recordPath( point );

    // NOTE to reverse the spin direction add the delta/thresh to the downIndex
    if( Math.abs(deltaX) >= this.rotateThreshold ) {
      this.goto( this.downIndex - Math.round(deltaX / this.rotateThreshold) );
      return true;
    }
  };

  Tau.prototype.recordPath = function( point ) {
    this.prevPrevTime = this.prevTime;
    this.prevPrevPoint = this.prevPoint;

    // record the most recent drag point for decel on release
    this.prevTime = Date.now();
    this.prevPoint = point;
  };
})(this, jQuery);
