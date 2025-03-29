import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Generate random sentiment distribution that adds up to 1.0
function generateRandomSentimentDistribution() {
  // Create random weights
  const positive = 0.2 + Math.random() * 0.5; // Between 20-70%
  const negative = 0.1 + Math.random() * 0.4; // Between 10-50%
  const neutral = 1 - positive - negative;
  
  // Ensure weights sum to 1.0
  const sum = positive + negative + neutral;
  const normalizedPositive = positive / sum;
  const normalizedNegative = negative / sum;
  const normalizedNeutral = neutral / sum;

  return {
    positive: normalizedPositive,
    neutral: normalizedNeutral,
    negative: normalizedNegative
  };
}

// Generate a random number of tweets between min and max (inclusive)
function getRandomTweetCount(min = 15, max = 50) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function generateTweets(
  policyKeywords: string[], 
  policyDescription: string = '',
  count: number = 20,
  sentimentDistribution?: { positive: number, neutral: number, negative: number }
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // Use the provided count or generate a random count between 15-50
    const targetCount = count === 20 ? getRandomTweetCount(15, 50) : count;
    console.log(`Will generate approximately ${targetCount} tweets`);
    
    // Generate random sentiment distribution if not provided
    const distribution = sentimentDistribution || generateRandomSentimentDistribution();
    
    // Calculate how many tweets of each sentiment to generate
    const positiveCount = Math.floor(targetCount * distribution.positive);
    const neutralCount = Math.floor(targetCount * distribution.neutral);
    // Ensure the total is exactly targetCount
    const negativeCount = targetCount - positiveCount - neutralCount;
    
    // Ensure we have keywords to work with
    const effectiveKeywords = policyKeywords.length > 0 ? 
      policyKeywords : ['policy', 'government', 'regulation'];
    
    // Generate a unique prefix for this batch of tweets to avoid ID collisions
    const batchPrefix = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    
    // Create our prompt - improved for more reliable generation and including policy description
    const prompt = `
    Generate exactly ${targetCount}+-5 realistic tweets about this policy topic:
    
    Policy keywords: "${effectiveKeywords.join(', ')}"
    Policy description: "${policyDescription || 'A public policy related to ' + effectiveKeywords.join(' and ')}"
    
    Create:
    - ${positiveCount} tweets with positive sentiment
    - ${neutralCount} tweets with neutral sentiment
    - ${negativeCount} tweets with negative sentiment
    - make the positive tweets neutral tweets and negative tweets count more randomized for better distribution, at the end they all should add up to ${targetCount} value always :), and increase the neutral count a little bit and negative a little lower, but upto you what to do 
    - make sure the dates range from 2023 to till date for the tweet generated and the tweets should be unique and not repeated.
    - MAKE SURE THAT THE TWEETS RANGE FROM 2023 to 6 MAY 2025 few tweets being added last week PLEASE.
    Each tweet must:
    - Be under 280 characters
    - Include at least one opinion or fact about the policy topic
    - Have 1-3 relevant hashtags
    - Include a unique tweet ID using this format: "tweet_${batchPrefix}_[number]"
    - Have a realistic username
    - Have a unique author_id using this format: "user_${batchPrefix}_[number]"
    - Include a created_at timestamp from the past week
    - Have a clear sentiment label (positive, neutral, or negative)
    
    Format your response EXACTLY as a valid JSON array with this structure:
    [
      {
        "id": "tweet_${batchPrefix}_1",
        "text": "Tweet text with #hashtag",
        "author_id": "user_${batchPrefix}_1",
        "created_at": "2025-03-20T14:28:00.000Z",
        "sentiment": "positive",
        "username": "username"
      },
      ... more tweets
    ]
    
    YOU MUST GENERATE EXACTLY ${targetCount} +-5 TWEETS. Return ONLY the JSON array with no other text. Make the distribution more random`;

    console.log(`Generating ${targetCount} tweets about: ${effectiveKeywords.join(', ')}`);
    console.log(`Sentiment distribution: positive=${positiveCount}, neutral=${neutralCount}, negative=${negativeCount}`);
    
    // Generate the content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const textContent = response.text();
    
    // Parse the JSON response
    let tweets;
    try {
      // Find JSON in the response
      const jsonMatch = textContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        tweets = JSON.parse(jsonMatch[0]);
      } else {
        tweets = JSON.parse(textContent);
      }
      
      // Ensure tweet IDs and author IDs are actually unique by adding index if needed
      const processedTweets = tweets.map((tweet, index) => {
        // Ensure ID uniqueness
        if (!tweet.id || !tweet.id.includes(batchPrefix)) {
          tweet.id = `tweet_${batchPrefix}_${index + 1}`;
        }
        
        // Ensure author ID uniqueness
        if (!tweet.author_id || !tweet.author_id.includes(batchPrefix)) {
          tweet.author_id = `user_${batchPrefix}_${index + 1}`;
        }
        
        return tweet;
      });
      
      // Ensure we have the requested number of tweets
      if (!Array.isArray(processedTweets) || processedTweets.length < count) {
        console.warn(`Gemini returned ${processedTweets?.length || 0} tweets instead of ${count}, generating fallback tweets`);
        // Generate fallback tweets if needed
        const fallbackCount = count - (processedTweets?.length || 0);
        const fallbackTweets = generateFallbackTweets(effectiveKeywords, policyDescription, fallbackCount, batchPrefix);
        
        tweets = Array.isArray(processedTweets) ? [...processedTweets, ...fallbackTweets] : fallbackTweets;
      } else {
        tweets = processedTweets;
      }
      
      return tweets;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.log("Raw response:", textContent);
      
      // Generate fallback tweets on error
      console.log("Generating fallback tweets due to parsing error");
      return generateFallbackTweets(effectiveKeywords, policyDescription, targetCount, batchPrefix);
    }
  } catch (error) {
    console.error("Error generating tweets with Gemini:", error);
    
    // Generate fallback tweets on any error
    const effectiveKeywords = policyKeywords.length > 0 ? 
      policyKeywords : ['policy', 'government', 'regulation'];
    const batchPrefix = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const targetCount = count === 20 ? getRandomTweetCount(15, 50) : count;
    return generateFallbackTweets(effectiveKeywords, policyDescription, targetCount, batchPrefix);
  }
}

