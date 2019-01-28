//define globals
const client = require('discord-rich-presence')('493136625459527711');

function updateManifest(callback){
	var webDate = "";
	//step 1: read file for last time manifest was updated
	var http = require('https');
	var fs = require("fs");
	var contents = fs.readFileSync('./manifest_defs/lastUpdated.json'); 
	var jman = JSON.parse(contents);
	var myDate = jman.lastUpdated;
	//console.log(jman.lastUpdated);
  	//step 2: check the web page to see the last time it was updated
  	const rp = require('request-promise');
	const url = 'https://destiny.plumbing/';
	rp(url)
  	.then(function(html){
    	var content = JSON.parse(html);
    	webDate = content.lastUpdated;
    	//console.log(content.lastUpdated);

    	//Step 3: Check difference in dates
		if(webDate>myDate){
	 		console.log("Updating...");
	 		var file1 = fs.createWriteStream("./manifest_defs/DestinyActivityDefinition.json");
			var request1 = http.get("https://destiny.plumbing/en/raw/DestinyActivityDefinition.json", function(response1) {
			  	response1.pipe(file1);
			  	var file2 = fs.createWriteStream("./manifest_defs/DestinyActivityTypeDefinition.json");
			 	var request2 = http.get("https://destiny.plumbing/en/raw/DestinyActivityTypeDefinition.json", function(response2) {
			 		response2.pipe(file2);
					var file3 = fs.createWriteStream("./manifest_defs/DestinyPlaceDefinition.json");
					var request3 = http.get("https://destiny.plumbing/en/raw/DestinyPlaceDefinition.json", function(response3) {
			  			response3.pipe(file3);
						callback(webDate);
					});
				});
			});
	 	}
	 	else{
	 		webDate = "";
	 		console.log("No updates\n");
	 		callback(webDate);
	 	}
	})
  	.catch(function(err){
    	console.log("Error while checking for updates");
    });
}

function saveUpdateTime(time, callback){
	const fs = require('fs');
	fs.writeFile("./manifest_defs/lastUpdated.json", '{"lastUpdated": "' +time +'"}', function(err) {
    	if(err){
        	return console.log(err);
   	 	}	
	console.log("Update Complete\n");
	callback();
	}); 
}

function saveAccountInfo(platform, membership){
	const fs = require('fs');
	try{
		fs.writeFile("./manifest_defs/account.json", '{"platform": "' + platform+'", "membership": "' + membership+'"}', function(err) {
	    	if(err){
	        	return console.log(err);
	   	 	}	
		});
	}
	catch(err){
		console.log("Error saving account info");
	} 
}

function getAccountInfo(){
	const fs = require('fs');
	try{
		var contents = fs.readFileSync('./manifest_defs/account.json'); 
		var json = JSON.parse(contents);
		
		if(json.platform == ""){
			return [false, json];
		}
		else{
			return [true, json];
		}
	}
	catch(err){
		console.log("Error loading account info");
	}
}

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
		//check to see if place and type have the same name, if so only typeName is set
		if(placeName == typeName){
			activity = placeName;
		}
		else{
			activity = typeName + ", " + placeName;
		}
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
	//console.log('https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/' + number + '/' + playerName +'/');
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
function searchProfile(membershipId, platform){
	var number = platNametoNum(platform);
	var rp = require('request-promise');
	var key = "bd47705b6cf646abb77dea7a070451ed";
	var options = {
  		url: 'https://www.bungie.net/Platform/Destiny2/'+ number +'/Profile/' + membershipId +'/?components=200,204',
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
module.exports.updateManifest =  updateManifest;
module.exports.saveUpdateTime = saveUpdateTime;
module.exports.saveAccountInfo = saveAccountInfo;
module.exports.getAccountInfo = getAccountInfo;