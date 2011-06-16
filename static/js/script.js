/* Author: slickplaid labs

*/
var remote,state,bills;
var showBills = function(err,data){
  bills = JSON.parse(data);
  var searchterm = $('.search').find('input').val();
  if(!bills.length){
    $('#answer').html('<h2>No bills found.</h2>');
    hideThrobber();
    return false;
  }
  var html = '<h2>Bills found for search term: '+searchterm+'</h2>';
  html += '<ul>';
  bills.forEach(function(bill){
    html += '<li>';
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
  return true;
}
,showState = function(err,data){
  if(data === ''){
    $('.state-info').html('');
    hideThrobber();
    return false;
  }
  state = JSON.parse(data);
  var html = '<h2>'+state.name+', Updated: '+state.latest_update+'</h2>';
  html += '<h3>Terms:</h3><ol>';
  state.terms.forEach(function(term){
    html += '<li>'+term.name;
    if(term.sessions.length) html += '<ol>';
    term.sessions.forEach(function(session){
      html += '<li>';
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
  return true;
}
,hideThrobber = function(){
  $('.throbber').fadeOut('fast');
}
,showThrobber = function(){
  $('.throbber').fadeIn('fast');
}
$(function(){
  DNode.connect(function(r){
    remote = r;
  });
  

  
  // input
  
  $('.select-state').live('change', function(){
    showThrobber();
    var $this = $(this);
    if($this.val() !== '') {
      remote.sun('metadata/'+$this.val()+'/', {}, showState);
      return false;
    } else {
      showState(null, '');
      return false;
    }
  });
  
  $('.search').live('submit', function(e){
    showThrobber();
    e.preventDefault();
    var $this = $(this)
    , input = $this.find('input').val()
    , state = $this.find('.select-state').val();
    if(input === '') return false;
    if(state === '' && input === '') return false;
    if(state === '') return remote.sun('bills/', {q: input}, showBills);
    else return remote.sun('bills/', {q: input, state: state}, showBills);
  });
});






















