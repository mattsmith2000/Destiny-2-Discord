var d2rp = require("./D2RP.js");
var membership = null;
var platform;

//test runs the program
function testRun(){
	if(membership == null){
		console.log("Checking for updates...");
		d2rp.updateManifest(function callback(updateTime){
			if(updateTime != ""){
				d2rp.saveUpdateTime(updateTime, function callback2(){
					promptInfo();
				});
			}
			else{
				promptInfo();
			}
			
		});
		
	}
	else{
		getProfile();
	}
}
testRun();

function getMembership(name){
	var prom1 = d2rp.searchPlayer(name, platform);
	if(prom1 != null){
		prom1.then(function(result){
			membership = result.Response['0'].membershipId;
			//once membership is aquired, getProfile is called
			getProfile();
		})
		.catch(function(err){
			console.log("\n---------------------------------------------------------------------------------\nERROR: Could not retreive your profile from Bungie API. Double check your inputs.\n---------------------------------------------------------------------------------");
			promptInfo();
		});
	}
}


function getProfile(){
	var prom2 = d2rp.searchProfile(membership, platform);
	prom2.then(function(result){
		//sends result to currentCharacter to get the characterId for the most recently played character
		var charNum = d2rp.currentCharacter(result);
		if(result.Response.characterActivities.data[charNum].currentActivityHash ==0){
	   		console.log("\n---------------------------------------------------------------\nERROR: You are not signed in. Sign in then reinput information.\n---------------------------------------------------------------\n");	
	   		promptInfo();
		}  
	   	else{
			//using the number recieved, the values for the most recent character are taken from the result object and stored in variables
			var light = result.Response.characters.data[charNum].light;
		   	var classNum = result.Response.characters.data[charNum].classType;
		   	//converts classNum into it's corresponding name
		   	var pClass = d2rp.className(classNum);
		   	//get Activty Name and ACtivity Mode Name based upon data received in result
			var ActName = d2rp.getActivityName(result.Response.characterActivities.data[charNum].currentActivityHash);
			console.log(platform + ": " +light + ' ' + pClass, ActName);
		   	//update discord 
		   	d2rp.updateStatus(ActName, platform + ": " +light + ' ' + pClass); 
		   	//updates status every 30 seconds
		   	setTimeout(function(){
		   		testRun();
		   	}, 30000);
	   }
	})
	.catch(function(err){
		console.log("ERROR: Failed to contact Bungie API. Close program and try again a bit later");
	});
}

function promptInfo(){
	console.log("What platform are you on? \n   -PSN \n   -Xbox \n   -PC");
	var prompt = require('prompt');
	prompt.start();
	prompt.get([{
	    name: 'platform',
	    type: 'string',
	    required: true,
	    message: 'Please enter a valid platform',
  	 	conform: function(input) {
      		var lcInput = input.toUpperCase();
      		return (lcInput== 'PSN' || lcInput == 'XBOX' || lcInput == 'PC');
    	}
  	}], function(err, results) {
    		//global platform name is set
    		platform = results.platform.toUpperCase();
    		console.log("\nWhat's your gamertag?");
    		//if platform is PC this path is followed
    		if(platform == 'PC'){
    			console.log('   Note- PC players must include "#" between their gamertag and unique identifier');
    			//prompt for PC
    			prompt.get([{
    				name: 'gamertag',
    				type: 'string',
    				message: 'Invalid username, check for mistakes',
    				pattern: /^[a-zA-Z0-9\s\#_-]+$/
    			}], function (err, result) {
	   				var gamertag = result.gamertag;
	   				//one prompt completes, it calls getMembership
	   				getMembership(gamertag);
				});

    		}
    		//if platform is console this path is followed
    		else{
    			//prompt for console
    			prompt.get([{
    				name: 'gamertag',
    				type: 'string',
    				message: 'Invalid username, check for mistakes',
    				pattern: /^[a-zA-Z0-9\s\_-]+$/
    			}], function (err, result) {
	   				var gamertag = result.gamertag;
	   				//once prompt completes, it calls getMembership;
	   				getMembership(gamertag);
				});
    		}
  		});
}

