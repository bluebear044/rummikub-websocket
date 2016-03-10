var Sound = {

	initialize: function() {

		var filePath = "./sound/";
		var effectNameArr = ["cardPlace"
							 ,"chat"
							 ,"bell"
							 ,"alert"
							];

		for(var idx in effectNameArr){
			var audioElement = document.createElement("audio");
			var sourceElement = document.createElement("source");

			sourceElement.src = filePath + effectNameArr[idx] + ".mp3";
			sourceElement.type = "audio/mpeg";

			document.body.appendChild(audioElement);

			audioElement.setAttribute("id", effectNameArr[idx]);
			audioElement.appendChild(sourceElement);
		}

	},

	playEffect: function(id) {

		var hitSound = new Audio();
		hitSound = document.getElementById(id); 
		hitSound.currentTime = 0;
		hitSound.play();  

	}

};
