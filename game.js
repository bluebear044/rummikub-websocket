var host = location.origin.replace(/^http/, 'ws')
//var host = "ws://desolate-wave-36629.herokuapp.com/";
//var host = "ws://127.0.0.1:5000";

var Game = {

  webSocketConnect: function() {
    //Websocket Instance
    return new WebSocket(host);
  },

  sendMessage: function(ws) {
      var msg = $( "#msg" ).val();
      console.log(msg);
      ws.send(msg);
      $( "#msg" ).val("");
  },

  startGame: function(ws) {
      console.log("start game!!");
      ws.send(CMD.START);
  },

  nextTurn: function(ws) {
      console.log("nextTurn!!");
      ws.send(CMD.TURN);
  },

  exitGame: function(ws) {
      console.log("exit game!!");
      ws.send(CMD.EXIT);
  },

  processStart: function(responseObject) {
    $( "#exitBtn" ).attr("disabled", false);
  },

  processTurn: function(responseObject) {
    //TODO
    //responseObject를 통해 전달받은 board 타일정보 및 새롭게 전달받은 타일정보를 반영한다.
    $( "#board" ).html("Game View");
  },

  processExit: function(responseObject) {
    $( "#board" ).empty();
  },

  processInfo: function(responseObject, user) {
    $( "#connectCount" ).html(UTIL.getMessage(MESSAGE.MSG_CLIENT_COUNT, responseObject.param.connectCount));

    if(responseObject.param.gamePlayingFlag == true ) {
      $( "#gamePlaying" ).html(MESSAGE.MSG_GAME_PLAYING);
      $( "#turnCount" ).html(UTIL.getMessage(MESSAGE.MSG_TURN_COUNT, responseObject.param.turnCount));
    }else {
      $( "#gamePlaying" ).html(MESSAGE.MSG_GAME_READY);
      $( "#turnCount" ).empty();
    }

    //Active/Deactive start button
    if(responseObject.param.connectCount > 1 && responseObject.param.gamePlayingFlag == false) {
      $( "#startBtn" ).attr("disabled", false);
    }else {
      $( "#startBtn" ).attr("disabled", true);
    }

    //Active/Deactive exit button
    if(responseObject.param.gamePlayingFlag == false) {
      $( "#exitBtn" ).attr("disabled", true);
    }else {
      $( "#exitBtn" ).attr("disabled", false);
    }

    //Active/Deactive turn button
    console.log(responseObject.param.currentPlayerID);
    if(user.id == responseObject.param.currentPlayerID && responseObject.param.gamePlayingFlag == true) {
      $( "#turnBtn" ).attr("disabled", false);
    }else {
      $( "#turnBtn" ).attr("disabled", true);
    }
  },

  processPrivateInfo: function(responseObject, user) {
    console.log("private info received : " + responseObject);
    user.id = responseObject.param.id;
    user.registerYN = responseObject.param.registerYN;
    user.use = responseObject.param.use;
    user.own = responseObject.param.own;

    $( "#own" ).html(JSON.stringify(user.own));
    $( "#myInfo" ).html(UTIL.getMessage(MESSAGE.MSG_MY_INFO, user.id));
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

          if($(this).children("span").attr("class") == "jo_eye") {
            var tile = new Tile("30", "red", true);
            tableObj.push(tile);
          }else {
            var score = $(this).children("div").children("span").attr("class").replace(" circle","");
            var color = $(this).children("div").children("span").html();
            var isJoker = false;
            var tile = new Tile(score, color, isJoker);
            tableObj.push(tile);
          }
        }

      }).get();
    }).get();

    return tableObj;
  }

};