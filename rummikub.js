//Rummikub class
function Rummikub () {
	this.scores = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
	this.colors = ['red','blue','yellow','black','red','blue','yellow','black'];
	this.tiles = [];
	this.users = [];
}

Rummikub.prototype.shuffle = function(o) {
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
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
	this.tiles.push(new Tile('30', 'black', true));

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

//User class
function User (id, ownWebsocket) {
	this.ownWebsocket = ownWebsocket; // each users websocket
	this.id = id;
	this.registerYN = false;
	this.use = [];
	this.own = [];
}

User.prototype.toString = function(id) {
	return "id : " + this.id
	+ " registerYN : " + this.registerYN 
	+ " use : " + JSON.stringify(this.use) 
	+ " own : " + JSON.stringify(this.own);
};

//Tile class
function Tile (score, color, isJoker) {
	this.score = score;
	this.color = color;
	this.isJoker = isJoker;
}