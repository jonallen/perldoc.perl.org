// label.js
//
// JavaScript code to add labels to HTML pages

//-------------------------------------------------------------------

// Copyright (c) 2005 Jon Allen <jj@jonallen.info>
//
// label.js is part of the http://perldoc.perl.org website, see
// http://perl.jonallen.info/projects/perldoc for project information
//
// This library is free software; you may modify it and/or 
// distribute it under the same terms as Perl itself

//-------------------------------------------------------------------

var labelCount = 0;
var labelList  = new Object;
var pageDepth  = 0;
var path       = "";

// Set default values for toolbar states
var leftToolbarState  = true;
var rightToolbarState = true;

//-------------------------------------------------------------------

function setPath() {
  for (var c = 0; c < pageDepth; c++) {
    path = path + "../";
  }
}

//-------------------------------------------------------------------

function saveLabels() {
  var serialised = "";
  for (var labelID in labelList) {
    if (serialised != "") serialised += '&';
    serialised += labelList[labelID].text + "," + labelList[labelID].link;
  }
  var nextYear = new Date;
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  serialised = escape(serialised);
  document.cookie = "labels="+serialised+"; path=/ ; expires="+nextYear.toGMTString();
}

//-------------------------------------------------------------------

function loadLabels() {
  var cookie = document.cookie;
  //alert(cookie);
  var pos = cookie.indexOf("labels=");
  if (pos != -1) {
    var start = pos + 7;
    var end   = cookie.indexOf(";",start);
    if (end == -1) end = cookie.length;
    var value = cookie.substring(start,end);
    value = unescape(value);
    
    var labels = new Array;
    labels = value.split('&');
    for (var id = 0; id < labels.length; id++) {
      var data = new Array;
      data = labels[id].split(',');
      if (data[0] && data[1]) {
        addLabel(data[0],data[1]);
      }
    }
  }
}

//-------------------------------------------------------------------

function removeLabel(labelID) {
  var label = document.getElementById(labelID);
  label.parentNode.removeChild(label);
  delete labelList[labelID];
  saveLabels();
}

//-------------------------------------------------------------------

function addLabel(text,link) {
  labelCount++;
  var labelID = "label" + labelCount;
  
  //var path = "";
  //for (var c = 0; c < pageDepth; c++) {
  //  path = path + "../";
  //}

  var labelDetails     = new Object;
  labelDetails["text"] = text;
  labelDetails["link"] = link;
  labelList[labelID]   = labelDetails;
  
  //alert(path+link);
  
  var labelDIV = document.createElement("DIV");
  labelDIV.className = "label";
  labelDIV.setAttribute("id",labelID);

  var labelLink = document.createElement("A");
  labelLink.setAttribute("href",path+link);
  var labelLinkText = document.createTextNode(text);
  labelLink.appendChild(labelLinkText);

  var removeDIV  = document.createElement("DIV");
  removeDIV.className = "labelactions";

  if (navigator.userAgent.indexOf("MSIE") >= 0) {
    var clickHandler = "removeLabel('"+labelID+"')";
    var removeLink = document.createElement('<a onClick="'+clickHandler+'">');
    removeLink.setAttribute("href","#");
    var removeLinkText = document.createTextNode("Remove");
    removeLink.appendChild(removeLinkText);    
    removeDIV.appendChild(removeLink);
  } else {
    var removeLink = document.createElement("A");
    removeLink.setAttribute("onClick","removeLabel('"+labelID+"')");
    removeLink.setAttribute("href","#");
    var removeLinkText = document.createTextNode("Remove");
    removeLink.appendChild(removeLinkText);    
    removeDIV.appendChild(removeLink);
  }
  
  labelDIV.appendChild(labelLink);
  labelDIV.appendChild(removeDIV);

  document.getElementById("labels").appendChild(labelDIV);
  saveLabels();
}

//-------------------------------------------------------------------

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
  document.getElementById("leftCloseIcon").src=path+'close_blue.gif';
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
  document.getElementById("rightCloseIcon").src=path+'close_blue.gif';
  document.getElementById("right").style.display = "block";
  document.getElementById("contentHeaderRight").style.display = "none";
  document.getElementById("centerContent").style.marginRight  = "140px";
  document.getElementById("centerContent").style.paddingRight = "10px";
  saveToolbarState();
}

function showToolbars() {
  //setPath();
  preloadImage     = new Image();
  preloadImage.src = path+"close_purple.gif";
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

//-------------------------------------------------------------------

function setFlag(param,value) {
  var flags = loadFlags();
  flags[param] = value;
  saveFlags(flags);
}

function getFlag(param) {
  var flags = loadFlags();
  return flags[param];
}

function clearFlag(param) {
  var flags = loadFlags();
  delete flags[param];
  saveFlags(flags);
}

function clearAllFlags() {
  var flags = new Object;
  saveFlags(flags);
}

function loadFlags() {
  var flags  = new Object;
  var cookie = document.cookie;
  var pos    = cookie.indexOf("flags=");
  if (pos != -1) {
    var start = pos + 6;
    var end   = cookie.indexOf(";",start);
    if (end == -1) end = cookie.length;
    var value = cookie.substring(start,end);
    
    var flagEntries = value.split(',');
    for (var id = 0; id < flagEntries.length; id++) {
      var data = new Array;
      flagData = flagEntries[id].split(':');
      if (flagData[0] && flagData[1]) {
        flags[unescape(flagData[0])] = unescape(flagData[1]);
      }
    }
  }
  return flags; 
}

function saveFlags(flags) {
  var serialised = "";
  for (param in flags) {
    if(serialised) serialised = serialised + ",";
    serialised = serialised + escape(param) + ":" + escape(flags[param]);
  }
  // Set cookie expiration date of 1 year
  var nextYear = new Date;
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  // Store cookie in browser
  document.cookie = "flags="+serialised+"; path=/ ; expires="+nextYear.toGMTString();
}

//-------------------------------------------------------------------

function fromSearch() {
  // Checks if page entry was from the search engine
  if (getFlag('fromSearch')) {
    //alert("path = "+path+", pageDepth = "+pageDepth);
    var query     = getFlag('searchQuery');
    var searchURL = path + "search.html?r=no&q=" + query;
    document.write('<div id="searchBanner"><b>Search results</b> - this is the top result for your query <b>'+"'"+query+"'</b>. ");
    document.write('<a href="'+searchURL+'">View all results</a></div>');
    clearFlag('fromSearch');
    clearFlag('searchQuery');
  }
}
