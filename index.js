var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

//constant
var fs = require('fs');
eval(fs.readFileSync('./constant.js')+'');
eval(fs.readFileSync('./rummikub.js')+'');

//start server
app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)
console.log("http server listening on %d", port);

var wss = new WebSocketServer({server: server})
console.log("websocket server created");

//static variable
var rummikub = new Rummikub();
var connectCount = 0;
var clients = {};
var gamePlayingFlag = false;

//broadcast client
wss.broadcast = function(data) {
    console.log("broadcast msg : " + data);
    for (var i in this.clients) {
        this.clients[i].send(JSON.stringify(data));
    }
};

//connect client
wss.on("connection", function(ws) {
    // Turn Flag
    var myTurnFlag = false;
    // Specific id for this client & increment connectCount
    var id = "GUEST_" + UTIL.random4digit();
    connectCount++;
    // Store the connection method so we can loop through & contact all clients
    clients[id] = ws;
    // User Setting
    rummikub.users.push(new User(id));
  
    initConnect();

    ws.on('message', function(message) {
       
        console.log("raw message : " + message);
        
        if(message == CMD.START) {

            processStart();

        }else if(message == CMD.TURN) {

            processTurn();

        }else if(message == CMD.EXIT) {

            processExit();
        
        }else {

            processChat(message);
            
        }
    
    });
    
    ws.on("close", function() {
        processDisconnect();
    })

    function makeCommand(command, param) {
        return { "command" : command, "param" : param};
    }

    function boardInfo() {
        return {"connectCount" : connectCount, "gamePlayingFlag" : gamePlayingFlag, "myTurnFlag" : myTurnFlag};
    }

    function initConnect() {
        console.log("websocket connection open");
        wss.broadcast(UTIL.printNowDate() + "<br/>" + id + MESSAGE.MSG_JOIN);
        wss.broadcast(makeCommand( CMD.INFO, boardInfo() ));
    }

    function processStart() {

        rummikub.initializeGame();
        console.log(rummikub.users);

        gamePlayingFlag = true;

        wss.broadcast(makeCommand(CMD.START));
        wss.broadcast(MESSAGE.MSG_START);
        wss.broadcast(makeCommand( CMD.INFO, boardInfo() ));
    }

    function processTurn() {
        wss.broadcast(makeCommand(CMD.TURN));
        wss.broadcast(id + MESSAGE.MSG_TURN);
    }

    function processExit() {
        gamePlayingFlag = false;

        wss.broadcast(makeCommand(CMD.EXIT));
        wss.broadcast(MESSAGE.MSG_EXIT);
        wss.broadcast(makeCommand( CMD.INFO, boardInfo() ));
    }

    function processChat(message) {
        wss.broadcast(id + " : " + message);
    }

    function processDisconnect() {
        console.log("websocket connection close");
        //client & connect count delete
        delete clients[id];
        connectCount--;
        //User setting
        rummikub.removeUser(id);

        if(gamePlayingFlag == true) {
            processExit();
        }

        wss.broadcast(UTIL.printNowDate() + "<br/>" + id + MESSAGE.MSG_DISCONNECT);
        wss.broadcast(makeCommand( CMD.INFO, boardInfo() ));
    }

})
