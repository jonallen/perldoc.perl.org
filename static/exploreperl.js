// exploreperl.js
//
// Generates the "Explore Perl" menu bar
//
// Usage: explorePerl.render('parent_id');
// Renders the menu bar as a child of the specified parent element ID

 
var explorePerl = {
  
  // definition
  //
  // Holds the definition of the menu bar as an ordered list
  // of objects, each containing an ordered list of items
 
  definition: [
    {
      heading: "News",
      items: [
        { name: "Perl Blogs", url: "http://blogs.perl.org" },
        { name: "Perl Ironman", url: "http://ironman.enlightenedperl.org" },
        { name: "Perl Buzz", url: "http://www.perlbuzz.com" },
        { name: "TPF News", url: "http://news.perlfoundation.org" }
      ]
    },
    {
      heading: "Language",
      items: [
        { name: "Perl.org", url: "http://www.perl.org" },
        { name: "Learn Perl", url: "http://learn.perl.org" },
        { name: "Documentation", url: "http://perldoc.perl.org" },
        { name: "CPAN", url: "http://search.cpan.org" }
      ]
    },
    {
      heading: "Community",
      items: [
        { name: "Perl Mongers", url: "http://www.pm.org" },
        { name: "Perl Jobs", url: "http://jobs.perl.org" },
        { name: "Perl Foundation", url: "http://www.perlfoundation.org" },
        { name: "Conferences", url: "http://www.yapc.org" }
      ]
    }
  ],
 
  
  // render
  //
  // Builds the full menu bar, including container.
  // If parent_id is not specified, defaults to 'page'
  
  render: function(parent_id) {
    if (!parent_id) {
      parent_id = 'page';
    }

    this.addContent(
      this.buildContainer(parent_id)
    );
    
    var ie7 = (navigator.appVersion.indexOf('MSIE 7.') == -1) ? false : true;
    if (ie7) {
      var top = document.getElementById('explorePerl_top');
      var bot = document.getElementById('explorePerl_bot');
      var con = document.getElementById('explorePerl_mid');
      top.style.width = (con.offsetWidth - 94) + "px";
      bot.style.width = (con.offsetWidth - 57) + "px";
    }
  },

  
  // buildContainer
  //
  // Generates a standard container structure for the menu bar,
  // returns the ID of the element to receive the menu content.
  
  buildContainer: function(parent_id) {
    var parent = document.getElementById(parent_id);
    
    if (parent) {
      var div = this.maker('div');
      
      this.container = div({id: 'explorePerl'}, [
        div({id: 'explorePerl_top'},[
          div({id: 'explorePerl_tl'}),
          div({id: 'explorePerl_tr'})
        ]),
        div({id: 'explorePerl_mid'},[
          div({id: 'explorePerl_ml'}),
          div({id: 'explorePerl_mr'})
        ]),
        div({id: 'explorePerl_bot'},[
          div({id: 'explorePerl_bl'}),
          div({id: 'explorePerl_br'})
        ])
      ]);
      
      parent.appendChild(this.container); 
      return 'explorePerl_ml';
    }
    return false;
  },
  
  
  // addContent
  //
  // Function to create HTML elements for the menu bar.
  // Generates a nested set of unordered lists, e.g.
  //
  //    <ul>
  //      <li>heading
  //        <ul>
  //          <li><a href="item.url">item.name</a>
  //        </ul>
  //    </ul>
  
  addContent: function(parent_id) {
    var parent = document.getElementById(parent_id);
    if (parent) {
      var ul   = this.maker('ul'),
          li   = this.maker('li'),
          a    = this.maker('a'),
          span = this.maker('span');
      
      topMenu = ul({'class': 'explorePerl_l1'});
      
      for (m=0; m<this.definition.length; m++) {
        var menuDefinition = this.definition[m];
        var subMenu        = ul({'class': 'explorePerl_l2'});
        
        for (s=0; s<menuDefinition.items.length; s++) {
          subMenu.appendChild(
            li([
              a({href: menuDefinition.items[s].url}, menuDefinition.items[s].name)
            ])
          );
        }

        topMenu.appendChild(
          li([
            span({'class': 'explorePerl_heading'}, menuDefinition.heading),
            subMenu
          ])
        );
      }
      
      parent.appendChild(topMenu);
    }
  },
  
  addEvents: function(anchor_id) {
    this.anchor = document.getElementById(anchor_id);
    var x = this;
    
    if (this.anchor) {
      this.anchor.onclick = function() {
        if (explorePerl.active) {
          x.hide();
        } else {
          x.show();
        }
      };
      
      this.anchor.onmouseover = function() {
        x.overAnchor = true;
        x.anchorMouseoverTimeout = setTimeout(function(){x.show()},250);
      };
      
      this.anchor.onmouseout = function() {
        //alert('anchor mouseout');
        x.overAnchor = false;
        clearTimeout(x.anchorMouseoverTimeout);
        if (x.active) {
          clearTimeout(x.viewTimeout);
          x.viewTimeout = setTimeout(function(){x.hide()},1000);
        }
      };
      
      this.container.onmouseover = function() {
        clearTimeout(x.viewTimeout);
      };
      
      this.container.onmouseout = function() {
        //alert('container mouseout');
        if (x.active) {
          clearTimeout(x.viewTimeout);
          x.viewTimeout = setTimeout(function(){x.hide()},1000);
        }
      };
    }
  },
  
  show: function() {
    //alert('show');
    var x       = this;
    this.active = true;
    
    if (navigator.appVersion.indexOf('MSIE') == -1) {
      this.fadeDirection = 'in';
      this.fadeTimeout   = setTimeout(function(){x.doFade()},5);
    } else {
      this.container.style.visibility = 'visible';
    }
  },
  
  hide: function() {
    //alert('hide');
    var x       = this;
    this.active = false;
    
    if (navigator.appVersion.indexOf('MSIE') == -1) {
      this.fadeDirection = 'out';
      this.fadeTimeout   = setTimeout(function(){x.doFade()},5);
    } else {
      this.container.style.visibility = 'hidden';
    }
  },
  
  doFade: function() {
    clearTimeout(this.fadeTimeout);
    var x = this;
    var o = this.o || 0;
    if (o > 1) {o = 1};
    if (o < 0) {o = 0; this.container.style.visibility = 'hidden';};
    
    if (this.fadeDirection == 'in') {
      if (o < 1) {
        o = o + 0.1;
        this.o = o;
        this.container.style.visibility = 'visible';
        this.container.style.opacity = o;
        //this.container.style.filter  = 'alpha(opacity=' + parseInt(o * 100) + ')';
        this.fadeTimeout = setTimeout(function(){x.doFade()},1);
      }
    }
    
    if (this.fadeDirection == 'out') {
      if (o > 0) {
        o = o - 0.1;
        this.o = o;
        this.container.style.opacity = o;
        //this.container.style.filter  = 'alpha(opacity=' + parseInt(o * 100) + ')';
        this.fadeTimeout = setTimeout(function(){x.doFade()},1);
      }
    }
  },
  
  // 'make' and 'maker' functions adapted from the book
  // JavaScript: The Definitive Guide, 5th Edition, by David Flanagan.
  // Copyright 2006 O'Reilly Media, Inc. (ISBN #0596101996)
  //
  // See http://oreilly.com/catalog/9780596101992/
  
  /**
  * make(tagname, attributes, children):
  *   create an HTML element with specified tagname, attributes and children.
  * 
  * The attributes argument is a JavaScript object: the names and values of its
  * properties are taken as the names and values of the attributes to set.
  * If attributes is null, and children is an array or a string, the attributes 
  * can be omitted altogether and the children passed as the second argument. 
  *
  * The children argument is normally an array of children to be added to 
  * the created element.  If there are no children, this argument can be 
  * omitted.  If there is only a single child, it can be passed directly 
  * instead of being enclosed in an array. (But if the child is not a string
  * and no attributes are specified, an array must be used.)
  * 
  * Example: make("p", ["This is a ", make("b", "bold"), " word."]);
  *
  * Inspired by the MochiKit library (http://mochikit.com) by Bob Ippolito
  */  
  make: function(tagname, attributes, children) {
    
    // If we were invoked with two arguments the attributes argument is
    // an array or string, it should really be the children arguments.
    if (arguments.length == 2 && 
        (attributes instanceof Array || typeof attributes == "string")) {
        children = attributes;
        attributes = null;
    }

    // Create the element
    var e = document.createElement(tagname);

    // Set attributes
    if (attributes) {
        for(var name in attributes) {
            if (name == "class") {
                // Fix for IE7
                e.className = attributes[name];
            } else {
                e.setAttribute(name, attributes[name]);
            }
        }
    }

    // Add children, if any were specified.
    if (children != null) {
        if (children instanceof Array) {  // If it really is an array
            for(var i = 0; i < children.length; i++) { // Loop through kids
                var child = children[i];
                if (typeof child == "string")          // Handle text nodes
                    child = document.createTextNode(child);
                e.appendChild(child);  // Assume anything else is a Node
            }
        }
        else if (typeof children == "string") // Handle single text child
            e.appendChild(document.createTextNode(children));
        else e.appendChild(children);         // Handle any other single child
    }

    // Finally, return the element.
    return e;
  },

  /**
  * maker(tagname): return a function that calls make() for the specified tag.
  * Example: var table = maker("table"), tr = maker("tr"), td = maker("td"); 
  */   
  maker: function (tag) {
    var make = this.make;
    return function(attrs, kids) {
        if (arguments.length == 1) return make(tag, attrs);
        else return make(tag, attrs, kids);
    }
  }
};   
