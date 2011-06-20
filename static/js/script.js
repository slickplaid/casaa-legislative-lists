/* Author: slickplaid labs

*/
var remote,state,bills,$question,$state,$searchinput,$stateselect,bstate = {},_get = {};
var decodeGet = function(){
  document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
      function decode(s) {
          return decodeURIComponent(s.split("+").join(" "));
      }
  
      _get[decode(arguments[1])] = decode(arguments[2]);
  });  
}
,pushState = function(method, data /*, title, query */){
  if(method === 'bills'){
    bstate.bills = data;
    delete bstate.bill;
  } else if(method === 'state'){
    bstate.state = data;
  } else if(method == 'bill'){
    bstate.bill = data;
    delete bstate.bills;
  }
  title = arguments[2]+' - CASAA Legislatr' || 'CASAA Legislatr';
  query = arguments[3] || '';
  if(method !== 'state'){
    History.pushState(bstate, title, query);
  }
}
,showBills = function(err,data){
  if(data) bills = JSON.parse(data);
  else updateSearch();
  var searchterm = $('.search').find('input').val();
  if(!bills.length){
    $('#answer').html('<h2>No bills found.</h2>');
    hideThrobber();
    var title = ($stateselect.val()) ? 'Search for '+$searchinput.val()+', '+$stateselect.val().toUpperCase() : 'Search for '+$searchinput.val()
    , query = ($stateselect.val() === '') ? '?q='+escape($searchinput.val()) : '?q='+escape($searchinput.val())+'&s='+escape($stateselect.val());
    History.pushState(data, title, query);
    return false;
  }
  var html = '<h2>Bills found for search term: '+searchterm+' ('+bills.length+' found)</h2>';
  html += '<ul class="bills">';
  bills.forEach(function(bill){
    html += '<li class="bill" bill_id="'+bill.state+'/'+bill.session+'/'+bill.chamber+'/'+bill.bill_id+'/">';
    html += '<h3>'+bill.state.toUpperCase()+': ';
    if(bill.title.length > 100) html += bill.title.substr(0,99)+' &hellip;';
    else html += bill.title;
    html += '</h3>';
    html += '<ul><li>Created: '+bill.created_at+'</li>';
    if(bill.updated_at) html += '<li>Updated: '+bill.updated_at+'</li>';
    html += '<li>Bill ID: '+bill.bill_id+'</li>';
    html += '</ul>';
    html += '</li>';
  });
  html += '</ul>';
  $('#answer').html(html);
  hideThrobber();
  debug(err,data);
  var title = ($stateselect.val()) ? 'Search for '+$searchinput.val()+', '+$stateselect.val().toUpperCase() : 'Search for '+$searchinput.val()
  , query = ($stateselect.val() === '') ? '?q='+escape($searchinput.val()) : '?q='+escape($searchinput.val())+'&s='+escape($stateselect.val());
  pushState('bills', data, title, query);
  return true;
}
,showState = function(err,data){
  if(data === ''){
    $('.state-info').html('');
    hideThrobber();
    return false;
  }
  state = JSON.parse(data);
  var html = '<h2>'+state.name+'</h2>';
  html += '<h3>Terms:</h3><ol class="terms">';
  state.terms.forEach(function(term){
    html += '<li class="term">'+term.name;
    if(term.sessions.length) html += '<ol class="sessions">';
    term.sessions.forEach(function(session){
      html += '<li class="session" session="'+session+'">';
      html += '';
      html += session;
      html += '';
      html += '</li>';      
    });
    if(term.sessions.length) html += '</ol>';
    html += '</li>';
  });
  html += '</ol>';
  
  $('.state-info').html(html);
  hideThrobber();
  debug(err,data);
  pushState('state', data);
  return true;
}
,hideThrobber = function(){
  $('.throbber').fadeOut('fast');
}
,showThrobber = function(){
  $('.throbber').fadeIn('fast');
}
,debug = function(err,data){
  $('#debug').html('<pre>'+data+'</pre>');
}
,search = function(){
  showThrobber();
  var search = $('.search').find('input').val(), state = $('.select-state').val();
  if(search === '' && state !== ''){
    return remote.sun('metadata/'+state+'/', {}, showState);
  } else if(search !== '' && state === ''){
    return remote.sun('bills/', {q: search}, showBills);
  } else if(search !== '' && state !== ''){
    remote.sun('bills/', {q: search, state: state}, showBills);
    return remote.sun('metadata/'+state+'/', {}, showState);
  } else {
    showState(null, '');
    return showBills(null, '');
  }
}
,showBill = function(err,data){
  var bill = JSON.parse(data);
  $stateselect.val(bill.state.toUpperCase());
  remote.sun('metadata/'+bill.state+'/', {}, showState);
  var html = '<h2>'+bill.state.toUpperCase()+': '+bill.title+'</h2>';
  html += '<p class="bill_description">Bill <span class="em bill_id">'+bill.bill_id+'</span> '
         +'was introduced as a(n) <span class="em type">'+bill.type.join(' ')+'</span> '
         +'in the <span class="em session">'+bill.session+'</span> session, '
         +'<span class="em chamber">'+bill.chamber+'</span> chamber.</p>';
  html += '<p></p>';
  if(bill.alternate_titles.length){
    html += '<h3>Alternate Titles</h3><ul class="alternate_titles">';
    bill.alternate_titles.forEach(function(title){
      html += '<li>'+title+'</li>';
    });
    html += '</ul>';
  }
  if(bill.actions.length){
    html += '<h3>Actions</h3><ul class="actions">';
    bill.actions.forEach(function(action){
      html += '<li>'+action.date+': <span class="em action">'+action.action+'</span> by <span class="em actor">'+action.actor+'</span>. ';             
      if(action.type.length){
        html += '<span class="em types">'+action.type.join('</span>, <span class="em types">').replace(/<\/span>, <span class="em types">$/, '')+'</span>';
      }
      html += '</li>';
    });
    html += '</ul>';
  }
  if(bill.sponsors.length){
    html += '<h3>Sponsors</h3><ul class="sponsors">';
    bill.sponsors.forEach(function(sponsor){
      html += '<li><span class="em sponsor" title="'+sponsor.leg_id+'">'+sponsor.name+'</span>, <span class="em sponsor-type">'+sponsor.type+'</span></li>';
    });
    html += '</ul>';     
  }
  if(bill.sources.length){
    html += '<h3>Sources</h3><ul class="sources">';
    bill.sources.forEach(function(source){
      html += '<li><a href="'+source.url+'" class="em source" title="'+source.retrieved+'">'+source.url+'</a></li>';
    });
    html += '</ul>';    
  }
  if(bill.documents.length){
    html += '<h3>Documents</h3><ul class="documents">';
    bill.documents.forEach(function(document){
      html += '<li><a href="'+document.url+'" class="em document">'+document.name+'</a></li>';
    });
    html += '</ul>';    
  }
  if(bill.versions.length){
    html += '<h3>Versions</h3><ul class="versions">';
    bill.versions.forEach(function(version){
      html += '<li><a href="'+version.url+'" class="em version">'+version.name+'</a></li>';
    });
    html += '</ul>';    
  }
  if(bill.votes.length){
    html += '<h3>Votes</h3>';
    html += '<ul class="votes">';
    bill.votes.forEach(function(vote){
      html += '<li>';
      html += (vote.passed) ? '<span class="pass">PASS</span> ' : '<span class="fail">FAIL</span> ';
      html += '<span class="yes_count">'+vote.yes_count+'</span> / <span class="no_count">'+vote.no_count+'</span> / <span class="other_count">'+vote.other_count+'</span> @ '+vote.chamber+' '
             +vote.motion+'</li>';
    });
    html += '</ul>';    
  }  
  
  $('#answer').html(html);
  debug(err,data);
  var query = bill.state+'/'+bill.session+'/'+bill.chamber+'/'+bill.bill_id;
  pushState('bill', data, 'Bill '+bill.bill_id+', '+bill.state.toUpperCase(), '?b='+escape(query));
  return true;
}
,updateSearch = function(){
  decodeGet();
  //if(!remote){
  //  DNode.connect(function(r){
  //    remote = r;
  //  });
  //}
  if(typeof _get.s === 'string'){
    $stateselect.val(_get.s.toUpperCase());
  }
  if(typeof _get.q === 'string'){
    $searchinput.val(_get.q);
    search();
  }
  if(typeof _get.b === 'string'){
    remote.sun('bills/'+unescape(_get.b)+'/', {}, showBill);
  }
}
,updatePage = function(){
  var State = History.getState();
  if(State.data.state) showState(null, State.data.state);
  if(State.data.bill && (State.data.bill !== bstate.bill)){
    showBill(null, State.data.bill);
  } else if(State.data.bills && (State.data.bills !== bstate.bills)){
    showBills(null, State.data.bills);
  } else {
    //updateSearch();
  }
}

$(function(){
  $question = $('#question')
  , $state = $question.find('.search')
  , $searchinput = $state.find('input')
  , $stateselect = $state.find('.select-state');
  DNode.connect(function(r){
    remote = r;
    updateSearch();
  });
  
  // input
  
  $('.select-state').live('change', function(e){
    e.preventDefault();
    search();
    return false;
  });
  
  $('.search').live('submit', function(e){
    e.preventDefault();
    search();
    return false;
  });
  
  // bills
  $('.bill').live('click', function(e){
    var $this = $(this), bill_id = $this.attr('bill_id');
    remote.sun('bills/'+bill_id, {}, showBill);
  });
  $('.debug-show').css('cursor', 'pointer').click(function(e){
    $('#debug').toggle();
  });
});

// Handle History.js state changes
History.Adapter.bind(window, 'statechange', function(){
  showThrobber();
  updatePage();
});
History.Adapter.bind(window, 'onanchorchange', function(){
  showThrobber();
  updatePage();
});