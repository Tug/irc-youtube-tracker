
var JQUERY_PATH = "jquery-1.6.1.min.js";

var MINIMUM_TIME = 15; // 15s

/**
 * Notifications
 */
var NOTIFICATION_TIMEOUT = 5000;
var NOTIFICATION_SEPARATOR = ':::';


/**
 * Page action icons
 */
var ICON_LOGO = 'icon.png';                      // Audioscrobbler logo
var ICON_UNKNOWN = 'icon_unknown.png';           // not recognized
var ICON_NOTE = 'icon_note.png';                 // now playing
var ICON_NOTE_DISABLED = 'icon_note_gray.png';   // disabled
var ICON_TICK = 'icon_tick.png';                 // scrobbled
var ICON_TICK_DISABLED = 'icon_tick_gray.png';   // disabled
var ICON_CONN_DISABLED = 'icon_cross_gray.png';  // connector is disabled


/**
 * Icon - title - popup set identificators
 */
var ACTION_UNKNOWN = 1;
var ACTION_NOWPLAYING = 2;
var ACTION_SCROBBLED = 3;
var ACTION_UPDATED = 4;
var ACTION_DISABLED = 5;
var ACTION_REENABLED = 6;
var ACTION_CONN_DISABLED = 7;
var ACTION_SITE_RECOGNIZED = 8;
var ACTION_SITE_DISABLED = 9;