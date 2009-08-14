// perldoc.js
//
// JavaScript functions for perldoc.perl.org


//-------------------------------------------------------------------------
// perldoc - site-level functions
//-------------------------------------------------------------------------

var perldoc = {

  // startup - page initialisation functions ------------------------------

  startup: function() {
    pageIndex.setup();
    recentPages.setup();
    new OverText('search_box');
    
    // If an internal link was called (x.html#y) the link position will be
    // behind the toolbar so the page needs to be scrolled 90px down
    anchor = location.hash.substr(1);
    if (anchor) {
      var allLinks = $(document.body).getElements('a');
      allLinks.each(function(link) {
        if (link.get('name') == anchor) {
          if ((ss.getCurrentYPos() - link.offsetTop) == 210) {
            window.scrollBy(0,-90);
          }
        }
      });
    }
  },
  
  
  // path - path back to the documentation root directory -----------------
  
  path: "",


  // setPath - sets the perldoc.path variable from page depth -------------
  
  setPath: function(depth) {
    perldoc.path = "";
    for (var c = 0; c < depth; c++) {
      perldoc.path = perldoc.path + "../";
    }
  },
  
  
  // loadFlags - loads the perldocFlags cookie ----------------------------
  
  loadFlags: function() {
    var perldocFlags = new Hash.Cookie('perldocFlags',{
      duration: 365,
      path:     "/"
    });
    return perldocFlags;    
  },
  
  // setFlag - stores a value in the perldocFlags cookie ------------------
  
  setFlag: function(name,value) {
    var perldocFlags = perldoc.loadFlags();
    if (!value) {
      value = true;
    }
    perldocFlags.set(name,value);
  },
  
  
  // getFlag - gets a value from the perldocFlags cookie ------------------
  
  getFlag: function(name) {
    var perldocFlags = perldoc.loadFlags();
    if (perldocFlags.has(name)) {
      return perldocFlags.get(name);
    } else {
      return false;
    }
  },
  
  
  // clearFlag - removes a value from the perldocFlags cookie -------------
  
  clearFlag: function(name) {
    var perldocFlags = perldoc.loadFlags();
    if (perldocFlags.has(name)) {
      perldocFlags.erase(name);
    }
  },
  
  
  // fromSearch - writes a message if the page was reached from search ----
  
  fromSearch: function() {
    if (perldoc.getFlag('fromSearch')) {
      var query     = perldoc.getFlag('searchQuery');
      var searchURL = perldoc.path + "search.html?r=no&q=" + query;
      document.write('<div id="searchBanner"><b>Search results</b> - this is the top result for your query <b>'+"'"+query+"'</b>. ");
      document.write('<br><a href="'+searchURL+'">View all results</a></div>');
      perldoc.clearFlag('fromSearch');
      perldoc.clearFlag('searchQuery');
    }
  }
  
}



//-------------------------------------------------------------------------
// pageIndex - functions to control the floating page index window
//-------------------------------------------------------------------------

