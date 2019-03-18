(function($) {
  'use strict';

  function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
  }

  const apiKey = getQueryVariable('apiKey');

  $('#api-key').html(apiKey);
  $('#api-url').html(`${spotify_now_playing_playback_state_apiurl}?key=${apiKey}`);
})(jQuery);