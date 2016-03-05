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
};

Rummikub.prototype.initializeTiles = function() {
	
	//init
	this.tiles = [];

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
  		user.own.push(this.tiles.pop());
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
  		penaltyTile.push(this.tiles.pop());
	}

	return penaltyTile;
};

Rummikub.prototype.validateTile = function(param) {

	var group = [];
      
	for(var idx in param) {

		if(param[idx] != null) {

		  group.push(param[idx]);

		  if(group.length < 3) {
		    continue;
		  }

		  console.log("\n\n\n========= group info ========");
		  console.log(group);
		  console.log("=============================");

		  var serialNumberValidateResult = this.validateSerialNumber(group);
		  var sameNumverValidateResult = this.validateSameNumber(group);

		  console.log("\ncheck serialNumberValidateResult ---->  " + serialNumberValidateResult);
		  console.log("check sameNumverValidateResult ----> " + sameNumverValidateResult);

		  if(serialNumberValidateResult || sameNumverValidateResult) {
		    //console.log("success");
		    continue;
		  }else {
		    
		    //루미큐브 조건을 모두 통과하지 못한 경우에는 타일이 연속된 경우일 수도 있기 때문에
		    //새롭게 루미큐브 조건을 검사하기 위해 마지막 타일만 남기고 그룹을 초기화 한다
		    //이때 사용되지 않은 조커블럭은 그대로 놔둔다.
		    //[로직]
		    //1. group내의 joker 위치가 마지막 타일을 제외하고, 그룹 뒷 부분에 위치하고 있는지 파악한다.
		    //2. joker 타일을 제외하고 앞에 그룹타일이 타일3개 이상인지 확인한다. (joker가 사용되었는지 여부를 판단하기 위함)
		    //3. 타일3개가 안되면 사용된 joker이므로 해당 joker는 group에서 제거한다.

		    //마지막 타일을 제외한 타일들에 대해 사용가능한 joker 뽑아냄
		    var cloneGroup = this.clone(group);
		    var jokerGroup = [];
		    cloneGroup = cloneGroup.splice(0, cloneGroup.length-1);

		    for(var i=0; i<cloneGroup.length; i++) {

		      var tile = cloneGroup.pop();
		      if(tile.isJoker) {
		        if(cloneGroup.length >= 3) {
		          jokerGroup.push(tile);
		        }
		      }else {
		        break;
		      }

		    }

		    //마지막 타일과 위애서 뽑아낸 joker그룹을 합침
		    group = jokerGroup.concat(group.splice(group.length-1, 1));
		    //console.log(group);

		  }

		}else {

		  if(group.length != 0 && group.length < 3) {
		    return false;
		  }
		  //공백이 중간에 나오는 경우 Group 초기화
		  group = [];

		}
	}

    return true;

};

Rummikub.prototype.validateSerialNumber = function(param) {

  //clone param
  var group = this.clone(param);

  //Joker Logic
  for(var idx in group) {

    if(group[idx].isJoker == true) {

      if(group[Number(idx)-1] != null) {
        group[idx] = new Tile(Number(group[Number(idx)-1].score)+1, group[Number(idx)-1].color, false);
      }else {
        group[idx] = new Tile(Number(group[Number(idx)+1].score)-1, group[Number(idx)+1].color, false);
      }
      
    }

  }

  console.log("\nvalidateSerialNumber after joker");
  console.log(group);

  var colorSet = new Set();

  //Check Serial Number
  for(var idx in group) {

    if(group[Number(idx)+1] != null) {
      if(group[Number(idx)+1].score != Number(group[idx].score)+1) {
        return false;
      }else {
        colorSet.add(group[idx].color);
      }
    }

  }

  //Check Same Color
  if(colorSet.size == 1) {
    return true;
  }else {
    return false;
  }

}

Rummikub.prototype.validateSameNumber = function(param) {

  //clone param
  var group = this.clone(param);

  //Joker Logic
  for(var idx in group) {

    if(group[idx].isJoker == true) {

      if(group[Number(idx)-1] != null) {
        group[idx] = new Tile(group[Number(idx)-1].score, "colorless", false);
      }else {
        group[idx] = new Tile(group[Number(idx)+1].score, "colorless", false);
      }
      
    }

  }

  console.log("\nvalidateSameNumber after joker");
  console.log(group);

  var colorSet = new Set();
  var colorSetNotDuplicated = new Array();
  var scoreSet = new Set();

  for(var idx in group) {
    if(group[idx].color != "colorless") {
      colorSet.add(group[idx].color);
      colorSetNotDuplicated.push(group[idx].color);
    }
    scoreSet.add(group[idx].score);
  }

  //Check Same Number & Different Color
  if( colorSet.size == colorSetNotDuplicated.length && 
      scoreSet.size == 1) {
    return true;
  }else {
    return false;
  }

}

Rummikub.prototype.clone = function(obj) {

	// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;

	// Handle Date
	if (obj instanceof Date) {
		var copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}

	// Handle Array
	if (obj instanceof Array) {
		var copy = [];
		for (var i = 0, len = obj.length; i < len; i++) {
		  copy[i] = this.clone(obj[i]);
		}
		return copy;
	}

	// Handle Object
	if (obj instanceof Object) {
		var copy = {};
		for (var attr in obj) {
		  if (obj.hasOwnProperty(attr)) copy[attr] = this.clone(obj[attr]);
		}
		return copy;
	}

	throw new Error("Unable to copy obj! Its type isn't supported.");
};

//User class
function User (id, ownWebsocket, chatColor) {
	this.ownWebsocket = ownWebsocket; // each users websocket
	this.id = id;
	this.registerYN = false;
	this.use = [];
	this.own = [];
	this.chatColor = chatColor;
}	

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

User.prototype.validateRegisterTile = function() {

	if(this.use.length < 3) {
		return false
	}
	
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