var pageIndex = {
  
  // setup - called to initialise the page index --------------------------
  
  setup: function() {
    if ($('page_index')) {
      var pageIndexDrag = new Drag('page_index',{
        handle:     'page_index_title',
        onComplete: pageIndex.checkPosition
      });
      $('page_index_content').makeResizable({
        handle: 'page_index_resize',
        onComplete: pageIndex.checkSize
      });
    
      var pageIndexSettings = new Hash.Cookie('pageIndexSettings',{duration:365,path:"/"});
      if (pageIndexSettings.get('status') == 'Visible') {
        pageIndex.show();
      } else {
        pageIndex.hide();
      }
    }
  },
  
  
  // show - displays the page index ---------------------------------------
  
  show: function() {
    var pageIndexSettings = new Hash.Cookie('pageIndexSettings',{duration:365,path:"/"});

    if (pageIndexSettings.has('x') && pageIndexSettings.has('y')) {
      $('page_index').setStyle('left',pageIndexSettings.get('x'));
      $('page_index').setStyle('top',pageIndexSettings.get('y'));
    }
    if (pageIndexSettings.has('w') && pageIndexSettings.has('h')) {
      var paddingX = $('page_index_content').getStyle('padding-left').toInt() + $('page_index_content').getStyle('padding-right').toInt();
      var paddingY = $('page_index_content').getStyle('padding-top').toInt() + $('page_index_content').getStyle('padding-bottom').toInt();
      $('page_index_content').setStyle('width',pageIndexSettings.get('w') - paddingX);  
      $('page_index_content').setStyle('height',pageIndexSettings.get('h') - paddingY);  
    }
    pageIndex.windowResized();

    $('page_index').style.visibility = 'Visible';
    pageIndexSettings.set('status','Visible');
    
    $('page_index_toggle').innerHTML = 'Hide page index';
    $('page_index_toggle').removeEvent('click',pageIndex.show);    
    $('page_index_toggle').addEvent('click',pageIndex.hide);
    window.addEvent('resize',pageIndex.windowResized);
    return false;
  },
  
  
  // hide - hides the page index ------------------------------------------
  
  hide: function() {
    $('page_index').style.visibility = 'Hidden';
    $('page_index_toggle').innerHTML = 'Show page index';
    $('page_index_toggle').removeEvent('click',pageIndex.hide);    
    $('page_index_toggle').addEvent('click',pageIndex.show);    
    window.removeEvent('resize',pageIndex.windowResized);

    var pageIndexSettings = new Hash.Cookie('pageIndexSettings',{duration:365,path:"/"});
    pageIndexSettings.set('status','Hidden');
    return false;
  },
  
  
  // checkPosition - checks the index window is within the screen ---------
  
  checkPosition: function() {
    var pageIndexSize     = $('page_index').getSize();
    var pageIndexPosition = {x:$('page_index').getStyle('left').toInt(), y:$('page_index').getStyle('top').toInt()};
    var windowSize        = window.getSize();
    
    var newX = pageIndexPosition.x;
    var newY = pageIndexPosition.y;
    
    if (pageIndexPosition.x < 0) {newX = 0}
    if (windowSize.x < (pageIndexPosition.x + pageIndexSize.x)) {newX = Math.max(0,windowSize.x - pageIndexSize.x)}
    if (pageIndexPosition.y < 0) {newY = 0}
    if (windowSize.y < (pageIndexPosition.y + pageIndexSize.y)) {newY = Math.max(0,windowSize.y - pageIndexSize.y)}
    
    $('page_index').setStyle('left',newX);
    $('page_index').setStyle('top',newY);
    pageIndex.saveDimensions();
  },
  
  
  // checkSize - checks the index window is smaller than the screen -------
  
  checkSize: function() {
    var pageIndexSize        = $('page_index').getSize();
    var pageIndexPosition    = {x:$('page_index').getStyle('left').toInt(), y:$('page_index').getStyle('top').toInt()};
    var pageIndexHeaderSize  = $('page_index_header').getSize();
    var pageIndexContentSize = $('page_index_content').getSize();
    var pageIndexFooterSize  = $('page_index_footer').getSize();
    var windowSize           = window.getSize();

    var newX     = pageIndexContentSize.x;
    var newY     = pageIndexContentSize.y;
    var paddingX = $('page_index_content').getStyle('padding-left').toInt() + $('page_index_content').getStyle('padding-right').toInt();
    var paddingY = $('page_index_content').getStyle('padding-top').toInt() + $('page_index_content').getStyle('padding-bottom').toInt();
    
    if (windowSize.x < (pageIndexPosition.x + pageIndexSize.x)) {newX = windowSize.x - pageIndexPosition.x}
    if (windowSize.y < (pageIndexPosition.y + pageIndexSize.y)) {newY = windowSize.y - pageIndexPosition.y - pageIndexFooterSize.y - pageIndexHeaderSize.y}
    
    $('page_index_content').setStyle('width',newX - paddingX);  
    $('page_index_content').setStyle('height',newY - paddingY);  
    pageIndex.saveDimensions();
  },
  
  
  // windowResized - check the index still fits if the window is resized --
  
  windowResized: function() {
    pageIndex.checkPosition();

    var windowSize    = window.getSize();
    var pageIndexSize = $('page_index').getSize();
    if ((windowSize.x < pageIndexSize.x) || (windowSize.y < pageIndexSize.y)) {
      pageIndex.checkSize();
    }
  },
  
  
  // saveDimensions - stores the window size/position in a cookie ---------
  
  saveDimensions: function() {
    var pageIndexSettings    = new Hash.Cookie('pageIndexSettings',{duration:365,path:"/"});
    var pageIndexPosition    = {x:$('page_index').getStyle('left').toInt(), y:$('page_index').getStyle('top').toInt()};
    var pageIndexContentSize = $('page_index_content').getSize();

    pageIndexSettings.set('x',pageIndexPosition.x);    
    pageIndexSettings.set('y',pageIndexPosition.y);
    pageIndexSettings.set('w',pageIndexContentSize.x);
    pageIndexSettings.set('h',pageIndexContentSize.y);
  }
  
};



