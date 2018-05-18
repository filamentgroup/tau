(function( window, $ ) {
  var $window, $doc;

  $window = $(window);
  $doc = $( document.documentElement );

  var ns = window.componentNamespace = window.componentNamespace || "FG";
  window[ns] = window[ns] || {};

  Function.prototype.bind = Function.prototype.bind || function( context ) {
    var self = this;

    return function() {
      self.apply( context, arguments );
    };
  };

  var Tau = window[ns].Tau = function( element, options ) {
    var startIndex, reducedStepSize;

    this.element = element;
    this.options = options || {};
    this.$element = $( element );
    this.$initial = this.$element.find( "img" );
    this.$loading = this.$element.find( ".loading" );
    this.index = 0;

    // frame count by order of precendence
    // 1. initial frames when they are specified explicitly
    // 2. the data attribute on the initial image
    // 3. the configured number of frames
    this.frames =
      this.$initial.length > 1 ? this.$initial.length :
        parseInt( this.$initial.attr("data-frames"), 10 ) ||
        this.options.frames;

    // grab the user specified step size for when the browser is less-abled
    reducedStepSize = parseInt( this.$initial.attr("data-reduced-step-size"), 10 ) || 4;

    // TODO sort out a better qualification for the full set of images?
    this.stepSize = window.requestAnimationFrame ? 1 : reducedStepSize;

    // grab the user specified auto start delay
    this.autoRotateStartDelay =
      (this.options.autoplay || {}).delay ||
      parseInt( this.$initial.attr("data-auto-rotate-delay"), 10 ) ||
      Tau.autoRotateStartDelay;

    this.mouseMoveBinding = this.rotateEvent.bind(this);
    this.touchMoveBinding = this.rotateEvent.bind(this);

    this.path = new Tau.Path();

    // make sure the initial image stays visible after enhance
    this.$initial.first().addClass( "focused" );

    // hide all other images
    this.$element.addClass( "tau-enhanced" );

    // create a rendering spot to force decoding in IE and prevent blinking
    this.$render = $( "<div data-render class=\"render\"></div>" )
      .css( "position", "absolute" )
      .css( "left", "0" )
      .css( "top", "0" )
      .prependTo( this.element );

    if( this.options.canvas !== false ){
      this.canvas = $( "<canvas/>").prependTo( this.element )[0];

      if(this.canvas.getContext ){
        this.canvasCtx = this.canvas.getContext("2d");
        this.$element.addClass( "tau-canvas" );

        $(window).bind("resize", function(){
          clearTimeout(this.canvasResizeTimeout);
          this.canvasResizeTimeout = setTimeout(this.renderCanvas.bind(this), 100);
        }.bind(this));
      }
    }

    if( this.options.controls ){
      this.options.controls.text = this.options.controls.text || {
        play: "Spin Object",
        left: "Rotate Left",
        right: "Rotate Right"
      };

      this.createControls();
    }

    // create the rest of the images
    this.createImages();

    // set the initial index and image
    if( this.options.autoplay && this.options.autoplay.enabled ){
      // start the automatic rotation
      this.autostartTimeout = setTimeout(this.autoRotate.bind(this), this.autoRotateStartDelay);
    }

    // setup the event bindings for touch drag and mouse drag rotation
    this.bind();
  };

  Tau.autoRotateTraversalTime = 4500;
  Tau.autoRotateStartDelay = 100;
  Tau.verticalScrollRatio = 4;
  // Tau.decelTimeStep = Tau.autoRotateDelay / 2;
  // Tau.decel = Tau.decelTimeStep / 8;
  Tau.maxVelocity = 60;

  Tau.prototype.createControls = function(){
    this.$controls = $("<div class='tau-controls'></div>");

    if(this.options.controls.play){
      this.$controls.append(this.controlAnchorMarkup("play"));
    }

    if(this.options.controls.arrows){
      this.$controls
        .prepend(this.controlAnchorMarkup("left"))
        .append(this.controlAnchorMarkup("right"));
    }

    this.$controls.bind("mousedown touchstart", this.onControlDown.bind(this));
    this.$controls.bind("mouseup", this.onControlUp.bind(this));

    // prevent link clicks from bubbling
    this.$controls.bind("click", function(event){
      if( $(event.target).is("a") ){
        event.preventDefault();
      }
    });

    this.$element.append(this.$controls);
  };

  Tau.prototype.controlAnchorMarkup = function(name){
    var text = this.options.controls.text[name];

    return "<a href='#' data-tau-controls='" + name +
      "' title='" + text +
      "'>" + text +
      "</a>";
  };

  Tau.prototype.onControlDown = function(event){
    var $link = $(event.target).closest("a");

    switch($link.attr("data-tau-controls")){
    case "left":
      this.$element.addClass("control-left-down");
      this.stopAutoRotate();
      this.autoRotate();
      break;
    case "right":
      this.$element.addClass("control-right-down");
      this.stopAutoRotate();
      this.autoRotate(true);
      break;
    }
  };

  Tau.prototype.onControlUp = function(event){
    var $link = $(event.target).closest("a");

    switch($link.attr("data-tau-controls")){
    case "left":
    case "right":
      this.$element.removeClass("control-left-down");
      this.$element.removeClass("control-right-down");
      this.stopAutoRotate();
      break;
    case "play":
      if( this.autoInterval ){
        this.stopAutoRotate();
      } else {
        this.autoRotate();
      }
      break;
    }
  };

  Tau.prototype.change = function( delta ) {
    this.goto( this.options.reverse ? this.index - delta : this.index + delta );
  };

  Tau.prototype.goto = function( index ) {
    var $next, normalizedIndex, imageCount = this.$images.length;

    index = index % imageCount;

    // stay within the bounds of the array
    normalizedIndex = (imageCount + index) % imageCount;

    // set the next image that's going to be shown/focused
    $next = this.$images.eq( normalizedIndex );

    // skip this action if the desired image isn't loaded yet
    // TODO do something fancier here instead of just throwing up hands
    if( !$next[0].tauImageLoaded ) {
      this.showLoading();
      return false;
    }

    // hide any image that happens to be visible (initial image when canvas)
    if( this.$current ) {
      this.$current.removeClass( "focused" );
    } else {
      this.$images.removeClass( "focused" );
    }

    // record the current focused image and make it visible
    this.$current = $next;

    // record the updated index only after advancing is possible
    this.index = normalizedIndex;

    if( this.canvasCtx ) {
      return this.renderCanvas();
    } else {
      // show the new focused image
      this.$current.addClass( "focused" );
      return true;
    }
  };

  Tau.prototype.renderCanvas = function() {
    var $img = this.$current;
    var img = $img[0];

    var width = img.width;
    var height = img.height;

    var parentWidth = this.element.clientWidth;
    var calcHeight = (parentWidth/width) * height;

    if(!width || !height || !img.complete){
      return false;
    }

    if( this.canvas.width !== parentWidth ||
        this.canvas.height !== calcHeight || (parentWidth && calcHeight) ) {
      this.canvas.width = parentWidth;
      this.canvas.height = calcHeight;
    }

    this.canvasCtx.drawImage(img, 0, 0, parentWidth, calcHeight);

    return true;
  };

  // TODO transplant the attributes from the initial image
  Tau.prototype.createImages = function() {
    var src, frames, html, $new, boundImageLoaded;

    // if there are no image elements, raise an exception
    if( this.$initial.length < 1 ){
      throw new Error( "At least one image required" );
    }

    // if there is only one image element, assume it's a template
    if( this.$initial.length == 1 ) {
      this.markImageLoaded( this.$initial[0] );

      src =
        this.options.template ||
        this.$initial.attr( "data-src-template" );

      var imgs = [];
      for( var i = this.stepSize + 1; i <= this.frames; i+= this.stepSize ) {
        html = "<img src=" + src.replace("$FRAME", i) + "></img>";
        $new = $( html );
        imgs.push($new);
      }

      $.each(imgs, function(i, e){
        var $img = $(e);

        $img.bind("load error", function(e){ this.imageLoaded(i, e.target, e); }.bind(this));

        this.$element.append( $img );
        this.$render.append( $img.html() );
      }.bind(this));

      // take all the child images and use them as frames of the rotation
      this.$images = this.$element.children().filter( "img" );
      this.$current = this.$images;
      this.goto(0);
      this.loadedCount = 0;
    } else {
      // take all the child images and use them as frames of the rotation
      this.$images = this.$element.children().filter( "img" );

      this.$images.each(function(i, e){
        // if the image height is greater than zero we assume the image is loaded
        // otherwise we bind to onload and pray that we win the race
        if( $(e).height() > 0 ){
          this.imageLoaded( i, e );
        } else {
          $(e).bind("load error", function(event){
            this.imageLoaded( i, event.target, event );
          }.bind(this));
        }
      }.bind(this));
    }
  };


  Tau.prototype.imageLoaded = function( index, element, event ) {
    var initTriggered = false;
    this.markImageLoaded( element );

    // if the isn't going to play automatically and the first image is
    // loaded make sure to render it
    if( this.$element.find("img")[0] == element && 
        (!this.options.autoplay || !this.options.autoplay.enabled) ){
      if( !event || event.type !== "error") {
        this.goto(0);
        this.$element.trigger("tau.init");
        initTriggered = true;
      }
    }

    this.loadedCount++;

    if( this.loadedCount >= this.frames - 1) {
      this.hideLoading();

      if(!initTriggered) {
        this.$element.trigger("tau.init");
      }
    }
  };

  Tau.prototype.markImageLoaded = function( element ) {
    element.tauImageLoaded = true;
  };

  Tau.prototype.bind = function() {
    this.$element.bind( "mousedown touchstart", this.track.bind(this) );
  };

  Tau.prototype.autoRotate = function( right ) {
    // already rotating
    if( this.autoInterval ) {
      return;
    }

    this.$element.addClass("spinning");

    // move once initially
    this.change( right ? -1 : 1 );

    // move after the interval
    this.autoInterval = setInterval(function() {
      this.change( right ? -1 : 1 );
    }.bind(this),  this.autoRotateDelay() * this.stepSize);

    this.$element.trigger( "tau.auto-rotate-start" );
  };

  Tau.prototype.autoRotateDelay = function(){
    return (this.options.interval || Tau.autoRotateTraversalTime) / this.frames;
  };

  Tau.prototype.stopAutoRotate = function() {
    clearInterval( this.autoInterval );
    clearInterval( this.autostartTimeout );
    this.$element.removeClass("spinning");
    this.autoInterval = undefined;
    this.$element.trigger( "tau.auto-rotate-stop" );
  };

  Tau.prototype.track = function( event ) {
    var point;

    // ignore tracking on control clicks
    if( $(event.target).closest(".tau-controls").length ){
      return;
    }

    // prevent dragging behavior for mousedown
    if( event.type === "mousedown"  ){
      event.preventDefault();
    }

    if( event.type === "touchstart" ) {
      this.$element.trigger("tau.touch-tracking-start");
    } else {
      this.$element.trigger("tau.mouse-tracking-start");
    }

    if( this.tracking ) {
      return;
    }

    $doc.one( "mouseup", this.release.bind(this) );
    $doc.one( "touchend", this.release.bind(this) );

    this.tracking = true;

    // clean out the path since we'll need a new one for decel
    this.path.reset();

    // show the cursor as grabbing
    this.cursorGrab();

    // By default the number of pixels required to move the carousel by one
    // frame is the ratio of the tau element width to the number of frames. That
    // is, by default the user should be able to see the full rotation by moving
    // their input device from one side of the tau element to the other.
    var defaultThreshold = this.$element[0].clientWidth / this.frames ;

    // divide the default by the sensitivity. If the senstivity is greater than
    // 1 it will require less effort (smaller distance) to advance the rotation
    // by a single slide. If the sensitivity is less than 1 it will require more
    // effort
    this.rotateThreshold = defaultThreshold / (this.options.sensitivity || 1);

    // record the x for threshold calculations
    point = this.getPoint( event );
    this.downX = point.x;
    this.downY = point.y;
    this.downIndex = this.index;

    $doc.bind( "mousemove", this.mouseMoveBinding );
    $doc.bind( "touchmove", this.touchMoveBinding );
  };

  Tau.prototype.slow = function() {
    // if the path gets broken during the decel just stop
    if( !this.path.isSufficient() ) {
      this.clearSlowInterval();
      return;
    }

    this.rotate({
      x: this.path.last().x + this.velocity,
      y: this.path.last().y
    });

    if( this.velocity > 0 ){
      this.velocity = this.velocity - this.decelVal();

      if( this.velocity <= 0 ){
        this.clearSlowInterval();
      }
    } else {
      this.velocity = this.velocity + this.decelVal();

      if( this.velocity >= 0 ){
        this.clearSlowInterval();
      }
    }
  };

  Tau.prototype.decelVal = function(){
    return this.decelTimeStep() / 8;
  };

  Tau.prototype.clearSlowInterval = function() {
    clearInterval(this.slowInterval);
    this.velocity = 0;
    this.slowInterval = undefined;
  };

  Tau.prototype.decel = function() {
    var velocity, sign;

    // if we don't have two points of mouse or touch tracking this won't work
    if( !this.path.isSufficient() ) {
      return;
    }

    // determine the starting velocity based on the traced path
    velocity = this.path.velocity( this.decelTimeStep() );

    // borrowed from http://stackoverflow.com/questions/7624920/number-sign-in-javascript
    sign = velocity > 0 ? 1 : velocity < 0 ? -1 : 0;

    // keep a lid on how fast the rotation spins out
    if( Math.abs(velocity) > Tau.maxVelocity ){
      velocity = sign * Tau.maxVelocity;
    }

    this.velocity = velocity;
    this.slowInterval = setInterval(this.slow.bind(this), this.decelTimeStep());
  };

  Tau.prototype.decelTimeStep = function(){
    return this.autoRotateDelay() / 2;
  };

  Tau.prototype.release = function( event ) {
    if( $(event.target).closest(".tau-controls").length ){
      return;
    }

    if( !$(event.target).closest(".tau").length ){
      return;
    }

    if( event.type === "touchend" ) {
      this.$element.trigger("tau.touch-tracking-stop");
    } else {
      this.$element.trigger("tau.mouse-tracking-stop");
    }

    this.decel();

    this.cursorRelease();

    // TODO sort out why shoestring borks when unbinding with a string split list
    $doc.unbind( "mousemove", this.mouseMoveBinding );
    $doc.unbind( "touchmove", this.touchMoveBinding );

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
      x: event.pageX || event.clientX,
      y: event.pageY || event.clientY
    };
  };

  Tau.prototype.rotateEvent = function( event ) {
    // NOTE it might be better to prevent when the rotation returns anything BUT false
    //      so that slow drags still get the scroll prevented
    if( this.rotate(this.getPoint(event)) ){
      event.preventDefault();
    }
  };

  Tau.prototype.rotate = function( point ) {
    var deltaX, deltaY;

    deltaX = point.x - this.downX;
    deltaY = point.y - this.downY;

    // if the movement on the Y dominates X then skip and allow scroll
    if( Math.abs(deltaY) / Math.abs(deltaX) >= Tau.verticalScrollRatio ) {
      return false;
    }

    // since we're rotating record the point for decel
    this.path.record( point );

    // NOTE to reverse the spin direction add the delta/thresh to the downIndex
    if( Math.abs(deltaX) >= this.rotateThreshold ) {
      // NOTE works better on mousedown, here allows autorotate to continue
      this.stopAutoRotate();

      var index;

      if( this.options.reverse ) {
        index = this.downIndex + Math.round(deltaX / this.rotateThreshold);
      } else {
        index = this.downIndex - Math.round(deltaX / this.rotateThreshold);
      }

      this.goto( index );

      return true;
    }
  };
})(this, jQuery);
