# Tau

Tau is a small and simple 360 gallery library. The primary goal is to start with a very light weight core and extend it with optional features as part of the build process.

# Setup

After including library in your document you can create an instance of Tau with:

```javascript
var tau = new window.componentNamespace.Tau( domElement );
```

Where `domElement` is an element conforming to the following markup pattern:

```html
<div class="tau" data-tau>
  <img src="http://example.com/1.png"
    data-src-template="http://example.com/$FRAME.png"
    data-frames="72"
    data-start="36"></img>
</div>
```

The default `img` provides a fallback for browsers that fail to execute the instantiation. The `data-src-template` will be used to create `n = data-frames - 1` more images inside the parent element annotated with `data-tau`.

# Styles

Along with the markup and JS some basic styles help Tau look and act right.

```css
.tau {
  cursor: -webkit-grab;
  cursor: -moz-grab;
  cursor: grab;
}

.grabbing {
  cursor: move;
  cursor: -webkit-grabbing;
  cursor: -moz-grabbing;
  cursor: grabbing;
}

.tau img {
  width: 100%;
  display: none;
  pointer-events: none;

  -moz-user-select: -moz-none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
```

# Configuration

The following attributes are required on the initial `img` unless otherwise specified.

* `data-src-template` - the template for the additional `img` tags inserted by Tau
* `data-frames` - the number of images to be inserted
* `data-start` (*optional*) - the zero based start index for rotation
