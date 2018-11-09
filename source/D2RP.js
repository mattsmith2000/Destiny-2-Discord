//define globals
const client = require('discord-rich-presence')('493136625459527711');

function className(classNum){
	var playerClass = "";
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
	return playerClass;
}

function getActivityName(hash){
	var actName = "";
	//code for orbit. This hash is not in the manifest and will cause an error if looked up. 
	if(hash == "82913930"){
		return "Orbit";
	}
	try{
		var fs = require("fs");
		var contents = fs.readFileSync('./manifest_defs/DestinyActivityDefinition.json'); 
		var jman = JSON.parse(contents);
		actName= jman[hash].displayProperties.name;
	}
	catch(err){
		console.log("Error reading DestinyActivityDefinition.json");
		actName = null;
	}
	finally{
		return actName;
	}
}

function getActivityModeName(hash){
	var actModeName = "";
	//code for null activity. Will return and exit function without executing a lookup as doing so will cause an error. 
	if(hash == "2166136261"){
		return "";
	}
	try{
		var fs = require("fs");
		var contents = fs.readFileSync('./manifest_defs/DestinyActivityModeDefinition.json'); 
		var jman = JSON.parse(contents);
		actModeName = jman[hash].displayProperties.name;
	}
	catch(err){
		console.log("Error reading DestinyActivityModeDefinition.json");
		actModeName = null;
	}
	finally{
		return actModeName;
	}
}


//makes discord show the rich presence. after 30 seconds have passed, updateStatus calls testRun again.  	
function updateStatus(inState, inDetails){
	var settings = {
 		state: inState,
  		details: inDetails,
  		largeImageKey: 'd2s'
  	};
 
 	client.updatePresence(settings);	
}


//reads the configuration file and sets variables
function readConfig(){
	var fs = require('fs');
	var lines = [];
	var values = "";
	try{
		fs.readFileSync('./config.ini').toString().split('\n').forEach(function (line){
			if(!line.includes("//")){
				if(line.includes("membershipType:") || line.includes("displayName:")){
					lines.push(line.replace('\r',''));
				}
			}
		});
		values = [lines[0].split(":")[1].trim(), lines[1].split(":")[1].trim()];
	}
	catch(err){
		console.log("Error reading config.ini");
		values = null;
	}
	finally{
		return values;
	}
}


//Searches player by name and returns memebershipId
function searchPlayer(playerName, number){
	//creating request object
	var rp = require('request-promise');
	var key = "bd47705b6cf646abb77dea7a070451ed";
	
	if(number== 1 || number== 2){
		options = {
  			url: 'https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/' + number + '/' + playerName +'/',
  			headers: {
   				'X-API-Key': key,
   				'User-Agent': 'Request-Promise'
  			},
  			json: true
		};
		return rp(options);
	}

	if(number== 4){
		var bUser = playerName.split("#");
		var options = {
			url: 'https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/4/' + bUser[0] + '%23' + bUser[1] +'/',
			headers: {
				'X-API-Key': key,
				'User-Agent': 'Request-Promise'
			},
			json: true
		};
		return rp(options);
	}
	if(number != 1 && number !=2 && number !=4 ){
		console.log("ERROR: Invalid membershipType in config.ini");
	}


} 	

//gets player profile based on given membershpId
//Profile has activity and activity mode information returned
function searchProfile(membershipId){
	var rp = require('request-promise');
	var key = "bd47705b6cf646abb77dea7a070451ed";
	var options = {
  		url: 'https://www.bungie.net/Platform/Destiny2/4/Profile/' + membershipId +'/?components=200,204',
  		headers: {
   			'X-API-Key': key,
   			'User-Agent': 'Request-Promise'
  		},
  		json: true
	};
 	return rp(options);
 } 	

//checks date/time information for characters returned from API. Compares given dates and returns most recent character ID. 
 function currentCharacter(json){
 	var keys = Object.keys(json.Response.characters.data);
 	var len = keys.length;
 	var date1;
 	var date2;
 	var date3;
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

////EXPORTS
module.exports.className = className;
module.exports.getActivityName = getActivityName;
module.exports.getActivityModeName = getActivityModeName;
module.exports.updateStatus = updateStatus;
module.exports.readConfig = readConfig;
module.exports.searchPlayer = searchPlayer;
module.exports.searchProfile = searchProfile;
module.exports.currentCharacter = currentCharacter;
