const axios = require("axios");
const Twit = require("twit");

// Environment variables for sensitive data
const twitterConsumerKey = "TWITTER_CONSUMER_KEY";
const twitterConsumerSecret = "TWITTER_CONSUMER_SECRET";
const twitterAccessToken = "TWITTER_ACCESS_TOKEN";
const twitterAccessTokenSecret = "TWITTER_ACCESS_TOKEN_SECRET";
const twitterBearerToken = "TWITTER_BEARER_TOKEN";
const openaiApiKey = "OPENAI_API_KEY";

const COMMENT_DELAY = 30 * 60 * 1000; // 30 minutes delay between comments
const MAX_TWEETS = 100;

// Initialize the Twitter API client
const api = new Twit({
  consumer_key: twitterConsumerKey,
  consumer_secret: twitterConsumerSecret,
  access_token: twitterAccessToken,
  access_token_secret: twitterAccessTokenSecret,
  bearer_token: twitterBearerToken,
});

const commentedTweets = new Set();

// Generate a random keyword for tweet search
function getKeyword() {
  const keywords = [
    "thoughts", "journey", "self-discovery", "life", "lessons",
    "selfimprovement", "embracing", "growth", "success", "inspiration",
    "leader", "influencer", "innovation", "insights", "expertise",
    "trends", "opinion", "change", "strategy", "industryinsights",
    "futureof", "technology", "motivational", "culture",
  ];
  return keywords[Math.floor(Math.random() * keywords.length)];
}

// Generate a comment using OpenAI API
async function generateComment(tweetText) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "text-davinci-003",
        prompt: `Provide a playful yet thought-provoking alternative perspective for this tweet: "${tweetText}". Ensure your response is respectful, engaging, and adds value.`,
        max_tokens: 70,
        temperature: 0.5,
        top_p: 1,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
      }
    );

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error("Error generating comment:", error.message);
    throw error;
  }
}

// Post a comment on a tweet
async function postComment(tweet, comment) {
  try {
    const response = await api.post("statuses/update", {
      status: `@${tweet.user.screen_name} ${comment}`,
      in_reply_to_status_id: tweet.id_str,
    });

    console.log(`Comment posted: ${response.data.text}`);
    commentedTweets.add(tweet.id_str); // Mark the tweet as commented
  } catch (error) {
    console.error(`Error posting comment for tweet ${tweet.id_str}:`, error.message);
  }
}

// Search for tweets and comment on them
async function searchAndComment() {
  const query = getKeyword();
  console.log(`Searching for tweets with keyword: "${query}"`);

  try {
    const { data: searchResults } = await api.get("search/tweets", {
      q: query,
      count: MAX_TWEETS,
    });

    console.log(`Found ${searchResults.statuses.length} tweets. Processing...`);

    for (const tweet of searchResults.statuses) {
      if (commentedTweets.has(tweet.id_str)) {
        console.log(`Skipping already commented tweet: ${tweet.id_str}`);
        continue;
      }

      try {
        const comment = await generateComment(tweet.text);
        console.log(`Generated comment: ${comment}`);
        await postComment(tweet, comment);
      } catch (error) {
        console.error(`Error handling tweet ${tweet.id_str}:`, error.message);
      }

      // Wait to comply with Twitter's rate limits
      await new Promise((resolve) => setTimeout(resolve, COMMENT_DELAY));
    }
  } catch (error) {
    console.error("Error fetching tweets:", error.message);
  }
}

// Main loop to continuously search and comment on tweets
async function mainLoop() {
  while (true) {
    await searchAndComment();
  }
}

// Start the bot
mainLoop();