// Fallback function to generate tweets when the AI fails
function generateFallbackTweets(keywords: string[], policyDescription: string, count: number, batchPrefix: string) {
  const sentiments = ['positive', 'negative', 'neutral'];
  const tweets: Array<{
    id: string;
    text: string;
    author_id: string;
    created_at: string;
    sentiment: string;
    username: string;
  }> = [];
  const now = new Date();
  const descriptions = policyDescription.split('.').filter(s => s.trim().length > 0);
  
  for (let i = 0; i < count; i++) {
    const sentiment = sentiments[i % sentiments.length];
    const keyword = keywords[i % keywords.length];
    const randomHours = Math.floor(Math.random() * 168); // Within past week
    const timestamp = new Date(now.getTime() - randomHours * 60 * 60 * 1000).toISOString();
    const tweetId = `tweet_${batchPrefix}_${i + 1}_fb`;
    const userId = `user_${batchPrefix}_${i + 1}_fb`;
    
    // Pick a random description fragment if available
    const descFragment = descriptions.length > 0 ? 
      descriptions[i % descriptions.length].trim() : 
      `${keyword} policy`;
    
    let text = '';
    if (sentiment === 'positive') {
      text = `I really support the new ${keyword} policy! ${descFragment}. This will definitely improve things. #${keyword} #support #progress`;
    } else if (sentiment === 'negative') {
      text = `Not happy with this ${keyword} policy. ${descFragment}. It seems problematic and poorly thought out. #${keyword} #concerned`;
    } else {
      text = `Interesting developments in the ${keyword} policy area. ${descFragment}. Let's see how this plays out. #${keyword} #policy`;
    }
    
    tweets.push({
      id: tweetId,
      text: text.substring(0, 279), // Ensure under 280 chars
      author_id: userId,
      created_at: timestamp,
      sentiment,
      username: `user${1000 + i}`
    });
  }
  
  return tweets;
}