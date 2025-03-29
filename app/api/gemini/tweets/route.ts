import { NextRequest, NextResponse } from 'next/server';
import { generateTweets } from '@/lib/gemini';
import prisma from '@/lib/prisma';

// Cache management
const cachedResponses = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { keywords, policyId, policyDescription, maxResults = 10, sentimentDistribution } = await request.json();
    
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API Key is not configured on the server' },
        { status: 500 }
      );
    }

    // Always ensure we have some keywords
    const effectiveKeywords = keywords?.length > 0 ? keywords : ['policy', 'government'];
    
    // Create a cache key from the request parameters - include policyId to ensure fresh tweets
    const timestamp = Math.floor(Date.now() / 60000); // Changes every minute
    const cacheKey = `${effectiveKeywords.join('|')}_${policyId}_${maxResults}_${timestamp}`;
    
    // Check if we have a cached response - but don't use cache if explicitly requesting new tweets
    if (cachedResponses.has(cacheKey)) {
      const { data, timestamp } = cachedResponses.get(cacheKey);
      
      // Return cached data if it's still valid
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        console.log('Returning cached generated tweets');
        return NextResponse.json(data);
      } else {
        // Remove expired cache entry
        cachedResponses.delete(cacheKey);
      }
    }
    
    console.log('Generating tweets with Gemini for keywords:', effectiveKeywords);
    
    // Generate tweets with Gemini
    const tweets = await generateTweets(
      effectiveKeywords,
      policyDescription || '',
      Math.min(maxResults, 50), // Increased from 20 to 50
      sentimentDistribution
    );
    
    if (!tweets || tweets.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate tweets' },
        { status: 500 }
      );
    }
    
    console.log(`Successfully generated ${tweets.length} tweets`);
    
    // Check if any of these tweets already exist in the database by their text
    // We check by text similarity instead of ID to catch semantic duplicates
    const existingTweets = await Promise.all(
      tweets.map(tweet => 
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
    
    // Filter out tweets that already exist in the database
    const uniqueTweets = tweets.filter((_, index) => !existingTweets[index]);
    
    console.log(`${tweets.length - uniqueTweets.length} duplicate tweets filtered out`);
    
    // Format response similar to Twitter API
    const response = {
      data: uniqueTweets,
      meta: {
        result_count: uniqueTweets.length,
        generated_count: tweets.length,
        duplicates_filtered: tweets.length - uniqueTweets.length
      },
      includes: {
        users: uniqueTweets.map(tweet => ({
          id: tweet.author_id,
          name: tweet.username,
          username: tweet.username
        }))
      }
    };
    
    // Cache the response
    cachedResponses.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (cachedResponses.size > 20) {
      // Find and remove oldest entry
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
    
    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    console.error('Server error when generating tweets:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}