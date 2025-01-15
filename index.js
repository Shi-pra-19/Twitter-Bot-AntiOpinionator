const axios = require("axios");
const Twit = require("twit");

// Environment variables for sensitive data
const twitterConsumerKey = "TWITTER_CONSUMER_KEY";
const twitterConsumerSecret = "TWITTER_CONSUMER_SECRET";
const twitterAccessToken = "TWITTER_ACCESS_TOKEN";
const twitterAccessTokenSecret = "TWITTER_ACCESS_TOKEN_SECRET";
const twitterBearerToken = "TWITTER_BEARER_TOKEN";
const openaiApiKey = "OPENAI_API_KEY";

function getKeyword() {
  const keywords = [
    "thoughts",
    "journey",
    "self-discovery",
    "life",
    "lessons",
    "selfimprovement",
    "embracing",
    "growth",
    "success",
    "inspiration",
    "leader",
    "influencer",
    "innovation",
    "insights",
    "expertise",
    "trends",
    "opinion",
    "change",
    "strategy",
    "industryinsights",
    "futureof",
    "technology",
    "motivational",
    "culture",
  ];
  const index = Math.floor(Math.random() * keywords.length);
  return keywords[index];
}

const api = new Twit({
  consumer_key: twitterConsumerKey,
  consumer_secret: twitterConsumerSecret,
  access_token: twitterAccessToken,
  access_token_secret: twitterAccessTokenSecret,
  bearer_token: twitterBearerToken,
});

const commentedTweets = new Set();

async function searchAndComment() {
  console.log("Searching for tweets...");

  const query = getKeyword();
  const maxTweets = 100;

  try {
    const { data: searchResults } = await api.get("search/tweets", {
      q: query,
      count: maxTweets,
    });

    console.log(
      `Found ${searchResults.statuses.length} tweets. Generating comments...`
    );

    for (const tweet of searchResults.statuses) {
      // Skip already commented tweets
      if (commentedTweets.has(tweet.id_str)) {
        console.log(`Skipping already commented tweet: ${tweet.id_str}`);
        continue;
      }

      try {
        const { data: response } = await axios.post(
          "https://api.openai.com/v1/completions",
          {
            model: "text-davinci-003",
            prompt: `Provide a playful yet thought-provoking alternative perspective for this tweet: "${tweet.text}". Ensure your response is respectful, engaging, and adds value.`,
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

        const comment = response.choices[0].text.trim();
        console.log(`Generated comment: ${comment}`);

        const { data: postResponse } = await api.post("statuses/update", {
          status: `@${tweet.user.screen_name} ${comment}`,
          in_reply_to_status_id: tweet.id_str,
        });

        console.log(`Comment posted: ${postResponse.text}`);
        commentedTweets.add(tweet.id_str); // Mark tweet as commented

      } catch (error) {
        console.error(
          `Error generating or posting comment for tweet ${tweet.id_str}:`,
          error.message
        );
      }

      // Delay between comments to comply with Twitter's rate limits
      await new Promise((resolve) => setTimeout(resolve, 30 * 60 * 1000));
    }
  } catch (error) {
    console.error("Error fetching tweets:", error.message);
  }
}

async function mainLoop() {
  while (true) {
    await searchAndComment();
  }
}

mainLoop();
