const axios = require("axios");
const Twit = require("twit");

const twitterConsumerKey = "Consumer Key";
const twitterConsumerSecret = "Consumer Secret";
const twitterAccessToken = "Access Token";
const twitterAccessTokenSecret = "Access Token Secret";
const twitterBearerToken=
"Twitter Bearer Token"
const openaiApiKey = " OpenAI API Key";

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
  bearer_token: twitterBearerToken
});

async function searchAndComment() {
  console.log("Searching for tweets...");

  const query = `${getKeyword()}`;
  const maxTweets = 100;

  const { data: searchResults } = await api.get("search/tweets", {
    q: query,
    count: maxTweets,
  });
  
  console.log(
    `Found ${searchResults.statuses.length} tweets. Generating comments...`
  );

  for (const tweet of searchResults.statuses) {
    const { data: response } = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "text-davinci-003",
        prompt: `Comment on this tweet: "${tweet.text}", the reply to this tweet must playfully contradicts the tweet, presenting an equally thought-provoking and insightful perspective.`,
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

    const comment = response.choices[0].text;
    console.log(comment);

    const { data: postResponse } = await api.post("statuses/update", {
      status: `@${tweet.user.screen_name} ${comment}`,
      in_reply_to_status_id: tweet.id_str,
    });
    console.log(`Comment posted: ${postResponse.text}`);

    // Delay each iteration for 30min
    await new Promise((resolve) => setTimeout(resolve, 30 * 60 * 1000));
  }
  searchAndComment();
}

searchAndComment();
