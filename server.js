var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

//es6 support
var Set = require("es6-set");

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
var gamePlayingFlag = false;
var turnCount = 1;
var currentPlayer = {};
var lastSyncTiles = [];

var timer = null;
var sec = 0;

//broadcast client
webSocketServer.broadcast = function(data) {
    //console.log("[broadcast msg]=" + JSON.stringify(data));
    for (var i in rummikub.users) {
        rummikub.users[i].ownWebsocket.send(JSON.stringify(data));
    }
};

//send specific client
webSocketServer.sendMessage = function(data, id) {
    //console.log("[send msg -> " + id + "]=" + JSON.stringify(data));
    for (var i in rummikub.users) {
        if(id == rummikub.users[i].id) {
            rummikub.users[i].ownWebsocket.send(JSON.stringify(data));
        }
    }
};

//connect client
webSocketServer.on("connection", function(ws) {

    var user = new User(BOARD.USER_PREFIX + UTIL.random4digit(), ws, UTIL.randomChatColor());
    rummikub.users.push(user);

    processJoin(user);
    
    //receive message
    ws.on('message', function(message) {

        var requestObject = JSON.parse(message);

        //console.log("[Message Received] Command : " + requestObject.command + " Param : " + requestObject.param);
        console.log("[Message Received] Command : " + requestObject.command);
        
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
            "gamePlayingFlag" : gamePlayingFlag, 
            "turnCount" : turnCount, 
            "currentPlayerID" : currentPlayer.id,
            "usersInfo" : usersInfo()
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

    function usersInfo() {

        var usersInfo = [];

        for (var i in rummikub.users) {
            usersInfo.push(userInfo(rummikub.users[i]));
        }

        return usersInfo;
    }

    function userScoreInfo() {

        var userScoreInfo = [];
        
        var winner = {};
        winner.isWin = true;
        winner.id = "";
        winner.score = 0;

        for(var idx in rummikub.users) {
            if(rummikub.users[idx].own.length == 0) {
                winner.id = rummikub.users[idx].id;
            }else {
                var loser = {};
                loser.isWin = false;
                loser.id = rummikub.users[idx].id;
                loser.score = 0;
                for(var ownIdx in rummikub.users[idx].own) {
                    loser.score -= Number(rummikub.users[idx].own[ownIdx].score);
                    winner.score += Number(rummikub.users[idx].own[ownIdx].score);
                }
                userScoreInfo.push(loser);
            }
        }
        userScoreInfo.push(winner);

        return userScoreInfo;
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

        //Timer Start
        sandGlassTimer(true);

    }

    function processTurn(param, user) {

        var validateResult = false;

        turnCount++;
        // select next turn player
        currentPlayer = rummikub.users[turnCount % rummikub.users.length];
        
        // 게임보드에 놓인 타일 중에 사용한 타일은 user.use에 추가하고 user.own에서는 제거
        for(var i=0; i<BOARD.HEIGHT; i++) {
			for(var j=0; j<BOARD.WIDTH; j++) {
				var tile = param.board[(i*BOARD.WIDTH)+j];

				if(tile != null) {
					if(tile.isOwn == true) {
						user.use.push(tile);
						user.removeOwnTile(tile);    
					}
				}
				
			}
        }

        // 사용자가 사용한 타일이 없으면 패털티로 타일 한개 가져감
        if(user.use.length == 0) {
            processPenalty(user, param.isTimeout);
        }else {

            // 타일이 규칙에 맞게 배치되어있는지 확인
            if(rummikub.validateTile(param.board)) {
                // 등록 된 사용자인 경우
                if(user.registerYN) {

                    //console.log("\n\n\n========= user own ========");
                    //console.log(user.own);
                    //console.log("===========================");

                    // ownBoard의 타일이 모두 없어졌으면 게임 종료
                    if(user.own.length == 0) {
                        processWin();
                        return;
                    }

                    validateResult = true;

                }else {
                    // use타일의 합이 30이 넘는지 확인
                    if(user.validateRegisterTile()) {
                        user.registerYN = true;
                        validateResult = true;
                    }else {
                        processRollback(user);
                        processPenalty(user, param.isTimeout);
                    }
                }

            }else {
                processRollback(user);
                processPenalty(user, param.isTimeout);
            }

        }

        // Turn 종료 전 사용 타일 초기화
        user.use = [];
        // Turn 종료 후 gameBoard 설정
        webSocketServer.broadcast(UTIL.makeCommand( CMD.TURN ));

        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_TURN, user.id) ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_NEXT_TURN, currentPlayer.id) ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));

        //성공적으로 turn을 마쳤을 경우
        if(validateResult) {
            // 마지막 성공한 sync화면 저장 (다음 processTurn 수행 시 rollback 작업에 이용)
            lastSyncTiles = param.board;
        }

        //Timer reStart
        sandGlassTimer(true);
        
    }

    function processRollback(user) {
        //사용했던 타일은 다시 own으로 복귀
        webSocketServer.sendMessage(UTIL.makeCommand( CMD.ROLLBACK, user.use), user.id);
        user.own = user.own.concat(user.use);
        //마지막 성공한 sync화면 불러오기
        processSync(lastSyncTiles);
    }

    function processPenalty(user, isTimeout) {

        var numberOfPenaltyTile = isTimeout ? BOARD.PENALTY_THREE : BOARD.PENALTY_ONE;
        var penaltyTiles = rummikub.penaltyTile(numberOfPenaltyTile);

        //패널티 타일은 다시 own으로 추가
        user.own = user.own.concat(penaltyTiles);

        webSocketServer.sendMessage(UTIL.makeCommand( CMD.PENALTY, penaltyTiles), user.id); 
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_PENALTY, user.id, numberOfPenaltyTile) ));
    }

    function processExit() {
        gamePlayingFlag = false;
		
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, MESSAGE.MSG_EXIT));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.EXIT ));

        //Timer End
        sandGlassTimer(false);
    }

    function processWin() {
        gamePlayingFlag = false;
		
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_WIN, user.id) ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.WIN, userScoreInfo() ));
    }

    function processSync(param) {
        webSocketServer.broadcast(UTIL.makeCommand( CMD.SYNC, param ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
    }

    function processChat(message) {

        if(message.indexOf(INLINE_CMD.HELP) == 0 ) {

            processHelp(message);

        }else if(message.indexOf(INLINE_CMD.CHANGE_NAME) == 0 ) {

            processChangeName(message);
			
        }else {
            var obj = {};
            obj.text = user.id + " : " + message;
            obj.color = user.chatColor;
            webSocketServer.broadcast(UTIL.makeCommand(CMD.CHAT, obj));          
        }

    }

    function processDisconnect(user) {
        console.log("websocket connection close");

        //client & connect count delete        
        rummikub.removeUser(user.id);
        turnCount = 1;

        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_DISCONNECT, user.id) ));
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));

        if(gamePlayingFlag == true) {
            webSocketServer.broadcast(UTIL.makeCommand( CMD.DISCONNECT, user.id ));
            processExit();
        }
        
    }

    function processHelp(param){
        webSocketServer.sendMessage(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_HELP) ), user.id);
    } 

    function processChangeName(param){

        var newName = param.split(" ")[1];
        var originName = user.id;

        //change user id
        user.id = newName;
        webSocketServer.broadcast(UTIL.makeCommand( CMD.CHAT, UTIL.getMessage(MESSAGE.MSG_CHANGE_NAME, originName, newName) ));
        webSocketServer.sendMessage(UTIL.makeCommand( CMD.PRIVATE_INFO, userInfo(user) ), user.id);
        webSocketServer.broadcast(UTIL.makeCommand( CMD.INFO, boardInfo() ));
    }

    function sandGlassTimer(enable) {

        if(timer != null) {
            clearInterval(timer); 
        }

        if(enable) {
            sec = BOARD.TIMER_SEC;
            timer = setInterval(function(){
                sandGlassTrigger();
            }, BOARD.TIMER_INTERVAL);
        }else {
            sec = 0;
        }

    }

    function sandGlassTrigger() {
        var param = {};
        param.sec = sec;
        param.currentPlayerID = currentPlayer.id;
        webSocketServer.broadcast(UTIL.makeCommand( CMD.TIMER, param ));
        sec--;
    }

})
