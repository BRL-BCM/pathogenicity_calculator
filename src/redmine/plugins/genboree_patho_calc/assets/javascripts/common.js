function addAlertBox(msg, target){
  var markup = "<div class=\"alert alert-danger\">" ;
  markup += msg ;
  markup += "</div>" ;
  $(target).append(markup) ;
}