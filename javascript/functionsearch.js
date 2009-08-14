// Perl function search

var indexLoaded   = false;
var perlFunctions = new Object;
var functionIndex = new Array();
var synonyms      = new Array();
var faqList       = new Array();
var podList       = new Object;
var moduleList    = new Object;
var sectionName   = new Object;

var stopWords       = new Object;
stopWords["what's"] = true;
stopWords["what"]   = true;
stopWords["how"]    = true;
stopWords["a"]      = true;
stopWords["i"]      = true;
stopWords["can"]    = true;
stopWords["but"]    = true;
stopWords["do"]     = true;
stopWords["is"]     = true;


//-------------------------------------------------------------------------

function doSearch(query,redirect) {
  // Load the index files
  if (indexLoaded == false) {
    loadIndex();
    loadFaqIndex();
    loadPodIndex();
    loadModuleIndex();
  }
  
  // QuickSearch
  perldoc.clearFlag('fromSearch');
  perldoc.clearFlag('searchQuery');
  if (redirect != "no") {
    if (perlFunctions["_"+query.toLowerCase()]) {
      perldoc.setFlag('fromSearch',true);
      perldoc.setFlag('searchQuery',query);
      location.replace("functions/"+query.toLowerCase()+".html");
      return;
    }
    if (podList[query.toLowerCase()]) {
      perldoc.setFlag('fromSearch',true);
      perldoc.setFlag('searchQuery',query);
      location.replace(query.toLowerCase()+".html");
      return;
    }
    if (podList["perl"+query.toLowerCase()]) {
      perldoc.setFlag('fromSearch',true);
      perldoc.setFlag('searchQuery',query);
      location.replace("perl"+query.toLowerCase()+".html");
      return;
    }
    for (module_name in moduleList) {
      if (module_name.toLowerCase() == query.toLowerCase()) {
        perldoc.setFlag('fromSearch',true);
        perldoc.setFlag('searchQuery',query);
        location.replace(module_name.replace(/::/g,"/")+".html");
        return;
      }
    }
  }

  // Split query string into individual words
  var query_words = new Array();
  query_words     = query.replace(/[^-:\w\.]/g," ").split(/\s+/);

  // Prepare query words (change to lower case singular)
  var word_id;
  var word = new String;
  for (word_id in query_words) {
    query_words[word_id] = stemWord(query_words[word_id]);
  }
  
  var query_points    = queryPoints(query_words);  // Expands synonyms
  
  var functionResults = functionSearch(query_points);
  var faqResults      = faqSearch(query_points);
  var podResults      = podSearch(query_points);
  var moduleResults   = moduleSearch(query_points);
  
  if ((faqResults.length + podResults.length + moduleResults.length + functionResults.length) > 0) {
    if (redirect == 1) {
      var topResult   = new Result;
      topResult.score = 0;
      if (functionResults[0] && functionResults[0].score > topResult.score) topResult = functionResults[0];
      if (faqResults[0]      && faqResults[0].score      > topResult.score) topResult = faqResults[0];
      if (podResults[0]      && podResults[0].score      > topResult.score) topResult = podResults[0];
      if (moduleResults[0]   && moduleResults[0].score   > topResult.score) topResult = moduleResults[0];
      //alert("Top result is: " + topResult.name);
      location.replace(topResult.url);
    } else {
      document.write('<p>Results for your query <b>"' + query + '"</b> were found in the following sections:</p>');
      document.write('<div class="indent">');
      printFunctionResults(functionResults);
      printFaqResults(faqResults);
      printPodResults(podResults);
      printModuleResults(moduleResults);
      document.write('</div>');
    }
  } else {
    document.write('<p>No matches found for your query <b>"' + query + '"</b></p>');
  }
}


//-------------------------------------------------------------------------

function queryPoints(query_words) {
  var query_points = new Object;
  
  for (var i in query_words) {
    var word = query_words[i];
    query_points[word] = 10;
    var synonym_id;
    for (synonym_id in synonyms) {
      var synonym_words = new Array;
      synonym_words = synonyms[synonym_id].toString().split(/\s+/);
      
      var synonym_word_id;
      for (synonym_word_id in synonym_words) {
        if (word == synonym_words[synonym_word_id]) {
	  var c;
          for (c in synonym_words) {
            if (query_points[synonym_words[c]] > 0) {
              // do nothing
            } else {
              query_points[synonym_words[c]] = 5;        
            }
	  }
	}
      }
    }    
  }
  
  return query_points;
}


//-------------------------------------------------------------------------

