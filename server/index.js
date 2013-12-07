
var irc = require('irc');
var ircServer = 'irc.freenode.org';
var channels = process.argv.slice(2);

var client = new irc.Client(ircServer, 'YoutubeTracker', {
    channels: channels,
});

console.log("Connecting to "+ircServer+" on channels ", channels);

client.addListener('pm', function (from, message) {
  if(message == "list") {
     // print list buffer
  }
});

client.addListener('error', function(message) {
  console.log('error: ', message);
});

var http = require('http');
var url = require('url');

http.createServer(function(req, res) {
  var parsedUrl = url.parse(req.url, true)
  var pathname = parsedUrl.pathname;
  if(pathname == "/say") {
    var query = parsedUrl.query;
    var nick = query.nick;
    var videoUrl = query.url;
    console.log(JSON.stringify(query));
    channels.forEach(function(channel) {
       client.say(channel, nick + " is watching " + videoUrl);
    });
  }
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end();
}).listen(9999);