//-------------------------------------------------------------------------
// recentPages - store and display the last viewed pages
//-------------------------------------------------------------------------

var recentPages = {
  
  // count - number of pages to store -------------------------------------
  
  count: 10,
  
  
  // setup - startup functions--------------------------------------------- 
  
  setup: function() {
    recentPages.show();
    if (perldoc.contentPage) {
      recentPages.add(perldoc.pageName,perldoc.pageAddress);
    }
  },
  
  
  // add - adds a page to the recent list ---------------------------------
  
  add: function(name,url) {
    var recentList = recentPages.load();
    
    // Remove page if it is already in the list
    recentList = recentList.filter(function(item) {
      return (item.url != url);
    });
    
    // Add page as the first item in the list
    recentList.unshift({
      'name': name,
      'url':  url
    });
    
    // Truncate list to maximum length
    recentList.splice(recentPages.count);
    
    // Save list
    recentPages.save(recentList);
  },
  
  
  // show - displays the recent pages list --------------------------------
  
  show: function() {
    var recentList = recentPages.load();
    var recentHTML = "";
    
    if (recentList.length > 0) {
      recentHTML += '<ul>';
      recentList.each(function(item){
        recentHTML += '<li><a href="' + perldoc.path + item.url + '">' + item.name + '</a>';
      });
      recentHTML += '</ul>';
    }
    
    $('recent_pages').set('html',recentHTML);
  },
  
  
  // load - loads the recent pages list -----------------------------------
  
  load: function() {
    return (perldoc.getFlag('recentPages') || new Array());
  },
  
  
  // save - saves the recent pages list -----------------------------------
  
  save: function(list) {
    perldoc.setFlag('recentPages',list);
  }
  
};


//-------------------------------------------------------------------------

      window.onscroll = function() {
  var scrOfY = 0;
  if( typeof( window.pageYOffset ) == 'number' ) {
    //Netscape compliant
    scrOfY = window.pageYOffset;
  } else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
    //DOM compliant
    scrOfY = document.body.scrollTop;
  } else if( document.documentElement && ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
    //IE6 standards compliant mode
    scrOfY = document.documentElement.scrollTop;
  }
        if (scrOfY >120) {
          $('content_header').style.position = "fixed";
          $('content_body').style.marginTop  = "90px";
        } else {
          $('content_header').style.position = "static";
          $('content_body').style.marginTop  = "0px";
        }
      };
      
      function goToTop () {
	window.scrollTo(0,0);
        $('content_header').style.position = "static";
        $('content_body').style.marginTop  = "0px";
      }
      
/* Smooth scrolling
   Changes links that link to other parts of this page to scroll
   smoothly to those links rather than jump to them directly, which
   can be a little disorienting.
   
   sil, http://www.kryogenix.org/
   
   v1.0 2003-11-11
   v1.1 2005-06-16 wrap it up in an object
*/

