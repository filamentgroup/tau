$(function() {
  $( "[data-tau]" ).each(function( i ) {
    new window.componentNamespace.Tau( this );
  });
});
