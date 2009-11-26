// search.js
//
// perldoc.perl.org search engine


//-------------------------------------------------------------------------
// perldocSearch
//-------------------------------------------------------------------------

var perldocSearch = {
  
  // indexData - object to hold page indexes ------------------------------
  
  indexData: { },
  
  
  // run - runs the search query ------------------------------------------
  
  run: function(args) {    
    if (args.q) {
      args.q = args.q.replace(/\+/g," ");
      $('results_title').innerHTML = 'Search results for query "' + encodeURI(args.q) + '"';
      if (args.r && args.r == "no") {
        perldocSearch.doFullSearch(args.q);
      } else {
        perldocSearch.doQuickSearch(args.q) || perldocSearch.doFullSearch(args.q);
      }
    } else {
      // no query string specified
    }
  },
  
  
  // doQuickSearch - search for an exact page match -----------------------
  
  doQuickSearch: function(query) {
    ScriptLoader.load('indexPod.js');
    ScriptLoader.load('indexFunctions.js');
    ScriptLoader.load('indexModules.js');

    if (perldocSearch.indexData.functions.has("_"+query.toLowerCase())) {
      perldoc.setFlag('fromSearch',true);
      perldoc.setFlag('searchQuery',query);
      location.replace("functions/"+query.toLowerCase()+".html");
      return true;
    }
    if (perldocSearch.indexData.pod.has(query.toLowerCase())) {
      perldoc.setFlag('fromSearch',true);
      perldoc.setFlag('searchQuery',query);
      location.replace(query.toLowerCase()+".html");
      return true;    
    }
    if (perldocSearch.indexData.pod.has("perl" + query.toLowerCase())) {
      perldoc.setFlag('fromSearch',true);
      perldoc.setFlag('searchQuery',query);
      location.replace("perl"+query.toLowerCase()+".html");
      return true;
    }
    
    var moduleQuery = query.toLowerCase();
    moduleQuery     = moduleQuery.replace(/\.pm$/,"");
    moduleQuery     = moduleQuery.replace(/-/g," ");
    moduleQuery     = moduleQuery.replace(/::/g," ");
    
    var found = false;
    perldocSearch.indexData.modules.each( function(description,name) {
      var moduleName = name.toLowerCase().replace(/::/g," ");
      if (moduleName == moduleQuery) {
        perldoc.setFlag('fromSearch',true);
        perldoc.setFlag('searchQuery',query);
        location.replace(name.replace(/::/g,"/") + ".html");
        found = true;
      }
    });
    
    return found;
  },
  
  
  // doFullSearch - run a complete search ---------------------------------
  
  doFullSearch: function(query) {
    // Split query string into individual words
    var queryWords = new Array();
    queryWords     = query.toLowerCase().replace(/[^-:\w\.]/g," ").split(/\s+/);
    queryWords     = queryWords.map(perldocSearch.stemWord);
    
    window.setTimeout(function(){perldocSearch.searchPod(queryWords)},0);
    window.setTimeout(function(){perldocSearch.searchFunctions(queryWords)},0);
    window.setTimeout(function(){perldocSearch.searchModules(queryWords)},0);
    window.setTimeout(function(){perldocSearch.searchFAQs(queryWords)},0);
  },
  
  
  // searchPod - full search of Pod documents -----------------------------
  
  searchPod: function(queryWords) {
    perldocSearch.displayProgress('pod_search_results');
    ScriptLoader.load('indexPod.js');

    var sortedResults = perldocSearch.performFullSearch(
      perldocSearch.indexData.pod,
      queryWords,
      function(name) {
        return name + ".html";
      }
    );
    
    perldocSearch.displayResults('pod_search_results',sortedResults);
  },
  
  
  // searchFunctions - full search of Perl functions ----------------------
  
  searchFunctions: function(queryWords) {
    perldocSearch.displayProgress('function_search_results');
    ScriptLoader.load('indexFunctions.js');

    var sortedResults = perldocSearch.performFullSearch(
      perldocSearch.indexData.functions,
      queryWords,
      function(name) {
        return "functions/" + name + ".html";
      },
      "_"
    );
    
    perldocSearch.displayResults('function_search_results',sortedResults);
  },
  
  
  // searchModules - perform a full search on modules ---------------------
  
  searchModules: function(queryWords) {
    perldocSearch.displayProgress('module_search_results');
    ScriptLoader.load('indexModules.js');
    
    var sortedResults = perldocSearch.performFullSearch(
      perldocSearch.indexData.modules,
      queryWords,
      function(name) {
        return name.replace(/::/g,"/") + ".html";
      }
    );

    perldocSearch.displayResults('module_search_results',sortedResults);
  },
  
  
  // searchFAQs - perform a full search on FAQs ---------------------------
  
  searchFAQs: function(queryWords) {
    perldocSearch.displayProgress('faq_search_results');
    ScriptLoader.load('indexFAQs.js');
    
    var score   = new Hash;
    var matched = new Hash;
    perldocSearch.indexData.faqs.each(function(faq,faqIndex){matched.set(faqIndex,0);});

    queryWords.each( function(word) {
      matched.each(function(found,faqIndex) {
        var faq      = perldocSearch.indexData.faqs[faqIndex];
        var faqWords = new Array();
        faqWords     = faq[1].toString().toLowerCase().replace(/[-.,\/\?\(\)\{\}=_+]/g," ").split(/\s+/);
        faqWords     = faqWords.map(perldocSearch.stemWord);
        var faqText  = faqWords.join(" ");

        if (word.length > 1) {
          if (faqText.indexOf(word) > -1) {
            matched.set(faqIndex,1);
            if (score.has(faqIndex)) {
              score.set(faqIndex,score.get(faqIndex)+2);
            } else {
              score.set(faqIndex,2);
            }
          }      
        }
      });
      
      // Remove unmatched entries (score == 0)
      matched = matched.filter(function(value,key) {return value > 0;});
      matched = matched.map(function(){return 0;});
    });

    var sortedResults = matched.getKeys();
    sortedResults.sort(function(a,b){return score.get(b) - score.get(a)});
    sortedResults = sortedResults.map(function(faqIndex) {
      return new Hash ({
        "url": "perlfaq" + perldocSearch.indexData.faqs[faqIndex][0] + ".html#" + perldocSearch.newEscape(perldocSearch.indexData.faqs[faqIndex][1].trim()),
        "text": perldocSearch.indexData.faqs[faqIndex][1]
      });
    });
    
    perldocSearch.displayResults('faq_search_results',sortedResults);    
  },
  
  
  // performFullSearch - name and description text search -----------------
  
  performFullSearch: function(dataSet, queryWords, nameToUrl, prefix) {
    var score   = new Hash;
    var matched = dataSet.map(function(){return 0;});
    if (!prefix) {prefix = "";}
    
    queryWords.each(function(word) {
      matched.each(function(value,key) {
        var name             = key;
        name                 = name.slice(prefix.length);
        name                 = name.toLowerCase();
        
        var descriptionWords = new Array();
        descriptionWords     = dataSet[key].toLowerCase().replace(/[^-:\w\.]/g," ").split(/\s+/);
        descriptionWords     = descriptionWords.map(perldocSearch.stemWord);
        var description      = descriptionWords.join(" ");
        
        if (word.length > 1) {
          if (name == word) {
            matched.set(key,1);
            if (score.has(key)) {
              score.set(key,score.get(key)+20);
            } else {
              score.set(key,20);
            }
          } else if (name.indexOf(word) > -1) {
            matched.set(key,1);
            if (score.has(key)) {
              score.set(key,score.get(key)+15);
            } else {
              score.set(key,15);
            }
            if (name.indexOf(word) < 10) {
              score.set(key,score.get(key) - name.indexOf(word));
            }
            if (name.indexOf(word) >= 10) {
              score.set(key,score.get(key) - 10);
            }
          }
          if (description.indexOf(word) > -1) {
            matched.set(key,1);
            if (score.has(key)) {
              score.set(key,score.get(key)+5);
            } else {
              score.set(key,5);
            }
          }      
        }
      });
      
      // Remove unmatched entries (score == 0)
      matched = matched.filter(function(value,key) {return value > 0;});
      matched = matched.map(function(){return 0;});
    });
    
    var sortedResults = matched.getKeys();
    sortedResults.sort(function(a,b){
      if (score.get(a) == score.get(b)) {
        return a.length - b.length;
      } else {
        return score.get(b) - score.get(a);
      }
    });
    sortedResults = sortedResults.map(function(name) {
      return new Hash ({
        "url": nameToUrl(name.slice(prefix.length)),
        "text": name.slice(prefix.length),
        "description": dataSet.get(name)
      });
    });
    
    return sortedResults;
  },
  
  
  // displayProgress - shows "Searching..." indicator ---------------------
  
  displayProgress: function(elementID) {
    $(elementID).innerHTML = '<img src="loading.gif">Searching...';
  },
  
  
  // displayResults - shows search results --------------------------------
  
  displayResults: function(elementID,results) {
    if (results.length > 0) {
      var resultsHTML = "<ul>";
      results.each( function(result) {
        resultsHTML += '<li><a href="' + result.url + '">' + result.text + '</a>';
        if (result.description) {
          resultsHTML += ' - ' + result.description;
        }
      });
      resultsHTML += "</ul>";
      $(elementID).innerHTML = resultsHTML;
    } else {
      $(elementID).innerHTML = "No matches found";      
    }
  },
  
  
  // stemWord - returns the stem of a given word --------------------------
  
  stemWord: function(word) {
    word = word.toString().toLowerCase();
    word = word.replace(/[^-:\w\.]/g,"");
    word = word.replace(/\.pm$/,"");
    if (word.length > 5) {
      word = word.replace(/(\w+)ing$/,"$1");
      word = word.replace(/(\w+)ies$/,"$1y");
    }
    if (word.length > 3) {
      word = word.replace(/(\w+)s$/,"$1");
    }
    return word;
  },
  
  
  // newEscape - escape special characters --------------------------------
  
  newEscape: function(word) {
    word = escape(word);
    word = word.replace(/%20/g,"-");
    return word;
  }
  
}



//-------------------------------------------------------------------------
// ScriptLoader - load JavaScript files on demand
//-------------------------------------------------------------------------

  var ScriptLoader = {
    request: null,
    loaded: {},
    load: function() {
      for (var i = 0, len = arguments.length; i < len; i++) {
        var filename = 'static/' + arguments[i];
        if (!this.loaded[filename]) {
          if (!this.request) {
            if (window.XMLHttpRequest) this.request = new XMLHttpRequest; else if (window.ActiveXObject) {
              try {
                this.request = new ActiveXObject('MSXML2.XMLHTTP');
              } catch (e) {
                this.request = new ActiveXObject('Microsoft.XMLHTTP');
              }
            }
          }
          if (this.request) {
            if (this.request.overrideMimeType) {
              this.request.overrideMimeType("text/javascript");
            }
            this.request.open('GET', filename, false);
            this.request.send(null);
            if (this.request.responseText) {
              this.globalEval(this.request.responseText);
              this.loaded[filename] = true;
            }
          }
        }
      }
    },
    globalEval: function(code) {
      if (window.execScript) window.execScript(code, 'javascript'); else window.eval(code);
    }
  }