function functionSearch(query_points) {
  var score = new Object;
  for (var functionName in perlFunctions) {
    functionName = functionName.replace(/_/,"");
    var functionNameLC = functionName.toLowerCase();
    for (var queryWord in query_points) {
      if (queryWord == functionNameLC) {
        if (score[functionName] > 0) {    
          score[functionName] += (query_points[queryWord] * 50);
        } else {
          score[functionName]  = (query_points[queryWord] * 50); 
        }
      } else if ((queryWord.length > 1) && (functionNameLC.indexOf(queryWord) > -1)) {
        if (score[functionName] > 0) {    
          score[functionName] += (query_points[queryWord] * 14);
        } else {
          score[functionName]  = (query_points[queryWord] * 14); 
        }
        score[functionName] += (50 - (functionNameLC.indexOf(queryWord) * 2));
	score[functionName] -= ((functionNameLC.length - (functionNameLC.indexOf(queryWord) + queryWord.length)));
      }
    }
    
    var functionDescription = perlFunctions['_'+functionName];
    functionDescription = functionDescription.toLowerCase();    
    var functionWords   = functionDescription.split(/\s+/);
       
    for (var i in functionWords) {
      word = functionWords[i];
      if (stopWords[word] == true) {
        // ignore
      } else {
        word = stemWord(word);
        if (query_points[word] > 0) {
          if (score[functionName] > 0) {    
            score[functionName] += (26 * query_points[word]);
          } else {
            score[functionName] =  (26 * query_points[word]); 
          }       
        }
      }
    }
  }
  
  var sortedScores = new Array;
  for (var result in score) {
    sortedScores.push(result);
  }
  sortedScores.sort(function(a,b){return score[b]-score[a];});

  var sortedResults = new Array;
  for (var i in sortedScores) {
    var result = new Result; 
    result.name        = sortedScores[i];
    result.description = perlFunctions['_'+result.name];
    result.score       = score[result.name];
    result.url         = 'functions/' + result.name + '.html';
    sortedResults.push(result);
  }
  
  return sortedResults;
}


//-------------------------------------------------------------------------

function printFunctionResults(sortedResults) {
  if (sortedResults.length > 0) {
    document.write("<h2 class=search>Functions</h2><ul class=search>");
    for (var i in sortedResults) {
      document.write(sortedResults[i].html());
    }
    document.write("</ul>");
  }
}


//-------------------------------------------------------------------------

function faqSearch(query_points) {
  var score = new Object;
  for (var faqID = 0; faqID < faqList.length ; faqID++) {
    var faqText = faqList[faqID][1];
    faqText = faqText.toLowerCase();
    
    var faqWords = new Array;
    faqWords = faqText.replace(/[-.,\/\?\(\)\{\}=_+]/g," ").split(/\s+/);
    
    for (var i in faqWords) {
      word = faqWords[i];
      if (stopWords[word] == true) {
        // ignore
      } else {
        word = stemWord(word);
        if (query_points[word] > 0) {
          if (score[faqID] > 0) {    
            score[faqID] += query_points[word];
          } else {
            score[faqID] = query_points[word]; 
          }       
        }
      }
    }
  }
  
  var sortedScores = new Array;
  for (var faqID in score) {
    var result = {
      score: score[faqID],
      name:  faqList[faqID][1],
      url:   'perlfaq' + faqList[faqID][0] + '.html#' + newEscape(faqList[faqID][1])
    };
    sortedScores.push(result);
  }
  sortedScores.sort(function(a,b){return b.score - a.score;});

  return sortedScores;
}


//-------------------------------------------------------------------------

function printFaqResults (sortedResults) {
  if (sortedResults.length > 0) {
    document.write("<h2 class=search>FAQs</h2><ul class=search>");
    for (var i in sortedResults) {
      document.write(sortedResults[i].html());
    }
    document.write("</ul>");
  }
}


//-------------------------------------------------------------------------

function podSearch(query_points) {
  var score = new Object;
  for (var podName in podList) {
    for (var queryWord in query_points) {
      if (queryWord.length > 1) {
        if ((podName == queryWord) || (podName == ("perl"+queryWord))) {
          if (score[podName] > 0) {    
            score[podName] += (query_points[queryWord] * 10);
          } else {
            score[podName]  = (query_points[queryWord] * 10); 
          }             
        } else if (podName.indexOf(queryWord) > -1) {
          if (score[podName] > 0) {    
            score[podName] += (query_points[queryWord] * 5);
          } else {
            score[podName]  = (query_points[queryWord] * 5); 
	  }
        }             
      }
    }
    
    var podTitle = podList[podName][1];
    podTitle     = podTitle.toLowerCase();    
    var podWords = podTitle.split(/\s+/);
       
    for (var i in podWords) {
      word = podWords[i];
      if (stopWords[word] == true) {
        // ignore
      } else {
        word = stemWord(word);
        if (query_points[word] > 0) {
          if (score[podName] > 0) {    
            score[podName] += query_points[word];
          } else {
            score[podName] = query_points[word]; 
          }       
        }
      }
    }
  }
 
  var sortedScores = new Array;
  for (var podName in score) {
    var result = {
      score: score[podName],
      name:  podName,
      url:   podName + '.html',
      description: podList[podName][1]
    };
    sortedScores.push(result);
  }
  sortedScores.sort(function(a,b){return b.score - a.score;});
  
  return sortedScores;  
}


