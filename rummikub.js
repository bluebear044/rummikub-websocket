//Rummikub class
function Rummikub () {
	this.scores = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
	this.colors = ['red','blue','yellow','black','red','blue','yellow','black'];
	this.tiles = [];
	this.users = [];
}

Rummikub.prototype.shuffle = function(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
};

Rummikub.prototype.initializeGame = function() {
	
	this.initializeTiles();

	for(var idx in this.users) {
  		this.initializeTilesToUser(this.users[idx]);
	}
}

Rummikub.prototype.initializeTiles = function() {
	for(var i in this.colors) {
	  for(var j in this.scores) {
	  	this.tiles.push(new Tile(this.scores[j], this.colors[i], false));
	  }
	}
	// add joker tiles
	this.tiles.push(new Tile('30', 'red', true));
	this.tiles.push(new Tile('30', 'red', true));

	this.shuffle(this.tiles);
};

Rummikub.prototype.initializeTilesToUser = function(user) {
	user.own = [];
	for(var idx=0; idx < 14; idx++) {
  		user.own[idx] = this.tiles.pop();
	}
};

Rummikub.prototype.removeUser = function(id) {

	var removeIndex;

	for(var idx in this.users) {
		if(id == this.users[idx].id) {
			removeIndex = idx;
			break;
		}
	}
	
	this.users.splice(removeIndex,1);
};

Rummikub.prototype.penaltyTile = function(numberOfPenaltyTile) {

	var penaltyTile = [];
	for(var idx=0; idx < numberOfPenaltyTile; idx++) {
  		penaltyTile[idx] = this.tiles.pop();
	}

	return penaltyTile;
};

//User class
function User (id, ownWebsocket) {
	this.ownWebsocket = ownWebsocket; // each users websocket
	this.id = id;
	this.registerYN = false;
	this.use = [];
	this.own = [];
}

User.prototype.addUseTile = function(tile) {
	this.use.push(tile);
};

User.prototype.removeOwnTile = function(tile) {

	var removeIndex;

	for(var idx in this.own) {
		if(	tile.score == this.own[idx].score &&
			tile.color == this.own[idx].color &&
			tile.isJoker == this.own[idx].isJoker) {
			removeIndex = idx;
			break;
		}
	}
	
	this.own.splice(removeIndex,1);

};

User.prototype.validateTile = function() {

	return true;

	//gameBoard에 위치한 타일들에 대해 검사 로직
	/*
	function validationRule(set) {

		console.log("**** validation start ****");

		// Minimum count of set validation
		if(set.length < 3 ) return false;

		var colorSet = new Set();
		var scoreSet = new Set();

		for(var idx in set) {
	  colorSet.add(set[idx].color);
	  scoreSet.add(set[idx].score);
		}

		console.log(colorSet);
		console.log(scoreSet);

		//색이 모두 같은 경우
		if(colorSet.size == 1) {

	  //연속된 숫자인지 검사
	  for (value of scoreSet.values()) {
	  console.log(value);
	  }
	  //TODO
	  return true;
	  
		}else {
	  //같은 숫자인지 검사
	  if(scoreSet.size == 1) {
	  return true;
	  }
		}

		console.log("**** validation end ****");

		return false;

	}*/

};

User.prototype.validateRegisterTile = function() {
	
	var sumOfScore = 0;
	for(var idx in this.use) {
		sumOfScore += Number(this.use[idx].score);
	}

	return (sumOfScore >= 30) ? true : false;

};

User.prototype.toString = function() {
	return "id : " + this.id
	+ " registerYN : " + this.registerYN 
	+ " use : " + JSON.stringify(this.use) 
	+ " own : " + JSON.stringify(this.own);
};

//Tile class
function Tile (score, color, isJoker, isOwn) {
	this.score = score;
	this.color = color;
	this.isJoker = isJoker;
	this.isOwn = isOwn;
}