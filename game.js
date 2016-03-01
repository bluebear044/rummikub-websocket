var host;
switch(window.location.protocol) {
   case 'http:':
   case 'https:':
     host = location.origin.replace(/^http/, 'ws');
     //host = "ws://desolate-wave-36629.herokuapp.com/";
     break;
   case 'file:':
     host = "ws://127.0.0.1:5000";
     break;
   default:
     host = "ws://127.0.0.1:5000";
}

var ws;
var user={};

var Game = {

  main: function() {
      ws = Game.webSocketConnect();
      ws.onmessage = function (event) {

        var responseObject = JSON.parse(event.data);

        console.log("[Message Received] Command : " + responseObject.command + " Param : " + responseObject.param);

        //Command Controller
        if(responseObject.command == CMD.START) {

          Game.processStart(responseObject.param);

        }else if(responseObject.command == CMD.TURN) {

          Game.processTurn(responseObject.param);
          Sound.playEffect("bell");

        }else if(responseObject.command == CMD.PENALTY) {

          Game.processPenalty(responseObject.param);

        }else if(responseObject.command == CMD.EXIT) {

          Game.processExit();

        }else if(responseObject.command == CMD.INFO) {

          Game.processInfo(responseObject.param);

        }else if(responseObject.command == CMD.PRIVATE_INFO) {

          Game.processPrivateInfo(responseObject.param);

        }else if(responseObject.command == CMD.SYNC) {

          Game.processSync(responseObject.param);
          Sound.playEffect("cardPlace");

        }else if(responseObject.command == CMD.CHAT) {

          Game.processChat(responseObject.param);
          if(responseObject.param.indexOf(" : ") > -1) {
            Sound.playEffect("chat");
          }

        }else {
          // nothing happen
        }
        
      }

      //Button Event Register
      Game.registerButtonEvent();

      //Initialize Board
      Game.makeBoard("#"+BOARD.GAME_BOARD_ID, BOARD.WIDTH, BOARD.HEIGHT);
      Game.makeBoard("#"+BOARD.OWN_BOARD_ID, BOARD.OWN_WIDTH, BOARD.OWN_HEIGHT);

      //Setting Intro Tiles
      Game.introBoard();

      //REDIPS Initialize
      Redips.initialize();

      //Sound Initialize
      Sound.initialize();

  },

  registerButtonEvent: function() {

    $( "#sendBtn" ).click(function() {
      Game.sendMessage(ws);
    });    

    $( "#messageBtn" ).click(function() {
      $( "#floatingMessage" ).toggle();
    });

    //keyboard
    $( "#msg" ).keypress(function(e) {
      if(e.keyCode == 13) {
        Game.sendMessage(ws);
      }
    });

    Game.bindGameStartButtonEvent();

  },

  bindGameStartButtonEvent: function() {
    $( "#gameBtn").unbind( "click" );
    $( "#gameBtn").html(MESSAGE.MSG_BTN_START);
    $( "#gameBtn" ).click(function() {
      Game.startGame(ws);
    });
  },

  bindTurnButtonEvent: function() {
    $( "#gameBtn").unbind( "click" );
    $( "#gameBtn").html(MESSAGE.MSG_BTN_NEXT_TURN);
    $( "#gameBtn" ).click(function() {
      Game.nextTurn(ws);
    });
  },

  webSocketConnect: function() {
    //Websocket Instance
    return new WebSocket(host);
  },

  sendMessage: function(ws) {
      var messageValue = $( "#msg" ).val();
      ws.send(JSON.stringify( UTIL.makeCommand( CMD.CHAT, messageValue) ));
      $( "#msg" ).val("");
  },

  startGame: function(ws) {
      ws.send(JSON.stringify( UTIL.makeCommand(CMD.START) ));
  },

  nextTurn: function(ws) {
      var boardSerializeMap = Game.serializeTable("#"+BOARD.GAME_BOARD_ID);
      //console.log(JSON.stringify(boardSerializeMap));
      ws.send(JSON.stringify( UTIL.makeCommand(CMD.TURN, boardSerializeMap) ));
  },

  processStart: function(param) {

    Game.clearBoard("#"+BOARD.GAME_BOARD_ID);
    for(var idx in param.own) {
      var i = Math.floor(idx/BOARD.WIDTH);
      var j = idx%BOARD.WIDTH;
      Game.settingTile("#"+BOARD.OWN_BOARD_ID, param.own[idx], i, j);
    }

    Game.bindTurnButtonEvent();

  },

  processTurn: function(param) {

    //turn종료 당시 gameBoard에 있는 타일은 ownBoard로 못 옮기도록 설정 (id값을 own_xxxx 에서 game_xxxx로 바꿈)
    var tbl = $("table" + "#" + BOARD.GAME_BOARD_ID + " tr").map(function() {
      return $(this).find('td').map(function() {
        if($(this).html() != "") {

          var tileId = $(this).children("div").attr("id");
          if(tileId.split("_")[0] == "own") {
            $(this).children("div").attr("id",tileId.replace("own","game"));
          }

        }
      }).get();
    }).get();

  },

  processPenalty: function(param) {

    alert("ownBoard에 " + param[0].score + param[0].color + "추가");
  
  },

  processExit: function() {

      Game.clearBoard("#"+BOARD.GAME_BOARD_ID);
      Game.clearBoard("#"+BOARD.OWN_BOARD_ID);
      Game.introBoard();
      $( "#gameBtn" ).attr("disabled", false);

      Game.bindGameStartButtonEvent();

  },

  processInfo: function(param) {
    $( "#connectCount" ).html(UTIL.getMessage(MESSAGE.MSG_CLIENT_COUNT, param.connectCount));

    if(param.gamePlayingFlag == true ) {
      $( "#gamePlaying" ).html(MESSAGE.MSG_GAME_PLAYING);
      $( "#turnCount" ).html(UTIL.getMessage(MESSAGE.MSG_TURN_COUNT, param.turnCount));
    }else {
      $( "#gamePlaying" ).html(MESSAGE.MSG_GAME_READY);
      $( "#turnCount" ).empty();
    }

    //Active/Deactive start button
    if(param.connectCount > 1 && param.gamePlayingFlag == false) {
      $( "#gameBtn" ).attr("disabled", false);
    }else {
      $( "#gameBtn" ).attr("disabled", true);
    }

    if(param.gamePlayingFlag == true ) {
      //Active/Deactive turn button
      if(user.id == param.currentPlayerID && param.gamePlayingFlag == true) {
        $( "#gameBtn" ).attr("disabled", false);
        Redips.enableDrag(BOARD.GAME_BOARD_ID, true);
        Redips.enableDrag(BOARD.OWN_BOARD_ID, true);
      }else {
        $( "#gameBtn" ).attr("disabled", true);
        Redips.enableDrag(BOARD.GAME_BOARD_ID, false);
        Redips.enableDrag(BOARD.OWN_BOARD_ID, false);
      }
    }

  },

  processPrivateInfo: function(param) {
    user.id = param.id;
    user.registerYN = param.registerYN;
    user.use = param.use;
    user.own = param.own;

    $( "#myInfo" ).html(UTIL.getMessage(MESSAGE.MSG_MY_INFO, user.id));

  },

  processSync: function(param) {

    Game.clearBoard("#"+BOARD.GAME_BOARD_ID);

    for(var i=0; i<BOARD.HEIGHT; i++) {
      for(var j=0; j<BOARD.WIDTH; j++) {
        var tile = param[(i*BOARD.WIDTH)+j];

        if(tile != null) {
          Game.settingTile("#"+BOARD.GAME_BOARD_ID, tile, i, j);
        }
        
      }
    }

  },

  processChat: function(message) {
    $("#messages").append("<p>"+message+"</p>");
    //메시지창 스크롤 최하단 유지
    $("#messages").scrollTop($("#messages")[0].scrollHeight);
  },

  settingTile: function(id,tile,x,y) {
      var tileHtml = "";
      var cardID = "";

      if("#"+BOARD.OWN_BOARD_ID == id || tile.isOwn == true){
        cardID = "own_"+UTIL.random4digit();
        // id가 own으로 시작하는 경우 "redips-mark" class가 지정된 ownBoar에 타일을 놓을 수 있도록 설정
        //(기본적으로 redips-mark 로 지정된 곳에는 어떤 요소도 놓을 수 없음)
        Redips.mark(cardID);

      }else{
        cardID = "game_"+UTIL.random4digit();
      }

      if(tile.isJoker) {
        tileHtml = "<div class=\"card redips-drag\" id=\""+cardID+"\" ><span class=\"jo_eye\"></span><span class=\"jo_eye\"></span><span class=\"jo_mouth circle\"></span></div>";
      }else {
        tileHtml = "<div class=\"card redips-drag\" id=\""+cardID+"\" ><span class=\""+tile.color+" circle\">"+tile.score+"</span></div>";
      }

      this.settingTileHtml(id,tileHtml,x,y);
  },

  settingTileHtml: function(id,tileHtml,x,y) { 
      $(id+" tr:eq("+x+") td:eq("+y+")").html(tileHtml);
  },

  makeBoard: function(id,x,y){
    var talbeHtml = "";

    for(i=0; i<y; i++) {
      talbeHtml += "<tr>";
      for(j=0; j<x; j++) {
        if("#"+BOARD.OWN_BOARD_ID == id){
          talbeHtml += "<td class=\"redips-mark\">";
        }else {
          talbeHtml += "<td>";
        }
        talbeHtml += "</td>";
      }
      talbeHtml += "</tr>";
    }

    $(id).html(talbeHtml);
  },

  serializeTable: function(id) {

    var tableObj = new Array();

    var tbl = $("table"+id+ " tr").map(function() {
      return $(this).find('td').map(function() {

        if($(this).html() == "") {
          tableObj.push(null);
        } else {

          var isJoker = false;
          var isOwn = false;
          if($(this).children("div").attr("id").split("_")[0] == "own") {
            isOwn = true;
          }

          if($(this).children("div").children("span").html() == "") {
            isJoker = true;
            var tile = new Tile("30", "red", isJoker, isOwn);
            tableObj.push(tile);
          }else {
            var score = $(this).children("div").children("span").html();
            var color = $(this).children("div").children("span").attr("class").replace(" circle","");
            var tile = new Tile(score, color, isJoker, isOwn);
            tableObj.push(tile);
          }

        }

      }).get();
    }).get();

    return tableObj;
  },

  introBoard: function() {
      Game.settingTile("#"+BOARD.GAME_BOARD_ID, new Tile("R", "red", false), 1, 4);
      Game.settingTile("#"+BOARD.GAME_BOARD_ID, new Tile("U", "red", false), 1, 5);
      Game.settingTile("#"+BOARD.GAME_BOARD_ID, new Tile("M", "red", false), 1, 6);
      Game.settingTile("#"+BOARD.GAME_BOARD_ID, new Tile("30", "red", true), 1, 7);
      Game.settingTile("#"+BOARD.GAME_BOARD_ID, new Tile("Y", "red", false), 1, 8);

      Game.settingTile("#"+BOARD.GAME_BOARD_ID, new Tile("C", "blue", false), 2, 8);
      Game.settingTile("#"+BOARD.GAME_BOARD_ID, new Tile("U", "yellow", false), 2, 9);
      Game.settingTile("#"+BOARD.GAME_BOARD_ID, new Tile("B", "black", false), 2, 10);
      Game.settingTile("#"+BOARD.GAME_BOARD_ID, new Tile("E", "red", false), 2, 11);
  },

  clearBoard: function(id) {

    for(var i=0; i<BOARD.HEIGHT; i++) {
      for(var j=0; j<BOARD.WIDTH; j++) {
        Game.settingTileHtml(id, "", i, j);
      }
    }

  }

};

var Redips = {
  initialize: function() {
    
    //REDIPS.drag.init(); //처음부터 타일 움직이지 못하도록 초기화 하지 않음
    REDIPS.drag.dropMode = 'single';

    //REDIPS Dropped Event
    REDIPS.drag.event.dropped = function () {
      var boardSerializeMap = Game.serializeTable("#"+BOARD.GAME_BOARD_ID);
      //console.log(JSON.stringify(boardSerializeMap));
      var requestObject = UTIL.makeCommand(CMD.SYNC, boardSerializeMap);

      console.log("REQUEST CMD : " + requestObject.command);
      console.log("REQUEST PARAM : " + requestObject.param);
      ws.send(JSON.stringify(requestObject));
    };
  },

  enableDrag: function(cssName, isEnable) {
    REDIPS.drag.init();
    REDIPS.drag.enableTable(isEnable, cssName);
  },

  mark: function(id) {
    REDIPS.drag.mark.exception[id] = "mark";
  }

};