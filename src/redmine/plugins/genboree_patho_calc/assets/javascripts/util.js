// ---------------------------------------------------------------------------
// COMMON UTILITY FUNCTIONS FOR ANY PAGE
// - some pages may rely on this being present
// ---------------------------------------------------------------------------

function fullEscape(value)
{
  value = encodeURIComponent(value)
  value = value.replace(/!/g, '%21');
  value = value.replace(/'/g, '%27');
  value = value.replace(/\(/g, '%28');
  value = value.replace(/\)/g, '%29');
  value = value.replace(/\*/g, '%2A');
  return value;
}

function addEvent(elm, evType, fn, useCapture)
// addEvent and removeEvent
// cross-browser event handling for IE5+,  NS6 and Mozilla
// By Scott Andrew
{
  if(elm.addEventListener)
  {
    elm.addEventListener(evType, fn, useCapture);
    return true;
  }
  else if(elm.attachEvent)
  {
    var r = elm.attachEvent("on"+evType, fn);
    return r;
  }
  else
  {
    return alert("Handler could not be removed");
  }
}

// Get cookie value by cookie name
function getCookie( cookieName )
{
  var results = document.cookie.match ( cookieName + '=(.*?)(;|$)' );
  if( results )
  {
    return ( unescape( results[1] ) );
  }
  else
  {
    return null;
  }
}

// Set cookie by name and value, and optional other params
function setCookie( name, value, expires, path, domain, secure )
{
  // Get time, iin milliseconds
  var today = new Date();
  today.setTime( today.getTime() );

  /* set expires if any */
  if ( expires )
  {
    expires = expires * 1000 * 60 * 60 * 24;
  }
  var expires_date = new Date( today.getTime() + (expires) );

  // if domain starts with www, strip and put a . so it's general to the domain, not just www.domain
  // else put a leading . so it's general to the domain
  if(domain == undefined)
  {
    domain = window.location.host ;
  }

  if((/^www\./i).test(domain))
  {
    domain = domain.replace((/^www\./i), "") ;
  }
  else if(!(/^localhost$/.test(domain)) && !(/^[0-9\.]+$/.test(domain)) && !(/^[^\.]+$/.test(domain)))
  {
    domain = "." + domain ;
  }
  else
  {
    domain = "" ;
  }
  var cookieStr = name + "=" + escape( value ) +
                  ((expires) ? (";expires=" + expires_date.toGMTString()) : "" ) +
                  ((path) ? (";path=" + path) : "" ) +
                  ((domain) ? (";domain=" + domain) : "" ) +
                  ((secure) ? (";secure") : "" ) ;
  document.cookie = cookieStr ;
  return ;
}

// For SLEEPing:
function dummyFunctionForSleep()
{
  return ;
}

function sleep(timeInMilliseconds)
{
  setTimeout('dummyFunctionForSleep()', timeInMilliseconds) ;
}

//  For finding elements you want
// Returns the checked radio button as an element object,
// if any any such radio button element exists. If no radio buttons labelled
// with the given id, or no radio buttons at all, or no checked radio button,
// it will return null.
function getCheckedRadioButton(formName, radioButtonId)
{
  var retVal = null ;
  var formObj = document.getElementById(formName) ;
  var radioGroup = formObj.elements[radioButtonId] ;
  if(radioGroup.length)
  {
    for(var ii=0; ii < radioGroup.length; ii++)
    {
      if(radioGroup[ii].checked)
      {
        retVal = radioGroup[ii] ;
        break ;
      }
    }
  }
  else
  {
    retVal = radioGroup ;
  }
  return retVal ;
}

// Returns the first input element whose id and value matches the arguments,
// regardless of its type. This is useful when trying to find a particular
// element amongst a bunch of elements who all have the same id. Eg, finding
// a particular radio button in some cases.
// If no such element exists, it will return null.
function getElementByIdAndValue(formName, elemId, elemValue)
{
  var retVal = null ;
  var formObj = document.getElementById(formName) ;
  var elems = formObj.elements[elemId] ;
  if(elems && elems.length)
  {
    for(var ii=0; ii < elems.length; ii++)
    {
      if(elems[ii].value == elemValue)
      {
        retVal = elems[ii] ;
        break ;
      }
    }
  }
  else // Maybe not multiple elements with this id, let's try to get the one-and-only.
  {
    retVal = elems
  }
  return retVal ;
}

// Returns an array of all elements under rootElem whose tag and type attribute
// match the given parameters. Otherwise, returns an empty array.
function getElementsByTagAndType(rootElem, tag, type)
{
  var elems = new Array() ;
  var tagElems = rootElem.getElementsByTagName(tag) ;
  for(var ii=0; ii < tagElems.length; ii++)
  {
    if(tagElems[ii].type == type)
    {
      elems.push(tagElems[ii]) ;
    }
  }
  return elems ;
}

// Toggle the display style for an element, given its id
function hideToggle( id )
{
  var tmp = $(id);
  if(tmp.style.display=="none")
  {
     tmp.style.display="";
  }
  else
  {
     tmp.style.display="none";
  }
  return ;
}

var trgWinHdl = null ;
function newWin(trgWinUrl, trgWinName) // This will do the actual popping up when the link is clicked
{
  if(!trgWinName)
  {
    trgWinName = '_newWin' ;
  }
  if(!trgWinHdl || trgWinHdl.closed)
  {
    trgWinHdl = window.open(trgWinUrl, trgWinName, '');
  }
  else
  {
    // winHandle not null AND not closed
    trgWinHdl.location = trgWinUrl;
  }

  if(trgWinHdl && window.focus)
  {
    trgWinHdl.focus() ;
  }
  return false ;
}


// Does string look like an integer?
function validatePositiveInteger( strValue )
{
  var objRegExp  = /^\d+$/;
  return objRegExp.test(strValue);
}

// Does string look like a number (int or float)
function validatePositiveNumber( strValue )
{
    if( ! /^\+?\d*(?:\.\d+)?(?:(?:e|E)(?:\+|\-)?\d+)?$/.test(strValue) )
    {
	    return false;
    }
    return true;
    // var objRegExp  =  /^(\d+\.\d*)|(\d+)|(\.\d+)$/;
    //return objRegExp.test(strValue);
}

// Does string look like a integer range?
function validateRange( strValue )
{
  var objRegExp  =  /^\d+\-\d+$/;
  return objRegExp.test(strValue);
}

//----------------------------------------------------
// RELATIVE CLICK COORDINATE LOCATION
// - this section implements the "getRelCoords()" method
// - there are support methods to do all this
//----------------------------------------------------
// FUNCTION: getRelCoords(elem, event)
//    elem  - the HTML image DOM object the coords will be relative TO
//    event - the JavaScript Event object
// PURPOSE:
//    Get the coords of the click, relative to elem.
//    Returns array of length 2: [ X, Y ]
// USAGE: (should work for *most* HTML objects)
//   <img src="images/w3default80.jpg" width="234" height="91" onclick="showRelCoords(this, event);">
function getRelCoords(elem, event)
{
  // IE requires a 2px coordinate correction.
  // It appears to be a fixed correction, regardless of nesting of the element.
  // Since browser detection by name is not robust, we try this:
  var doCoordCorrect = (event.which == null) ;
  // First, find the *relative* position of the DOM element on the page:
  var objX = findPosX(elem) ;
  var objY = findPosY(elem) ;
  // Next, find the location of the mouse click (relative to the same top-level as the object, is the idea):
  var evtX = event.clientX - (doCoordCorrect ? 2 : 0);
  var evtY = event.clientY - (doCoordCorrect ? 2 : 0);
  // Next, for control elements that can have scrollbars, we need the scrollOffsets
  var scrlX = findScrollOffsetX() ;
  var scrlY = findScrollOffsetY() ;
  // Finally, calculate the location of the click relative to the element itself:
  var relX = (evtX - objX) + scrlX ;
  var relY = (evtY - objY) + scrlY ;
  return [ relX, relY ] ;
}

// FUNCTION: showRelCoords(elem, event)
//    elem  - the HTML image DOM object
//    event - the JavaScript Event objet
// PURPOSE:
//    Display the coords of the click, relative to elem.
//    For debugging
// USAGE: (should work for *most* HTML objects)
//   <img src="images/w3default80.jpg" width="234" height="91" onclick="showRelCoords(this, event);">
function showRelCoords(elem, event)
{
  var relCoords = getRelCoords(elem, event) ;
  alert("X coord: " + relCoords[0] + "\nY coord: " + relCoords[1]) ;
}

// -----------
// Helper methods below for coord finding
// -----------
// FUNCTION: findScrollOffsetX()
//    elem  - the HTML image DOM object
// PURPOSE:
//    Find how much we scrolled to the right.
//    Try each browser's approach. Fail to next approach.
function findScrollOffsetX()
{
  var scrollX = 0 ;
  if(window.pageXOffset)
  {
    scrollX = window.pageXOffset ;
  }
  else if(document.documentElement && document.documentElement.scrollLeft)
  {
    scrollX = document.documentElement.scrollLeft;
  }
  else if(document.body.scrollLeft)
  {
    scrollX = document.body.scrollLeft ;
  }
  return scrollX ;
}

// FUNCTION: findScrollOffsetY()
//    elem  - the HTML image DOM object
// PURPOSE:
//    Find how much we scrolled down.
//    Try each browser's approach. Fail to next approach.
function findScrollOffsetY()
{
  var scrollY = 0 ;
  if(window.pageYOffset)
  {
    scrollY = window.pageYOffset ;
  }
  else if(document.documentElement && document.documentElement.scrollTop)
  {
    scrollY = document.documentElement.scrollTop;
  }
  else if(document.body.scrollTop)
  {
    scrollY = document.body.scrollTop;
  }
  return scrollY ;
}

// FUNCTION: findPosX(elem)
//    elem  - the HTML image DOM object
// PURPOSE:
//    Find the *relative* X coordinate of elem on the page.
//    NOTE: relative to *what* is browser-specific, but luckily we don't care.
//    Try each browser's approach. Fail to next approach.
function findPosX(obj)
{
  var curleft = 0 ;
  if(obj.offsetParent)
  {
    // Bubble up to the top-most parent, adjusting the offset at each iteration.
    while(obj.offsetParent)
    {
      curleft += (obj.offsetLeft ) ;
      obj = obj.offsetParent ;
    }
  }
  return curleft;
}

// FUNCTION: findPosX(elem)
//    elem  - the HTML image DOM object
// PURPOSE:
//    Find the *relative* X coordinate of elem on the page.
//    NOTE: relative to *what* is browser-specific, but luckily we don't care.
//    Try each browser's approach. Fail to next approach.
function findPosY(obj, doBubbleCorrect)
{
  var curtop = 0 ;
  if(obj.offsetParent)
  {
    // Bubble up to the top-most parent, adjusting the offset at each iteration.
    while(obj.offsetParent)
    {
      curtop += (obj.offsetTop ) ;
      obj = obj.offsetParent ;
    }
  }
  return curtop;
}

// END: relative coordinate finding
