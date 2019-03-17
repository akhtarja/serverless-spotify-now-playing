(function($) {
  'use strict';
  const authUrl = `https://accounts.spotify.com/authorize?${spotify_now_playing_auth_querystring}`;

  $('#get-api-key').prop('href', authUrl);
})(jQuery);