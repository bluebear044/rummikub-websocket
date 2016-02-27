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

    var user = new User("GUEST_" + UTIL.random4digit(), ws);
    rummikub.users.push(user);
    connectCount++;

    processJoin(user);
    
    //receive message
    ws.on('message', function(message) {

        var requestObject = JSON.parse(message);

        console.log("============================================");
        console.log("=             Message Received             =");
        console.log("============================================");
        console.log("Command : " + requestObject.command);
        console.log("Param : " + requestObject.param);
        console.log("============================================");

        if(requestObject.command == CMD.START) {

            processStart(user);

        }else if(requestObject.command == CMD.TURN) {

            processTurn(user);

        }else if(requestObject.command == CMD.SYNC) {
            
            processSync(requestObject.param);

        }else if(requestObject.command == CMD.CHAT) {

            processChat(requestObject.param);

        }else {
            // nothing happen
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

    function processJoin(user) {
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
        webSocketServer.sendMessage(UTIL.makeCommand( CMD.PRIVATE_INFO, userInfo(user) ), user.id);
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_JOIN, user.id) ));
    }

    function processStart(user) {

        gamePlayingFlag = true;
        rummikub.initializeGame();
        console.log("============================================");
        console.log("=               GAME SETTING               =");
        console.log("============================================");

        // select next turn player
        console.log("turnCount : " + turnCount);
        console.log("rummikub.users.length : " + rummikub.users.length);
        console.log("turnCount % rummikub.users.length : " + turnCount % rummikub.users.length);
        console.log("rummikub.users : " + rummikub.users);
        currentPlayerID = rummikub.users[turnCount % rummikub.users.length].id;

        for(var idx in rummikub.users) {
            webSocketServer.sendMessage(UTIL.makeCommand( CMD.START, userInfo(rummikub.users[idx]) ), rummikub.users[idx].id);
            webSocketServer.sendMessage(UTIL.makeCommand( CMD.PRIVATE_INFO, userInfo(rummikub.users[idx]) ), rummikub.users[idx].id);
        }

        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, MESSAGE.MSG_START) );
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_NEXT_TURN, currentPlayerID) ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));

    }

    function processTurn(user) {
        turnCount++;
        // select next turn player
        currentPlayerID = rummikub.users[turnCount % rummikub.users.length].id;

        //todo
        //현재 올려져 있는 보드의 타일이 규칙에 맞는 지 확인하는 로직
        //특정 사용자의 ownBoard의 타일이 모두 없어졌는지 확인하는 로
        //특정 사용자에게 벌칙으로 1타일 혹은 3타일 가져가는 로직
        webSocketServer.sendMessage(UTIL.makeCommand( CMD.REFRESH, userInfo(user) ), user.id);
        
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_TURN, user.id) ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_NEXT_TURN, currentPlayerID) ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
    }

    function processExit() {
        gamePlayingFlag = false;

        webSocketServer.broadcast(UTIL.makeCommand( CMD.EXIT ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, MESSAGE.MSG_EXIT));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
    }

    function processSync(param) {
        webSocketServer.broadcast(UTIL.makeCommand(CMD.SYNC, param));
        webSocketServer.sendMessage(UTIL.makeCommand( CMD.REFRESH, userInfo(user) ), user.id);
    }

    function processChat(message) {
        webSocketServer.broadcast(UTIL.makeCommand(CMD.CHAT, user.id + " : " + message));
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

        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_DISCONNECT, user.id) ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, MESSAGE.MSG_EXIT ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.EXIT ));
        
    }

})
