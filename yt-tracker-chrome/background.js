
// browser tab with actually scrobbled track
var nowPlayingTab = null;

// video structure, filled in nowPlaying phase, (artist, track, album, duration, startTime)
var video = {};

// timer to submit the video
var scrobbleTimeout = null;

// is scrobbling disabled?
var disabled = false;

console.log("hello");

/**
 * Default settings & update notification
 */
{
   // use notifications by default
   if (localStorage.nick == null)
      localStorage.nick = "User";
}


function reset() {
   console.log('reset called');
   if (scrobbleTimeout != null) {
      clearTimeout(scrobbleTimeout);
      scrobbleTimeout = null;
   }

   nowPlayingTab = null;
   video = {};
}



/**
 * Creates query string from object properties
 */
function createQueryString(params) {
   var parts = new Array();

   for (var x in params)
      parts.push( x + '=' + encodeUtf8( params[x] ) );

   return parts.join('&');
}


/**
 * Encodes the utf8 string to use in parameter of API call
 */
function encodeUtf8(s) {
   return encodeURIComponent( s );
}



/**
 * Tell server which video is playing right now (won't be scrobbled yet!)
 */
function nowPlaying() {
   console.log('nowPlaying request: %s', video.url);
}



/**
 * Finally scrobble the video, but only if it has been playing long enough.
 * Cleans global variables "video", "playingTab" and "scrobbleTimeout" on success.
 */
function submit() {
   // bad function call
   if (video == null || !video || video.url == '' || video.nick == '' ) {
      reset();
      chrome.tabs.sendMessage(nowPlayingTab, {type: "submitFAIL", reason: "No video"});
      return;
   }

   console.log('submit called for %s - %s', video.nick, video.url);

   var params = video;
   
   var url = localStorage.apiURL + '?' + createQueryString(params);

   var http_request = new XMLHttpRequest();
   http_request.open("GET", url, false); // synchronous
   http_request.send(null);

   if (http_request.status == 200) {

      console.log('submitted %s - %s (%s)', video.nick, video.url, http_request.responseText);

      // Confirm the content script, that the video has been scrobbled
      if (nowPlayingTab)
        chrome.tabs.sendMessage(nowPlayingTab, {type: "submitOK", video: video});

   }
   else if (http_request.status == 503) {
      console.log('submit failed %s - %s (%s)', video.nick, video.url, http_request.responseText);
   }
   else {
      console.log('submit failed %s - %s (%s)', video.nick, video.url, http_request.responseText);
   }

   // clear the structures awaiting the next video
   reset();
}



/**
 * Extension inferface for content_script
 * nowPlaying(artist, track, currentTime, duration) - send info to server which video is playing right now
 * xhr(url) - send XHR GET request and return response text
 */
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
         switch(request.type) {

            // Called when a new video has started playing. If the artist/track is filled,
            // they have to be already validated! Otherwise they can be corrected from the popup.
            // Also sets up a timout to trigger the scrobbling procedure (when all data are valid)
   		case "nowPlaying":
                  console.log('nowPlaying %o', request);

                  // do the reset to be sure there is no other timer running
                  reset();

                  // remember the caller
                  nowPlayingTab = sender.tab.id;

                  var videoID = request.videoID;
                  var videoURL = "http://www.youtube.com/watch?v="+videoID;

                  video = {
                     nick: localStorage.nick,
                     url: videoURL
                  };

                  // make the connection to last.fm service to notify
                  nowPlaying();

                  // The minimum time is 10 sec
                  var min_time = MINIMUM_TIME;

                  // Set up the timer
                  scrobbleTimeout = setTimeout(submit, min_time * 1000);

      		sendResponse({});
      		break;

            // called when the window closes / unloads before the video can be scrobbled
            case "reset":
                  // TEMP
                  //delete localStorage.sessionID;
                  //delete localStorage.token;

                  reset();
                  sendResponse({});
                  break;

            // returns the options in key => value pseudomap
            case "getOptions":
                  var opts = {};
      		for (var x in localStorage)
                     opts[x] = localStorage[x];
                  sendResponse({value: opts});
      		break;

            // do we need this anymore? (content script can use ajax)
            case "xhr":
      		var http_request = new XMLHttpRequest();
      		http_request.open("GET", request.url, true);
      		http_request.onreadystatechange = function() {
      			if (http_request.readyState == 4 && http_request.status == 200)
      				sendResponse({text: http_request.responseText});
      		};
      		http_request.send(null);
      		break;

            default:
                  console.log('Unknown request: %s', $.dump(request));
         }

         return true;
	}
);