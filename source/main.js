var d2rp = require("./D2RP.js");
var membership = null;

//test runs the program
function testRun(){
	var cValues = d2rp.readConfig();
	
	if(membership == null && cValues != null){
		var prom1 = d2rp.searchPlayer(cValues[1], cValues[0]);
		if(prom1 != null){
			prom1.then(function(result){
				membership = result.Response['0'].membershipId;
				getProfile();
			})
			.catch(function(err){
				console.log("ERROR: Could not retreive your profile from Bungie API. Check config.ini settings");
			});
		}
	}
	else{
		//console.log("good loop");
		getProfile();
	}
}
testRun();

function getProfile(){
	var prom2 = d2rp.searchProfile(membership);
	prom2.then(function(result){
		//console.log(result);
		//sends result to currentCharacter to get the characterId for the most recently played character
		var charNum = d2rp.currentCharacter(result);
		if(result.Response.characterActivities.data[charNum].currentActivityHash ==0){
	   		console.log("You are not signed in. Sign in then reopen D2RP");	
		}
	   	else{
			//using the number recieved, the values for the most recent character are taken from the result object and stored in variables
			var light = result.Response.characters.data[charNum].light;
		   	var classNum = result.Response.characters.data[charNum].classType;
		   	//converts classNum into it's corresponding name
		   	var pClass = d2rp.className(classNum);
		   	//get Activty Name and ACtivity Mode Name based upon data received in result
			var ActName = d2rp.getActivityName(result.Response.characterActivities.data[charNum].currentActivityHash);
		   	var ActModeName = d2rp.getActivityModeName(result.Response.characterActivities.data[charNum].currentActivityModeHash);
		   	console.log(ActModeName + ' ' + ActName + ' ' +light + ' ' + pClass);
		   	//update discord 
		   	d2rp.updateStatus(ActModeName + ' ' + ActName, light + ' ' + pClass); 
		   	setTimeout(function(){
		   		testRun();
		   	}, 30000);
	   }
	})
	.catch(function(err){
		console.log("ERROR: Failed to contact Bungie API");

	});
}

