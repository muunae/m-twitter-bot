var twitter = require('twitter');
var promise = require('bluebird');

// Client for twitter
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
// Tweet id
var tweet_id = process.env.TWEET_ID || '';

// Log bugs
process.on('unhandledRejection', console.log);

/*
**  Variables
*/

// Contains the list to follow and tweet
var toFollowList = new Array();

// Contains the list to just tweet
var toTweetList = new Array();

// Contains the list to check relationships
var checkRelationshipList = new Array();

// Contains the list of users tweeted
var tweeted = new Array();

// Contains the list the (bot) user is following 
var followingList = new Array();

/* 
**  Functions and program
*/

// Find retweeters and push them to checkRelationshipList
async function findRetweeters(){
  console.log("Looking for retweeters!");
  let options = {
    id : tweet_id
  };
  let response = await client.getAsync('statuses/retweeters/ids', options);
  for (let i = 0; i<response.ids.length; i++){
    if ((!followingList.indexOf(response.ids[i]) > -1) || (! checkRelationshipList.indexOf(response.ids[i]) ) || (! tweeted.indexOf(response.ids[i]) )) {
      checkRelationshipList.push(response.ids[i]);
    }
  }
}

// Check relationship of users and push them to toFollowList / toTweetList
async function checkRelationship(){
  console.log("Checking relationships!");
  for (let i = 0; i<checkRelationshipList.length; i++){
    let options = {
      source_id : user_id,
      target_id : checkRelationshipList[i]
    }
    let response = await client.getAsync('friendships/show', options);
    if (! response.relationship.source.following){
      toFollowList.push(checkRelationshipList[i]);
      toTweetList.push(response.relationship.target.screen_name);
    }
  }
  checkRelationshipList = new Array();
}

// Follow users
async function followUsers(){
  console.log("Following users!");
  for (let i = 0; i<toFollowList.length; i++){
    let options = {
      follow : true,
      user_id : toFollowList[i]
    };
    let response = await client.postAsync('friendships/create', options);
    followingList.push(toFollowList[i]);
  }
}

// Tweet thanking users
async function tweetThankingUsers(){
  console.log("Thanking users (Tweeting)!");
  for (let i = 0; i<toTweetList.length; i++){
    let message = "@" + toTweetList[i] + thanksMessage;
    let options = {
      status : message
    }
    let response = await client.postAsync('statuses/update', options);
    tweeted.push(toTweetList[i]);
  }
}

// Starting function for bot
async function startingFunction(){
  if (thanksMessage.length > 124){
    console.log("Message bigger than 124 characters!");
    console.log("Aborting.");
    return false;
  }
  await findRetweeters();
  await checkRelationship();
  await followUsers();
  await tweetThankingUsers();
}

startingFunction();