var ss = {
  fixAllLinks: function() {
    // Get a list of all links in the page
    var allLinks = document.getElementsByTagName('a');
    // Walk through the list
    for (var i=0;i<allLinks.length;i++) {
      var lnk = allLinks[i];
      if ((lnk.href && lnk.href.indexOf('#') != -1) && 
          ( (lnk.pathname == location.pathname) ||
	    ('/'+lnk.pathname == location.pathname) ) && 
          (lnk.search == location.search)) {
        // If the link is internal to the page (begins in #)
        // then attach the smoothScroll function as an onclick
        // event handler
        ss.addEvent(lnk,'click',ss.smoothScroll);
      }
    }
  },

  smoothScroll: function(e) {
    // This is an event handler; get the clicked on element,
    // in a cross-browser fashion
    if (window.event) {
      target = window.event.srcElement;
    } else if (e) {
      target = e.target;
    } else return;

    // Make sure that the target is an element, not a text node
    // within an element
    if (target.nodeName.toLowerCase() != 'a') {
      target = target.parentNode;
    }
  
    // Paranoia; check this is an A tag
    if (target.nodeName.toLowerCase() != 'a') return;
  
    // Find the <a name> tag corresponding to this href
    // First strip off the hash (first character)
    anchor = target.hash.substr(1);
    // Now loop all A tags until we find one with that name
    var allLinks = document.getElementsByTagName('a');
    var destinationLink = null;
    for (var i=0;i<allLinks.length;i++) {
      var lnk = allLinks[i];
      if (lnk.name && (lnk.name == anchor)) {
        destinationLink = lnk;
        break;
      }
    }
    if (!destinationLink) destinationLink = document.getElementById(anchor);

    // If we didn't find a destination, give up and let the browser do
    // its thing
    if (!destinationLink) return true;
  
    // Find the destination's position
    var desty = destinationLink.offsetTop;
    var thisNode = destinationLink;
    while (thisNode.offsetParent && 
          (thisNode.offsetParent != document.body)) {
      thisNode = thisNode.offsetParent;
      desty += thisNode.offsetTop;
    }

    // Follow the link    
    location.hash = anchor;
    
    // Scroll if necessary to avoid the top nav bar
    if ((window.pageYOffset > 120) && ((desty + window.innerHeight - 120) < ss.getDocHeight())) {
      window.scrollBy(0,-90);
    }
  
    // And stop the actual click happening
    if (window.event) {
      window.event.cancelBubble = true;
      window.event.returnValue = false;
    }
    if (e && e.preventDefault && e.stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
  },
  
  getDocHeight: function() {
    var D = document;
    return Math.max(
        Math.max(D.body.scrollHeight, D.documentElement.scrollHeight),
        Math.max(D.body.offsetHeight, D.documentElement.offsetHeight),
        Math.max(D.body.clientHeight, D.documentElement.clientHeight)
    );
  },

  scrollWindow: function(scramount,dest,anchor) {
    wascypos = ss.getCurrentYPos();
    isAbove = (wascypos < dest);
    window.scrollTo(0,wascypos + scramount);
    iscypos = ss.getCurrentYPos();
    isAboveNow = (iscypos < dest);
    if ((isAbove != isAboveNow) || (wascypos == iscypos)) {
      // if we've just scrolled past the destination, or
      // we haven't moved from the last scroll (i.e., we're at the
      // bottom of the page) then scroll exactly to the link
      window.scrollTo(0,dest);
      // cancel the repeating timer
      clearInterval(ss.INTERVAL);
      // and jump to the link directly so the URL's right
      //location.hash = anchor;
    }
  },

  getCurrentYPos: function() {
    if (document.body && document.body.scrollTop)
      return document.body.scrollTop;
    if (document.documentElement && document.documentElement.scrollTop)
      return document.documentElement.scrollTop;
    if (window.pageYOffset)
      return window.pageYOffset;
    return 0;
  },

  addEvent: function(elm, evType, fn, useCapture) {
    // addEvent and removeEvent
    // cross-browser event handling for IE5+,  NS6 and Mozilla
    // By Scott Andrew
    if (elm.addEventListener){
      elm.addEventListener(evType, fn, useCapture);
      return true;
    } else if (elm.attachEvent){
      var r = elm.attachEvent("on"+evType, fn);
      return r;
    } else {
      alert("Handler could not be removed");
    }
  } 
}

ss.STEPS = 25;

ss.addEvent(window,"load",ss.fixAllLinks);

