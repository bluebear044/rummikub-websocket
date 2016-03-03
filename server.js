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
var currentPlayer = {};

//broadcast client
webSocketServer.broadcast = function(data) {
    console.log("[broadcast msg]=" + JSON.stringify(data));
    for (var i in rummikub.users) {
        rummikub.users[i].ownWebsocket.send(JSON.stringify(data));
    }
};

//send specific client
webSocketServer.sendMessage = function(data, id) {
    console.log("[send msg -> " + id + "]=" + JSON.stringify(data));
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

        console.log("[Message Received] Command : " + requestObject.command + " Param : " + requestObject.param);
        
        if(requestObject.command == CMD.START) {

            processStart(user);

        }else if(requestObject.command == CMD.TURN) {

            processTurn(requestObject.param, user);

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
            "currentPlayerID" : currentPlayer.id
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

    function userAllInfo() {

        /*
        for(var idx in rummikub.users) {
            rummikub.users[idx].own
        }
        */

        return {
            "userInformation" : "something"
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

        // select next turn player    
        currentPlayer = rummikub.users[turnCount % rummikub.users.length];

        for(var idx in rummikub.users) {
            webSocketServer.sendMessage(UTIL.makeCommand( CMD.START, userInfo(rummikub.users[idx]) ), rummikub.users[idx].id);
            webSocketServer.sendMessage(UTIL.makeCommand( CMD.PRIVATE_INFO, userInfo(rummikub.users[idx]) ), rummikub.users[idx].id);
        }

        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, MESSAGE.MSG_START) );
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_NEXT_TURN, currentPlayer.id) ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));

    }

    function processTurn(param, user) {
        turnCount++;
        // select next turn player
        currentPlayer = rummikub.users[turnCount % rummikub.users.length];
        
        for(var i=0; i<BOARD.HEIGHT; i++) {
          for(var j=0; j<BOARD.WIDTH; j++) {
            var tile = param[(i*BOARD.WIDTH)+j];

            if(tile != null) {
                if(tile.isOwn == true) {
                    user.addUseTile(tile);
                    user.removeOwnTile(tile);    
                }
            }
            
          }
        }

        console.log("\n\n\n");
        console.log("====================================================");
        console.log(user.toString());
        console.log("====================================================");
        console.log("\n\n\n");

        // 사용자가 사용한 타일이 없으면 패털티로 타일 한개 가져감
        if(user.use.length == 0) {
            webSocketServer.sendMessage(UTIL.makeCommand( CMD.PENALTY, rummikub.penaltyTile(BOARD.PENALTY_ONE)), user.id);
            webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_PENALTY, user.id, BOARD.PENALTY_ONE) ));
        }else {

            // 타일이 규칙에 맞게 배치되어있는지 확인
            if(user.validateTile()) {
                // 등록 된 사용자인 경우
                if(user.registerYN) {

                    // ownBoard의 타일이 모두 없어졌으면 게임 종료
                    if(user.own.length == 0) {
                        processWin();
                        return;
                    }

                }else {
                    // use타일의 합이 30이 넘는지 확인
                    if(user.validateRegisterTile()) {
                        user.registerYN = true;
                    }else {
                        webSocketServer.sendMessage(UTIL.makeCommand( CMD.ROLLBACK, user.use), user.id);
                        webSocketServer.sendMessage(UTIL.makeCommand( CMD.PENALTY, rummikub.penaltyTile(BOARD.PENALTY_THREE)), user.id);
                        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_PENALTY, user.id, BOARD.PENALTY_THREE) ));
                    }
                }

            }else {
                webSocketServer.sendMessage(UTIL.makeCommand( CMD.ROLLBACK, user.use), user.id);
                webSocketServer.sendMessage(UTIL.makeCommand( CMD.PENALTY, rummikub.penaltyTile(BOARD.PENALTY_THREE)), user.id); 
                webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_PENALTY, user.id, BOARD.PENALTY_THREE) ));
            }

        }

        // Turn 종료 전 사용 타일 초기화
        user.use = [];
        // Turn 종료 후 gameBoard 설정
        webSocketServer.broadcast(UTIL.makeCommand( CMD.TURN ));

        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_TURN, user.id) ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_NEXT_TURN, currentPlayer.id) ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));

    }

    function processExit() {
        gamePlayingFlag = false;
   
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, MESSAGE.MSG_EXIT));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.EXIT ));
    }

    function processWin() {
        gamePlayingFlag = false;
   
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_WIN, user.id) ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.WIN, userAllInfo() ));
    }

    function processSync(param) {
        webSocketServer.broadcast(UTIL.makeCommand( CMD.SYNC, param ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
    }

    function processChat(message) {
        webSocketServer.broadcast(UTIL.makeCommand(CMD.CHAT, user.id + " : " + message));
    }

    function processDisconnect(user) {
        console.log("websocket connection close");

        //client & connect count delete        
        rummikub.removeUser(user.id);
        connectCount--;
        turnCount = 1;

        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_DISCONNECT, user.id) ));

        if(gamePlayingFlag == true) {
            processExit();
        }
        
    }

})
