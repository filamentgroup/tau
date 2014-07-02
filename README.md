# Tau

[![Filament Group](http://filamentgroup.com/images/fg-logo-positive-sm-crop.png) ](http://www.filamentgroup.com/)

Tau is a small and simple 360 gallery library. The primary goal is to start with a very light weight core and extend it with optional features as part of the build process. The core supports touch, mouse events, and automatic rotation. You can see a demo [here](https://filamentgroup.github.io/tau/demo).

![Build status](https://api.travis-ci.org/filamentgroup/tau.svg)

# Setup

After including library in your document you can create an instance of Tau with:

```javascript
var tau = new window.componentNamespace.Tau( domElement );
```

Where `domElement` is an element conforming to the following markup pattern:

```html
<div class="tau" data-tau>
  <div class="loading">loading...</div>
  <img src="http://example.com/1.png"
    data-src-template="http://example.com/$FRAME.png"
    data-frames="72"></img>
</div>
```

The default `img` provides a fallback for browsers that fail to execute the instantiation. The `data-src-template` will be used to create the rest of the images images inside the parent element annotated with `data-tau`. Finally, an element tagged with the `loading` class will be displayed when the rotation hits an image that hasn't yet fired its loading event. It can be customized with additional markup and CSS as needs be.

# Configuration

The following attributes are required on the initial `img` unless otherwise specified.

* `data-src-template` - the template for the additional `img` tags inserted by Tau
* `data-frames` - the number of images to be inserted

# Styles

Along with the markup and JS some basic styles help Tau look and act right.

```css
.tau {
  cursor: -webkit-grab;
  cursor: -moz-grab;
  cursor: grab;
}

/* loading should be hidden to start */
.tau .loading {
  display: none;
}

/* assist in preventing a drag */
.tau img {
  pointer-events: none;

  -moz-user-select: -moz-none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* hide all images except for the focused image once the plugin inits */
.tau.tau-enhanced img {
  display: none;
}

/* display focused image */
.tau img.focused {
  display: block
}

/* grabbing cursor for all elements on mousedown */
html.grabbing * {
  cursor: move;
  cursor: -webkit-grabbing;
  cursor: -moz-grabbing;
  cursor: grabbing;
}
```

The demo page also includes some styles for clarity that are not required by the library:

```css

.tau {
  border: 3px solid #ccc;
  margin-bottom: 2em;
  position: relative;
}

.tau img {
  width: 100%;
}

.tau .loading {
  position: absolute;
  z-index: 2;
  left: 0;
  top: 0;
}
```
