import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { analyzeSentiment } from '@/lib/sentiment';

export async function POST(request: NextRequest) {
  try {
    const { policyId, tweets, sentimentResult } = await request.json();
    
    if (!policyId || !tweets || !Array.isArray(tweets)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    // Check if policy exists
    const policy = await prisma.policy.findUnique({
      where: { id: policyId }
    });
    
    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }
    
    // Process and save tweets
    const savedTweets = [];
    
    for (const tweet of tweets) {
      // Skip if tweet already exists
      const existingTweet = await prisma.tweet.findUnique({
        where: { tweetId: tweet.id }
      });
      
      if (existingTweet) continue;
      
      // Save the tweet
      const savedTweet = await prisma.tweet.create({
        data: {
          tweetId: tweet.id,
          text: tweet.text,
          author: tweet.author_id,
          createdAt: new Date(tweet.created_at),
          policyId
        }
      });
      
      // Handle sentiment analysis - either use provided result or analyze
      try {
        let sentimentData;
        
        // If sentiment result was provided (from test-sentiment page), use that
        if (sentimentResult && tweets.length === 1) {
          sentimentData = sentimentResult;
          console.log('Using provided sentiment data:', sentimentData);
        } else {
          // Otherwise analyze the sentiment
          console.log(`Analyzing sentiment for tweet: ${tweet.text.substring(0, 50)}...`);
          sentimentData = await analyzeSentiment(tweet.text);
        }
        
        // Create sentiment record
        await prisma.sentiment.create({
          data: {
            score: sentimentData.score,
            label: sentimentData.label,
            confidence: sentimentData.confidence,
            tweetId: savedTweet.id
          }
        });
        
        savedTweets.push(savedTweet);
      } catch (error: unknown) {
        console.error(`Error analyzing sentiment for tweet ${tweet.id}:`, error);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      savedCount: savedTweets.length 
    });
  } catch (error: unknown) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';

    console.error('Error saving tweets:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get('policyId');
    
    if (!policyId) {
      return NextResponse.json(
        { error: 'Policy ID is required' },
        { status: 400 }
      );
    }
    
    // Use select instead of include to avoid the problematic updatedAt field
    const tweets = await prisma.tweet.findMany({
      where: { policyId },
      select: {
        id: true,
        tweetId: true,
        text: true,
        author: true,
        createdAt: true,
        policyId: true,
        sentiment: {
          select: {
            id: true,
            label: true,
            score: true,
            confidence: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    console.log(`Found ${tweets.length} tweets for policy ${policyId}`);
    return NextResponse.json(tweets);
  } catch (error: unknown) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';

    console.error('Error fetching tweets:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}