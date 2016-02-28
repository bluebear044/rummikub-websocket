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

          //Game.processTurn(responseObject.param);

        }else if(responseObject.command == CMD.EXIT) {

          Game.processExit();

        }else if(responseObject.command == CMD.INFO) {

          Game.processInfo(responseObject.param);

        }else if(responseObject.command == CMD.PRIVATE_INFO) {

          Game.processPrivateInfo(responseObject.param);

        }else if(responseObject.command == CMD.SYNC) {

          Game.processSync(responseObject.param);

        }else if(responseObject.command == CMD.CHAT) {

          Game.processChat(responseObject.param);

        }else {
          // nothing happen
        }
        
      }

      //Button Event Register
      Game.registerButtonEvent();

      //Initialize Board
      Game.makeBoard("#gameBoard", BOARD.WIDTH, BOARD.HEIGHT);
      Game.makeBoard("#ownBoard", BOARD.OWN_WIDTH, BOARD.OWN_HEIGHT);

      //Setting Intro Tiles
      Game.introBoard();

      //REDIPS Initialize
      Redips.initialize();

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

    $( "#startBtn" ).click(function() {
      Game.startGame(ws);
    });

    $( "#turnBtn" ).click(function() {
      Game.nextTurn(ws);
    });
    $( "#turnBtn" ).attr("disabled", true);

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
      ws.send(JSON.stringify( UTIL.makeCommand(CMD.TURN) ));
  },

  processStart: function(param) {

    Game.clearBoard("#gameBoard");
    for(var idx in param.own) {
      var i = Math.floor(idx/BOARD.WIDTH);
      var j = idx%BOARD.WIDTH;
      Game.settingTile("#ownBoard", param.own[idx], i, j);
    }

  },

  processTurn: function(param) {
    //todo
  },

  processExit: function() {

      Game.clearBoard("#gameBoard");
      Game.clearBoard("#ownBoard");
      Game.introBoard();
      $( "#turnBtn" ).attr("disabled", true);

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
      $( "#startBtn" ).attr("disabled", false);
    }else {
      $( "#startBtn" ).attr("disabled", true);
    }

    if(param.gamePlayingFlag == true ) {
      //Active/Deactive turn button
      if(user.id == param.currentPlayerID && param.gamePlayingFlag == true) {
        $( "#turnBtn" ).attr("disabled", false);
        Redips.enableDrag("gameBoard",true);
        Redips.enableDrag("ownBoard",true);
      }else {
        $( "#turnBtn" ).attr("disabled", true);
        Redips.enableDrag("gameBoard",false);
        Redips.enableDrag("ownBoard",false);
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

    Game.clearBoard("#gameBoard");

    for(var i=0; i<BOARD.HEIGHT; i++) {
      for(var j=0; j<BOARD.WIDTH; j++) {
        var tile = param[(i*BOARD.WIDTH)+j];

        if(tile != null) {
          Game.settingTile("#gameBoard", tile, i, j);
        }
        
      }
    }

  },

  processChat: function(message) {
    $("#messages").append("<p>"+message+"</p>");
  },

  settingTile: function(id,obj,x,y) {
      var tileHtml = "";
      if(obj.isJoker) {
        tileHtml = "<div class=\"card redips-drag\"><span class=\"jo_eye\"></span><span class=\"jo_eye\"></span><span class=\"jo_mouth circle\"></span></div>";
      }else {
        tileHtml = "<div class=\"card redips-drag\"><span class=\""+obj.color+" circle\">"+obj.score+"</span></div>";
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
          talbeHtml += "<td>";
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

          if($(this).children("div").children("span").html() == "") {
            var tile = new Tile("30", "red", true);
            tableObj.push(tile);
          }else {
            var score = $(this).children("div").children("span").html();
            var color = $(this).children("div").children("span").attr("class").replace(" circle","");
            var tile = new Tile(score, color, false);
            tableObj.push(tile);
          }

        }

      }).get();
    }).get();

    return tableObj;
  },

  introBoard: function() {
      Game.settingTile("#gameBoard", new Tile("R", "red", false), 1, 3);
      Game.settingTile("#gameBoard", new Tile("U", "red", false), 1, 4);
      Game.settingTile("#gameBoard", new Tile("M", "red", false), 1, 5);
      Game.settingTile("#gameBoard", new Tile("30", "red", true), 1, 6);
      Game.settingTile("#gameBoard", new Tile("Y", "red", false), 1, 7);

      Game.settingTile("#gameBoard", new Tile("C", "blue", false), 2, 7);
      Game.settingTile("#gameBoard", new Tile("U", "yellow", false), 2, 8);
      Game.settingTile("#gameBoard", new Tile("B", "black", false), 2, 9);
      Game.settingTile("#gameBoard", new Tile("E", "red", false), 2, 10);
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
    
    //REDIPS.drag.init(); //처음부터 블럭 움직이지 못하도록 초기화 하지 않음
    REDIPS.drag.dropMode = 'single';

    //REDIPS Dropped Event
    REDIPS.drag.event.dropped = function () {
      var boardSerializeMap = Game.serializeTable("#gameBoard");
      //console.log(JSON.stringify(boardSerializeMap));
      var requestObject = UTIL.makeCommand(CMD.SYNC, boardSerializeMap);

      console.log("REQUEST CMD : " + requestObject.command);
      console.log("REQUEST PARAM : " + requestObject.param);
      ws.send(JSON.stringify(requestObject));
    };
  },

  enableDrag: function(cssName, isEnable) {
    REDIPS.drag.init();

    // make it a unmovable
    //REDIPS.drag.enableDrag(false, rd.obj);

    // disable tables with class name 'mini'
    REDIPS.drag.enableTable(isEnable, cssName);
  }

};