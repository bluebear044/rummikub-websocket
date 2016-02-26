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

var webSocketServer = new WebSocketServer({server: server})
console.log("websocket server created");

//static variable
var rummikub = new Rummikub();
var connectCount = 0;
var gamePlayingFlag = false;
var turnCount = 1;
var currentPlayerID;

//broadcast client
webSocketServer.broadcast = function(data) {
    console.log("broadcast msg : " + JSON.stringify(data));
    for (var i in rummikub.users) {
        rummikub.users[i].ownWebsocket.send(JSON.stringify(data));
    }
};

//send specific client
webSocketServer.sendMessage = function(data, id) {
    console.log("send msg : " + JSON.stringify(data) + " --> " + id);
    for (var i in rummikub.users) {
        if(id == rummikub.users[i].id) {
            rummikub.users[i].ownWebsocket.send(JSON.stringify(data));
        }
    }
};

//connect client
webSocketServer.on("connection", function(ws) {
    
    // Store the connection with ID method so we can loop through & contact all client
    var user = new User("GUEST_" + UTIL.random4digit(), ws);
    rummikub.users.push(user);
    connectCount++;

    initUser(user);

    //receive message
    ws.on('message', function(message) {
       
        console.log("raw message : " + message);
        var responseObject = JSON.parse(message);
  
        if(responseObject.command == CMD.START) {

            processStart(user);

        }else if(responseObject.command == CMD.TURN) {

            processTurn(user);

        }else if(responseObject.command == CMD.EXIT) {

            processExit();

        }else if(responseObject.command == CMD.SYNC) {
            
            processSync(responseObject.param);

        }else {

            processChat(message);
            
        }
    
    });
    
    ws.on("close", function() {
        processDisconnect(user);
    })

    function boardInfo() {
        return {
            "connectCount" : connectCount, 
            "gamePlayingFlag" : gamePlayingFlag, 
            "turnCount" : turnCount, 
            "currentPlayerID" : currentPlayerID
        };
    }

    function userInfo(user) {
        return {
            "id" : user.id,
            "registerYN" : user.registerYN,
            "use" : user.use,
            "own" : user.own
        };
    }

    function initUser(user) {
        console.log("websocket connection open");
        //webSocketServer.broadcast(UTIL.printNowDate() + "<br/>" + user.id + MESSAGE.MSG_JOIN);
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
        webSocketServer.sendMessage(UTIL.makeCommand( CMD.PRIVATE_INFO, userInfo(user) ), user.id);
    }

    function processStart(user) {

        rummikub.initializeGame();
        console.log("=================================================")
        console.log("==                GAME SETTING                 ==")
        console.log("=================================================")
        console.log(rummikub.users.toString());
        console.log("=================================================")

        gamePlayingFlag = true;
        // select next turn player
        console.log("turnCount : " + turnCount);
        console.log("rummikub.users.length : " + rummikub.users.length);
        console.log("turnCount % rummikub.users.length : " + turnCount % rummikub.users.length);
        console.log("rummikub.users : " + rummikub.users);
        currentPlayerID = rummikub.users[turnCount % rummikub.users.length].id;

        webSocketServer.broadcast(UTIL.makeCommand(CMD.START));
        webSocketServer.broadcast(MESSAGE.MSG_START);
        //webSocketServer.broadcast(UTIL.getMessage(MESSAGE.MSG_NEXT_TURN, currentPlayerID));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));

        for(var idx in rummikub.users) {
            webSocketServer.sendMessage(UTIL.makeCommand( CMD.PRIVATE_INFO, userInfo(rummikub.users[idx]) ), rummikub.users[idx].id);
        }

    }

    function processTurn(user) {
        turnCount++;
        // select next turn player
        currentPlayerID = rummikub.users[turnCount % rummikub.users.length].id;

        webSocketServer.broadcast(UTIL.makeCommand(CMD.TURN));
        webSocketServer.broadcast(UTIL.getMessage(MESSAGE.MSG_TURN, user.id));
        webSocketServer.broadcast(UTIL.getMessage(MESSAGE.MSG_NEXT_TURN, currentPlayerID));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
    }

    function processExit() {
        gamePlayingFlag = false;

        webSocketServer.broadcast(UTIL.makeCommand(CMD.EXIT));
        webSocketServer.broadcast(MESSAGE.MSG_EXIT);
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
    }

    function processSync(param) {
        webSocketServer.broadcast(UTIL.makeCommand(CMD.SYNC, param));
    }

    function processChat(message) {
        webSocketServer.broadcast(message);
    }

    function processDisconnect(user) {
        console.log("websocket connection close");
        //client & connect count delete
        console.log("remove id : " + user.id);
        console.log("before : " + rummikub.users);
        rummikub.removeUser(user.id);
        console.log("after : " + rummikub.users);
        connectCount--;
        turnCount = 1;

        if(gamePlayingFlag == true) {
            processExit();
        }

        webSocketServer.broadcast(UTIL.printNowDate() + "<br/>" + UTIL.getMessage(MESSAGE.MSG_DISCONNECT, user.id));
        webSocketServer.broadcast(MESSAGE.MSG_EXIT);
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
    }

})
