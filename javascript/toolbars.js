// Preload the highlighted close icon
var path = "";
for (var c = 0; c < pageDepth; c++) {
  path = path + "../";
}
preloadImage     = new Image();
preloadImage.src = path+"close_purple.gif";

// Set default values for toolbar states
var leftToolbarState  = true;
var rightToolbarState = true;

function closeLeft() {
  leftToolbarState = false;
  document.getElementById("left").style.display = "none";
  document.getElementById("contentHeaderLeft").style.display = "block";
  document.getElementById("centerContent").style.marginLeft  = "0px";
  document.getElementById("centerContent").style.paddingLeft = "5px";
  saveToolbarState();
}

function showLeft() {
  leftToolbarState = true;
  document.getElementById("leftCloseIcon").src='close_blue.gif';
  document.getElementById("left").style.display = "block";
  document.getElementById("contentHeaderLeft").style.display = "none";
  document.getElementById("centerContent").style.marginLeft  = "140px";
  document.getElementById("centerContent").style.paddingLeft = "10px";
  saveToolbarState();
}

function closeRight() {
  rightToolbarState = false;
  document.getElementById("right").style.display = "none";
  document.getElementById("contentHeaderRight").style.display = "block";
  document.getElementById("centerContent").style.marginRight  = "0px";
  document.getElementById("centerContent").style.paddingRight = "5px";
  saveToolbarState();
}

function showRight() {
  rightToolbarState = true;
  document.getElementById("rightCloseIcon").src='close_blue.gif';
  document.getElementById("right").style.display = "block";
  document.getElementById("contentHeaderRight").style.display = "none";
  document.getElementById("centerContent").style.marginRight  = "140px";
  document.getElementById("centerContent").style.paddingRight = "10px";
  saveToolbarState();
}

function showToolbars() {
  loadToolbarState();
  (leftToolbarState == true)  ? showLeft()  : closeLeft();
  (rightToolbarState == true) ? showRight() : closeRight();
}

function saveToolbarState() {
  // Serialise state variables
  var serialised = "left:"   + ((leftToolbarState  == true) ? "true" : "false") 
                 + ",right:" + ((rightToolbarState == true) ? "true" : "false");
  serialised = escape(serialised);  
  //alert(serialised);

  // Set cookie expiration date of 1 year
  var nextYear = new Date;
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  // Store cookie in browser
  document.cookie = "toolbars="+serialised+"; path=/ ; expires="+nextYear.toGMTString();
}

function loadToolbarState() {
  var cookie = document.cookie;
  var pos = cookie.indexOf("toolbars=");
  if (pos != -1) {
    //alert("found toolbar cookie");
    var start = pos + 9;
    var end   = cookie.indexOf(";",start);
    if (end == -1) end = cookie.length;
    var value = cookie.substring(start,end);
    value = unescape(value);
    //alert(value);

    var labels = new Array;
    labels = value.split(',');
    for (var id = 0; id < labels.length; id++) {
      var data = new Array;
      data = labels[id].split(':');
      if (data[0] == "left")  leftToolbarState  = (data[1] == "true") ? true : false;
      if (data[0] == "right") rightToolbarState = (data[1] == "true") ? true : false;
    }
  } 
}
