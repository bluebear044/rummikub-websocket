//constant
var CMD = {
	START : "::START::", 
	TURN : "::TURN::", 
	EXIT : "::EXIT::",
	INFO : "::INFO::"
};

var MESSAGE = {
	MSG_START : "게임이 시작되었습니다.",
	MSG_EXIT : "게임이 종료되었습니다.",
	MSG_TURN : " 님이 턴을 종료하였습니다.",
	MSG_JOIN : " 님이 입장하셨습니다.",
	MSG_DISCONNECT : " 님이 나가셨습니다.",
	MSG_CLIENT_COUNT : "현재 {0}명 접속중",
	MSG_GAME_READY : "현재 게임 준비중",
	MSG_GAME_PLAYING : "현재 게임 진행중"
};

var UTIL = {
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