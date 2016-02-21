function Game (){
  //..
}

Game.prototype.sendMessage = function(ws) {
  var msg = $( "#msg" ).val();
  console.log(msg);
  ws.send(msg);
  $( "#msg" ).val("");
};

Game.prototype.startGame = function(ws) {
  console.log("start game!!");
  ws.send(CMD.START);
};

Game.prototype.nextTurn = function(ws) {
  console.log("nextTurn!!");
  ws.send(CMD.TURN);
};

Game.prototype.exitGame = function(ws) {
  console.log("exit game!!");
  ws.send(CMD.EXIT);
};

Game.prototype.processStart = function(responseObject) {
  $( "#exitBtn" ).attr("disabled", false);
};

Game.prototype.processTurn = function(responseObject) {
  //TODO
  //responseObject를 통해 전달받은 board 타일정보 및 새롭게 전달받은 타일정보를 반영한다.
  $( "#board" ).html("Game View");
};

Game.prototype.processExit = function(responseObject) {
  $( "#board" ).empty();
};

Game.prototype.processInfo = function(responseObject, user) {
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
};

Game.prototype.processPrivateInfo = function(responseObject, user) {
  console.log("private info received : " + responseObject);
  user.id = responseObject.param.id;
  user.registerYN = responseObject.param.registerYN;
  user.use = responseObject.param.use;
  user.own = responseObject.param.own;

  $( "#own" ).html(JSON.stringify(user.own));
  $( "#myInfo" ).html(UTIL.getMessage(MESSAGE.MSG_MY_INFO, user.id));
};