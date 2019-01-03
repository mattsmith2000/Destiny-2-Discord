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

//Takes the input platform name and returns it's associated bungie API platform number. Platform number is used in the player profile lookup. 
function platNametoNum(name){
	var num = null;
	if(name == "XBOX"){
		num = 1;
	}
	if(name == "PSN"){
		num = 2;
	}
	if(name == "PC"){
		num = 4;
	}
	return num;
}

function getActivityName(hash){
	var activity = "";
	//code for orbit. This hash is not in the manifest and will cause an error if looked up. 
	if(hash == "82913930"){
		return "Orbit";
	}
	try{
		var fs = require("fs");
		var contents = fs.readFileSync('./manifest_defs/DestinyActivityDefinition.json'); 
		var jman = JSON.parse(contents);
		//actName= jman[hash].displayProperties.name;
		var actName= jman[hash];
		var placeName = getPlaceName(actName.placeHash);
		var typeName = getActivityTypeName(actName.activityTypeHash);
		activity = typeName + ", " + placeName;
	}
	catch(err){
		console.log("Error reading DestinyActivityDefinition.json");
		activity = null;
	}
	finally{
		return activity;
	}
}

//Takes the input Place hash and returns the associated name
function getPlaceName(hash){
	var placeName = "";
	try{
		var fs = require("fs");
		var contents = fs.readFileSync('./manifest_defs/DestinyPlaceDefinition.json'); 
		var jman = JSON.parse(contents);
		placeName = jman[hash].displayProperties.name;
	}
	catch(err){
		console.log("Error reading DestinyPlaceDefinition.json");
		placeName = null;
	}
	finally{
		return placeName;
	}
}

//Takes the input ActivityType hash and returns the associated name
function getActivityTypeName(hash){
	var typeName = "";
	try{
		var fs = require("fs");
		var contents = fs.readFileSync('./manifest_defs/DestinyActivityTypeDefinition.json'); 
		var jman = JSON.parse(contents);
		typeName = jman[hash].displayProperties.name;
	}
	catch(err){
		console.log("Error reading DestinyActivityTypeDefinition.json");
		typeName = null;
	}
	finally{
		return typeName;
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


//Searches player by name and returns memebershipId
function searchPlayer(playerName, platform){
	//creating request object
	var rp = require('request-promise');
	var key = "bd47705b6cf646abb77dea7a070451ed";
	var number = platNametoNum(platform);
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
		console.log("");
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
module.exports.updateStatus = updateStatus;
module.exports.searchPlayer = searchPlayer;
module.exports.searchProfile = searchProfile;
module.exports.currentCharacter = currentCharacter;
module.exports.getPlaceName = getPlaceName;
module.exports.getActivityTypeName = getActivityTypeName;