//-------------------------------------------------------------------------

function printPodResults(sortedResults) {
  if (sortedResults.length > 0) {
    document.write("<h2 class=search>Manual pages</h2><ul class=search>");
    for (var i in sortedResults) {
      document.write(sortedResults[i].html());
    }
    document.write("</ul>");
  }
}


//-------------------------------------------------------------------------

function moduleSearch(query_points) {
  var score = new Object;
  for (var moduleName in moduleList) {
    var moduleNameLC = moduleName.toLowerCase();
    for (var queryWord in query_points) {
      if (queryWord.length > 1) {
        if (moduleNameLC == queryWord) {
          if (score[moduleName] > 0) {    
            score[moduleName] += (query_points[queryWord] * 12);
          } else {
            score[moduleName]  = (query_points[queryWord] * 12); 
          }             
        } else if (moduleNameLC.indexOf(queryWord) > -1) {
          if (score[moduleName] > 0) {    
            score[moduleName] += (query_points[queryWord] * 4);
          } else {
            score[moduleName]  = (query_points[queryWord] * 4); 
	  }
          score[moduleName] += (50 - (moduleNameLC.indexOf(queryWord) * 2));
	  score[moduleName] -= ((moduleName.length - (moduleNameLC.indexOf(queryWord) + queryWord.length)));
        }             
      }
    }
    
    var moduleTitle = moduleList[moduleName];
    moduleTitle = moduleTitle.toLowerCase();    
    var moduleWords = moduleTitle.split(/\s+/);
       
    for (var i in moduleWords) {
      word = moduleWords[i];
      if (stopWords[word] == true) {
        // ignore
      } else {
        word = stemWord(word);
        if (query_points[word] > 0) {
          if (score[moduleName] > 0) {    
            score[moduleName] += query_points[word];
          } else {
            score[moduleName] = query_points[word]; 
          }       
        }
      }
    }
  }
  
  var sortedScores = new Array;
  for (var result in score) {
    sortedScores.push(result);
  }
  sortedScores.sort(function(a,b){return score[b]-score[a];});

  var sortedResults = new Array;
  for (var i in sortedScores) {
    var result = new Result; 
    result.name        = sortedScores[i];
    result.description = moduleList[result.name];
    result.score       = score[result.name];
    result.url         = (result.name + '.html').replace(/::/g,"/");
    sortedResults.push(result);
  }
  
  return sortedResults;  
}


//-------------------------------------------------------------------------

function printModuleResults(sortedResults) {
  if (sortedResults.length > 0) {
    document.write("<h2 class=search>Core modules / pragmas</h2><ul class=search>");
    for (var i in sortedResults) {
      document.write(sortedResults[i].html());
    }
    document.write("</ul>");
  }
}


//-------------------------------------------------------------------------

function stemWord(word) {
  word = word.toString().toLowerCase();
  word = word.replace(/[^-:\w\.]/g,"");
  word = word.replace(/\.pm$/,"");
  word = word.replace(/(\w+)ing$/,"$1");
  word = word.replace(/(\w+)ies$/,"$1y");
  word = word.replace(/(\w+)s$/,"$1");
  return word;
}


//-------------------------------------------------------------------------

function newEscape(word) {
  word = escape(word);
  word = word.replace(/%20/g,"-");
  //word = word.replace(/ /g,"-");
  //word = word.replace(/"/g,"%22");
  //word = word.replace(/([^\w\(\)'\*~!.-])/g,escape($1));
  //word = word.replace(/([^-\w])/g,"6".escape("$1"));
  return word;
}


//-------------------------------------------------------------------------

function Result() {
  this.html = Result_html;
}


//-------------------------------------------------------------------------

function Result_html() {
  var html;
  html = '<li><a href="' + this.url + '">' + this.name + "</a>";
  if (this.description) {
    html += " - " + this.description
  }
  //html += ' (' + this.score + ')';
  return html;
}
