var perldocPrefs = {
  
  // load - loads current settings into the form
  
  load: function() {
    var toolbarType = perldoc.getFlag('toolbar_position');
    if (toolbarType != 'standard') {
      $('toolbar_fixed').checked = true;
    } else {
      $('toolbar_standard').checked = true;
    }
  },
  
  
  // save - saves settings into the perldoc cookie
  
  save: function() {
    if ($('toolbar_standard').checked) {
      perldoc.setFlag('toolbar_position','standard');
    } else {
      perldoc.clearFlag('toolbar_position');      
    }
    
    $('from_search').set('html','<div id="searchBanner"><b>Your preferences have been saved.</b>');
  },
  
  
  // cancel - cancels changing settings
  
  cancel: function() {
    location.href = "index.html";
  }
  
};
