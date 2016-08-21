var twitter = require('twitter');
var promise = require('bluebird');

var client = new twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET
});

async function findRetweeters(){
	console.log("I've been here.");
  let response = client.get('friends/list');
	console.log("Anything?" + response);
}

// Reads and responds in 5 minutes
function readAndRespond(){
	findRetweeters();

	setTimeout(function(){
		readAndRespond();
  }, 300000);
}

readAndRespond();