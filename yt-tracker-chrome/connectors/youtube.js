
// remember urls to detect ajax pageloads (using history API)
var lastUrl = '';


// we will observe changes at the main player element
// which changes (amongst others) on ajax navigation
var target = document.querySelector('#player-api');

var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        // detect first mutation that happens after url has changed
        if (lastUrl != location.href) {
            lastUrl = location.href;
            updateNowPlaying();
        }
    });
});


var config = { attributes: true };

observer.observe(target, config);



// bind page unload function to discard current "now listening"
$(window).unload(function() {

    // reset the background scrobbler song data
    chrome.runtime.sendMessage({type: 'reset'});

    return true;
});

/**
 * Trim whitespaces from both endings of the string
 */
function trim(str) {
   return str.replace(/^\s+|\s+$/g, '');
}


/**
 * Called every time the player reloads
 */
function updateNowPlaying() {

   // get the video ID
   var videoID = document.URL.match(/v[^a-z]([a-zA-Z0-9\-_]{11})/);
   if (videoID && videoID.length > 0)
      videoID = videoID[1];
   else
      videoID = null;

   // videoID from title at profile page
   if ($('#playnav-curvideo-title > span[id!=chrome-scrobbler-status]').length > 0) {
      videoID = $('#playnav-curvideo-title > span[id!=chrome-scrobbler-status]').attr('onclick').toString().match(/\?v=(.{11})/);
      if (videoID && videoID.length > 0)
         videoID = videoID[1];
   }
   // videoID from title at profile page - newer version
   if ($('#playnav-curvideo-title > a').length > 0) {
      videoID = $('#playnav-curvideo-title > a').attr('href').toString().match(/\?v=(.{11})/);
      if (videoID && videoID.length > 0)
         videoID = videoID[1];
   }

   // something changed?
   if (!videoID) {
      console.log('If there is a YouTube player on this page, it has not been recognized. Please fill in an issue at GitHub');
      //alert('YouTube has probably changed its code. Please get newer version of the Last.fm Scrobbler extension');
      return;
   }

   // http://code.google.com/intl/cs/apis/youtube/2.0/developers_guide_protocol_video_entries.html
   var googleURL = "https://gdata.youtube.com/feeds/api/videos/" + videoID + "?alt=json";

   // Get clip info from youtube api
   chrome.runtime.sendMessage({type: "xhr", url: googleURL}, function(response) {
      var info = JSON.parse(response.text);
      var title = info.entry.title.$t;
      chrome.runtime.sendMessage({type: 'nowPlaying', videoID: videoID, title: title });
   });

}



/**
 * Listen for requests from scrobbler.js
 */
chrome.runtime.onMessage.addListener(
   function(request, sender, sendResponse) {
         switch(request.type) {

             // background calls this to see if the script is already injected
             case 'ping':
                 sendResponse(true);
                 break;
         }
   }
);
