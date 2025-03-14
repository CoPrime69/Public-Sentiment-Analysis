// app/api/twitter/route.ts
import { NextRequest, NextResponse } from 'next/server';

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const TWITTER_API_URL = 'https://api.twitter.com/2/tweets/search/recent';

// Rate limit tracking
let rateLimitRemaining = 15; // Default starting value
let rateLimitReset = 0; // Timestamp when the rate limit resets
let lastRequestTime = 0; // Timestamp of the last request

// Cache management
const cachedResponses = new Map();
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests

export async function POST(request: NextRequest) {
  try {
    const { keywords, maxResults = 5 } = await request.json();
    
    if (!TWITTER_BEARER_TOKEN) {
      return NextResponse.json(
        { error: 'Twitter Bearer Token is not configured on the server' },
        { status: 500 }
      );
    }

    if (!keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array cannot be empty' },
        { status: 400 }
      );
    }

    // Create a cache key from the request parameters
    const cacheKey = `${keywords.join('|')}_${maxResults}`;
    
    // Check if we have a cached response
    if (cachedResponses.has(cacheKey)) {
      const { data, timestamp } = cachedResponses.get(cacheKey);
      
      // Return cached data if it's still valid
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        console.log('Returning cached Twitter data');
        return NextResponse.json(data);
      } else {
        // Remove expired cache entry
        cachedResponses.delete(cacheKey);
      }
    }
    
    // Enforce minimum time between requests to avoid rate limits
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`Waiting ${waitTime}ms before making another request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Check if we're rate limited
    if (rateLimitRemaining <= 1 && Date.now() < rateLimitReset) {
      const waitTime = rateLimitReset - Date.now();
      console.log(`Rate limited. Reset in ${Math.ceil(waitTime/1000)} seconds`);
      
      // If we have any cached data for similar keywords, return it
      for (const [key, { data }] of cachedResponses.entries()) {
        // Check if any keyword matches
        if (keywords.some((kw:string) => key.includes(kw))) {
          console.log('Returning similar cached data due to rate limiting');
          return NextResponse.json(data);
        }
      }
      
      return NextResponse.json(
        { error: `Rate limit reached. Please try again in ${Math.ceil(waitTime/1000)} seconds.` },
        { status: 429 }
      );
    }

    // Use only first 2 keywords to simplify query but maintain relevance
    const limitedKeywords = keywords.slice(0, 2);
    const query = encodeURIComponent(limitedKeywords.join(' OR '));
    
    // Build the URL with parameters
    const url = new URL(TWITTER_API_URL);
    url.searchParams.append('query', query);
    url.searchParams.append('max_results', Math.min(maxResults, 10).toString());
    url.searchParams.append('tweet.fields', 'created_at,author_id,text');
    url.searchParams.append('expansions', 'author_id');
    url.searchParams.append('user.fields', 'name,username');

    console.log('Making Twitter API request to:', url.toString());
    
    // Update last request time
    lastRequestTime = Date.now();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`
      }
    });
    
    // Extract and update rate limit information
    const remaining = response.headers.get('x-rate-limit-remaining');
    const reset = response.headers.get('x-rate-limit-reset');
    
    if (remaining) rateLimitRemaining = parseInt(remaining, 10);
    if (reset) rateLimitReset = parseInt(reset, 10) * 1000; // Convert to milliseconds
    
    console.log(`Rate limit: ${rateLimitRemaining} requests remaining, resets at ${new Date(rateLimitReset).toISOString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitter API error details:', errorText);
      
      // For rate limit errors, try to return cached data if available
      if (response.status === 429) {
        // Look for any cached data to return
        if (cachedResponses.size > 0) {
          const firstCacheKey = cachedResponses.keys().next().value;
          const { data } = cachedResponses.get(firstCacheKey);
          return NextResponse.json(data);
        }
      }
      
      return NextResponse.json(
        { error: `Twitter API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Only cache if we got actual results
    if (data.data && data.data.length > 0) {
      cachedResponses.set(cacheKey, {
        data,
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
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Server error when calling Twitter API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
