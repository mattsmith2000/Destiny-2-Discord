//define globals
const sqlite3 = require('sqlite3').verbose();
const client = require('discord-rich-presence')('493136625459527711');

//take activityId and get information from manifest sqlite database
function getActivityName(activityId, callback){
	let db = new sqlite3.Database('./manifest.sqlite3');
	let query = 'SELECT * FROM DestinyActivityDefinition, json_tree(DestinyActivityDefinition.json, "$") WHERE json_tree.key= "hash" and json_tree.value = ?;';
	//orbit defintion doesnt work so we skip the lookup and manually set it
	if(activityId == '82913930'){
		callback('Orbit');
	}
	else{
		db.get(query, [activityId], (err, row) => {
	 		if (err) {
	    		return console.error(err.message);
	 	 	}
	 		result = JSON.parse(row.json);
	 		callback(result.displayProperties.name);
	 	});
		db.close();
	}
}

function getActivityModeName(activityModeId, callback){
	let db = new sqlite3.Database('./manifest.sqlite3');
	let query = 'SELECT * FROM DestinyActivityModeDefinition, json_tree(DestinyActivityModeDefinition.json, "$") WHERE json_tree.key= "hash" and json_tree.value = ?;';
	//orbit definition doesnt work so we skip the lookup and manually set it
	if(activityModeId == '2166136261'){
		callback('');
	}
	else{
		db.get(query, [activityModeId], (err, row) => {
	 		if (err) {
	    		return console.error(err.message);
	 	 	}
	 		result = JSON.parse(row.json);
	 		callback(result.displayProperties.name);
	 	});
		db.close();
	}	
}



//makes discord show the rich presence 	
function updateStatus(inState, inDetails){
	
		var settings = {
 			state: inState,
  			details: inDetails,
  			largeImageKey: 'd2s'
  		};
 
 		client.updatePresence(settings);	
		
		setTimeout(function() {
    
     testRun();
     }, 30000);
}


//test runs the program
function testRun(){
	
	var cValues = readConfig();
	//callback1
	searchPlayer(cValues[1], cValues[0], function callback(error, response, body){
		result = JSON.parse(body);
		membership = result.Response['0'].membershipId;
		//console.log(membership);
	
		//callback2
		getPlayerProfile(membership, function callback(error, response, body) {
	  		if (!error && response.statusCode == 200) {
	   			result = JSON.parse(body);
	   			//getdate test code
	   			var charNum = currentCharacter(result);
	   			//console.log(charNum);
	   			//end of getdate test code
	   			
				//console.log(result.Response.characterActivities.data['2305843009300837896'].currentActivityHash);
	   			//console.log(result.Response.characterActivities.data['2305843009300837896'].currentActivityModeHash);
	   			var light = result.Response.characters.data[charNum].light;
	   			var classNum = result.Response.characters.data[charNum].classType;
	   			
	   			var playerClass = '';
	   			switch(classNum){
	   				case 0:
	   					playerClass = 'Titan';
	   					break;
	   				case 1:
	   					playerClass = 'Hunter';
	   					break;
	   				case 2:
	   					playerClass = 'Warlock';
	   					break;
	   			}
	   			var playerInfo = playerClass + ' ' + light;

	   			var arrResult = [result.Response.characterActivities.data[charNum].currentActivityHash, result.Response.characterActivities.data[charNum].currentActivityModeHash];
	   			//console.log(arrResult);
	   			//callback3
	   				getActivityModeName(arrResult[1], function callback(ActModeName){
	   					//callback4
	   					getActivityName(arrResult[0], function callback(ActName){
	   						console.log(ActModeName + ' ' + ActName + ' ' +light + ' ' + playerClass);
	   						updateStatus(ActModeName + ' ' + ActName, light + ' ' + playerClass); 
	   					});//4
	   				});//3
	   			}
		});//2
	});//1

}
testRun();


function getPlayerId(){
	searchPlayer('HundredGunnr#1295', '4', function callback(error, response, body){
		result = JSON.parse(body);
		membership = result.Response['0'].membershipId;
		console.log(membership);
	});
}
//getPlayerId();

//reads the configuration file and sets variables
function readConfig(){
	var fs = require('fs');
	var lines = [];
	fs.readFileSync('./config.ini').toString().split('\n').forEach(function (line){
		if(!line.includes("//")){
			if(line.includes("membershipType:") || line.includes("displayName:")){
				lines.push(line.replace('\r',''));
			}
		}
	});
	var values = [lines[0].split(":")[1].trim(), lines[1].split(":")[1].trim()];
	//console.log(values);
	return values;
}


//mode 0 is battlenet
//mode 1 is console bros
//implement modes later for different kinds of calls, battlenet first
//Searches player by name and returns memebershipId
function searchPlayer(playerName, number, callback){
	//creating request object
	var request = require('request');
	var key = "bd47705b6cf646abb77dea7a070451ed";
	var options = "";
	
	
	if(number== 1 || number== 2){
		options = {
  			url: 'https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/' + number + '/' + playerName +'/',
  			headers: {
   				'X-API-Key': key
  			}
		};
	}

	if(number== 4){
		var bUser = playerName.split("#");
		options = {
  			url: 'https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/4/' + bUser[0] + '%23' + bUser[1] +'/',
  			headers: {
   				'X-API-Key': key
  			}
		};
	}

 	request(options, callback);
} 	

//gets player profile based on given membershpId
//Profile has activity and activity mode information returned
function getPlayerProfile(membershipId, callback){
	var request = require('request');
	var key = "bd47705b6cf646abb77dea7a070451ed";
	//creating request object
	var options = {
  		url: 'https://www.bungie.net/Platform/Destiny2/4/Profile/' + membershipId +'/?components=100,200,204',
  		headers: {
   			'X-API-Key': key
  		}
	};
 	
	request(options, callback);
 } 	

//checks date/time information for characters returned from API. The most recently played character will be returned
 function currentCharacter(json){
 	var keys = Object.keys(json.Response.characters.data);
 	//console.log(json.Response.characters.data[keys[0]].dateLastPlayed);
 	var len = keys.length;
 	var date1;
 	var date2;
 	var date3;
 	var num;
 	var result;
 	//one character
 	if(len == 1){
 		result = keys[0];
 	}
 	//two characters
 	if(len == 2){
 		date1 = new Date(json.Response.characters.data[keys[0]].dateLastPlayed);
 		date2 = new Date(json.Response.characters.data[keys[1]].dateLastPlayed);
 		
 		if(date1 > date2){
 			result = keys[0];
 		}
 		else{
 			result = keys[1];
 		}
 	}
 	//three characters
 	if(len == 3){
 		date1 = new Date(json.Response.characters.data[keys[0]].dateLastPlayed);
 		date2 = new Date(json.Response.characters.data[keys[1]].dateLastPlayed);
 		date3 = new Date(json.Response.characters.data[keys[2]].dateLastPlayed);

 		if(date1 > date2 && date1 > date3){
 			result = keys[0];
 		} 
 		else if(date2 > date1 && date2 > date3){
 			result = keys[1];
 		}
 		else{
 			result = keys[2];
 		}
 	}
 	
 	return result;
 }

