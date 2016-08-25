var twitter = require('twitter');
var promise = require('bluebird');

// Client for twitter (promisified)
var client = promise.promisifyAll(new twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET
}));
// User id
var user_id = process.env.USER_ID || '767430650202845186';
// Thanking message
var thanksMessage = process.env.MESSAGE || ', thanks! Please follow me back!';

// Log bugs
process.on('unhandledRejection', console.log);

/*
**  Variables
*/

// Contains the list the (bot) user is following 
var followingList = new Array();

/*
**  Util Functions
*/

/*
**  Check relationship with users
**  If user is not being followed, it will follow and tweet to that user
*/
async function checkRelationship(target_id, user_name){
  console.log("Checking relationship with user: " + user_name);
  if (followingList.indexOf(target_id) > -1) return false;
  let options = {
    source_id : user_id,
    target_id : target_id
  }
  let response = await client.getAsync('friendships/show', options);
  if (! response.relationship.source.following){
    followAndTweet(target_id, response.relationship.target.screen_name, user_name);
  } else {
    followingList.push(target_id);
  }
}

/*
**  Follow and tweet to users
*/
async function followAndTweet(target_id, screen_name, user_name){
  console.log("Following and tweeting to " + user_name);
  // Tweet
  let message = "@" + screen_name + thanksMessage;
  let options = {
    status : message
  }
  let response = await client.postAsync('statuses/update', options);
  // Follow
  options = {
    follow : true,
    user_id : target_id
  };
  response = await client.postAsync('friendships/create', options);
  followingList.push(target_id);
}

/*
**  Streaming functions
*/

client.stream('user', function(stream){
  stream.on('favorite', function(favorite){
    console.log("A user has liked one of our tweets!");
    checkRelationship(favorite.source.id_str, favorite.source.name);
  });
 
  stream.on('error', function(error) {
    console.log(error);
  });
});

client.stream('statuses/filter', {follow: user_id}, function(stream) {
  stream.on('data', function(event) {
    if (event.retweeted_status){
      if (event.retweeted_status.user.id_str != event.user.id_str){
        console.log("A user has retweeted one of our tweets!");
        checkRelationship(event.user.id_str, event.user.name);
      }
    }
  });
 
  stream.on('error', function(error) {
    console.log(error);
  });
});

console.log("Bot has started!");