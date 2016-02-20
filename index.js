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
var gamePlayingFlag = false;

//broadcast client
wss.broadcast = function(data) {
    console.log("broadcast msg : " + data);
    for (var i in rummikub.users) {
        rummikub.users[i].ownWebsocket.send(JSON.stringify(data));
    }
};

//connect client
wss.on("connection", function(ws) {
    
    // Store the connection with ID method so we can loop through & contact all client
    var user = new User("GUEST_" + UTIL.random4digit(), ws);
    rummikub.users.push(user);
    connectCount++;

    initMessage();

    //receive message
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
        return {"connectCount" : connectCount, "gamePlayingFlag" : gamePlayingFlag, "myTurnFlag" : user.myTurnFlag};
    }

    function initMessage() {
        console.log("websocket connection open");
        wss.broadcast(UTIL.printNowDate() + "<br/>" + user.id + MESSAGE.MSG_JOIN);
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
        wss.broadcast(user.id + MESSAGE.MSG_TURN);
    }

    function processExit() {
        gamePlayingFlag = false;

        wss.broadcast(makeCommand(CMD.EXIT));
        wss.broadcast(MESSAGE.MSG_EXIT);
        wss.broadcast(makeCommand( CMD.INFO, boardInfo() ));
    }

    function processChat(message) {
        wss.broadcast(user.id + " : " + message);
    }

    function processDisconnect() {
        console.log("websocket connection close");
        //client & connect count delete
        rummikub.removeUser(user.id);
        connectCount--;

        if(gamePlayingFlag == true) {
            processExit();
        }

        wss.broadcast(UTIL.printNowDate() + "<br/>" + user.id + MESSAGE.MSG_DISCONNECT);
        wss.broadcast(makeCommand( CMD.INFO, boardInfo() ));
    }

})
