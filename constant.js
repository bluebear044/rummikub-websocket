//constant
var BOARD = {
	WIDTH : 15,
	HEIGHT : 6,
	OWN_WIDTH : 15,
	OWN_HEIGHT : 2
}

var CMD = {
	CHAT : "::CHAT::",
	JOIN : "::JOIN::",
	SYNC : "::SYNC::",
	START : "::START::", 
	TURN : "::TURN::", 
	EXIT : "::EXIT::",
	INFO : "::INFO::",
	PRIVATE_INFO : "::PRIVATE_INFO::"
};

var MESSAGE = {
	MSG_START : "게임이 시작되었습니다.",
	MSG_EXIT : "게임이 종료되었습니다.",
	MSG_TURN : "{0} 님이 턴을 종료하였습니다.",
	MSG_NEXT_TURN : "{0} 님 차례 입니다.",
	MSG_JOIN : "{0} 님이 입장하셨습니다.",
	MSG_DISCONNECT : "{0} 님이 나가셨습니다.",
	MSG_CLIENT_COUNT : "{0}명 접속중",
	MSG_TURN_COUNT : "{0}번째 턴",
	MSG_GAME_READY : "현재 게임 준비중",
	MSG_GAME_PLAYING : "현재 게임 진행중",
	MSG_MY_INFO : "당신은 {0} 입니다."
};

var UTIL = {

	makeCommand: function(command, param) {
        return { 
            "command" : command, 
            "param" : param
        };
    },

	getMessage: function(msg, param) {

		if(param != null) {
			return msg.replace("{0}", param);
		}

		return msg;
    },

    printNowDate: function() {
        now = new Date();
        year = "" + now.getFullYear();
        month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
        day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
        hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
        minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
        second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
        return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
    },

    random4digit: function() {
    	return Math.floor(Math.random()*9000) + 1000;
    }
}