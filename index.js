var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server})
console.log("websocket server created");

var count = 0;
var clients = {};

wss.broadcast = function(data) {
    console.log("broadcast msg : " + data);
    for (var i in this.clients) {
        this.clients[i].send(JSON.stringify(data));
    }
};


wss.on("connection", function(ws) {
    // Specific id for this client & increment count
    var id = "GUEST_" + count++;
    // Store the connection method so we can loop through & contact all clients
    clients[id] = ws;
    
    console.log("websocket connection open");
    wss.broadcast((new Date()) + "<br/>" + id + ' connected.');

    ws.on('message', function(message) {
       wss.broadcast(id + " : " + message);
    });
    
    ws.on("close", function() {
       console.log("websocket connection close");
       wss.broadcast((new Date()) + "<br/>" + id + ' disconnected.');
       delete clients[id];
   })
})
