import { NextRequest, NextResponse } from 'next/server';
import { generateTweets } from '@/lib/gemini';
import prisma from '@/lib/prisma';

// Cache management
const cachedResponses = new Map();
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Configure edge runtime
export const config = {
  runtime: 'edge',
  maxDuration: 60, // Maximum 60 seconds
}

// Constants
const GEMINI_TIMEOUT = 30000; // 30 seconds
const BATCH_SIZE = 5; // Process in small batches of 5 tweets
const MAX_TWEETS = 10; // Lower maximum tweets to prevent timeouts

/**
 * Helper function to safely generate tweets with timeout
 */
async function safeGenerateTweets(
  keywords: string[],
  policyDescription: string,
  maxResults: number,
  sentimentDistribution: any
): Promise<any[]> {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<any[]>((_, reject) => {
      setTimeout(() => reject(new Error('Tweet generation timed out')), GEMINI_TIMEOUT);
    });
    
    // Race between the actual generation and the timeout
    const tweets = await Promise.race([
      generateTweets(
        keywords,
        policyDescription,
        maxResults,
        sentimentDistribution
      ),
      timeoutPromise
    ]) as any[];
    
    return tweets || [];
  } catch (error) {
    console.error('Error generating tweets:', error);
    // Return empty array instead of throwing - this allows the API to return partial results
    return [];
  }
}

/**
 * Helper function to check if tweets exist in database (with batching)
 */
async function checkExistingTweets(tweets: any[]): Promise<boolean[]> {
  try {
    const existingFlags: boolean[] = new Array(tweets.length).fill(false);
    
    // Process in batches to prevent timeout
    for (let i = 0; i < tweets.length; i += BATCH_SIZE) {
      const batch = tweets.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(tweet => 
          prisma.tweet.findFirst({
            where: { 
              OR: [
                { tweetId: tweet.id },
                { text: tweet.text }
              ]
            }
          })
        )
      );
      
      // Update existence flags for this batch
      for (let j = 0; j < batchResults.length; j++) {
        existingFlags[i + j] = !!batchResults[j];
      }
    }
    
    return existingFlags;
  } catch (error) {
    console.error('Error checking existing tweets:', error);
    // If database check fails, assume no tweets exist (prioritize showing content)
    return new Array(tweets.length).fill(false);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Start response timer
    const startTime = Date.now();
    
    const { keywords, policyId, policyDescription, maxResults = 10, sentimentDistribution } = await request.json();
    
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API Key is not configured' },
        { status: 500 }
      );
    }

    // Use effective keywords
    const effectiveKeywords = keywords?.length > 0 ? keywords : ['policy', 'government'];
    
    // Create a cache key
    const timestamp = Math.floor(Date.now() / 60000); // Changes every minute
    const cacheKey = `${effectiveKeywords.join('|')}_${policyId}_${maxResults}_${timestamp}`;
    
    // Check cache
    if (cachedResponses.has(cacheKey)) {
      const { data, timestamp } = cachedResponses.get(cacheKey);
      
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        console.log('Returning cached generated tweets');
        return NextResponse.json(data);
      } else {
        cachedResponses.delete(cacheKey);
      }
    }
    
    console.log('Generating tweets with Gemini for keywords:', effectiveKeywords);
    
    // Limit to a smaller number of tweets to prevent timeouts
    const safeMaxResults = Math.min(maxResults, MAX_TWEETS);
    
    // Generate tweets with safe generation function
    const tweets = await safeGenerateTweets(
      effectiveKeywords,
      policyDescription || '',
      safeMaxResults,
      sentimentDistribution
    );
    
    if (!tweets || tweets.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate tweets within the time limit' },
        { status: 500 }
      );
    }
    
    console.log(`Successfully generated ${tweets.length} tweets`);
    
    // Check for time budget - don't exceed 50 seconds total processing time
    // This ensures we have time to return a response before the 60s hard limit
    const timeElapsed = Date.now() - startTime;
    const timeRemaining = 50000 - timeElapsed; // 50 seconds maximum total processing time
    
    let uniqueTweets: any[] = tweets;
    let existingCount = 0;
    
    // Only check for duplicates if we have enough time remaining
    if (timeRemaining > 5000) { // Need at least 5 seconds remaining
      const existingFlags = await checkExistingTweets(tweets);
      uniqueTweets = tweets.filter((_, index) => !existingFlags[index]);
      existingCount = tweets.length - uniqueTweets.length;
      
      console.log(`${existingCount} duplicate tweets filtered out`);
    } else {
      console.log('Skipping duplicate check due to time constraints');
    }
    
    // Format response similar to Twitter API
    const response = {
      data: uniqueTweets,
      meta: {
        result_count: uniqueTweets.length,
        generated_count: tweets.length,
        duplicates_filtered: existingCount,
        processing_time_ms: Date.now() - startTime,
        max_tweets_limit: MAX_TWEETS
      },
      includes: {
        users: uniqueTweets.map(tweet => ({
          id: tweet.author_id,
          name: tweet.username,
          username: tweet.username
        }))
      }
    };
    
    // Cache the response if we have enough time left
    if (Date.now() - startTime < 55000) {
      cachedResponses.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      // Limit cache size
      if (cachedResponses.size > 20) {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, { timestamp }] of cachedResponses.entries()) {
          if (timestamp < oldestTime) {
            oldestTime = timestamp;
            oldestKey = key;
          }
        }
        
        if (oldestKey) cachedResponses.delete(oldestKey);
      }
    }
    
    return NextResponse.json(response);
  } catch (error: unknown) {
    // Create a simple error response that will parse correctly
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    
    // Return a clean, simple error response
    console.error('Server error when generating tweets:', errorMessage);
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    );
  }
}