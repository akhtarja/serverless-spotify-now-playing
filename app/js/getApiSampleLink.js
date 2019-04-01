(function($) {
  'use strict';
  const sampleUrl = `${spotify_now_playing_playback_state_apiurl}?key=example`;

  $('#sample-api-call').prop('href', sampleUrl);
})(jQuery);