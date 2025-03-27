import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { analyzeSentiment } from '@/lib/sentiment';

export async function POST(request: NextRequest) {
  try {
    const { policyId, tweets, sentimentResult, isTestSentiment = false } = await request.json();
    
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
    const savedTweets: Array<{
      id: string;
      createdAt: Date;
      tweetId: string;
      text: string;
      author: string;
      policyId: string;
    }> = [];
    
    const duplicates: string[] = [];
    
    for (const tweet of tweets) {
      // Skip if tweet already exists by ID or nearly identical text
      try {
        const existingTweet = await prisma.tweet.findFirst({
          where: { 
            OR: [
              { tweetId: tweet.id },
              { text: tweet.text }
            ]
          }
        });
        
        if (existingTweet) {
          duplicates.push(tweet.id);
          continue;
        }
        
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
        
        // Handle sentiment analysis based on source priority
        try {
          let sentimentData;
          let sentimentSource = 'unknown';
          
          if (isTestSentiment && sentimentResult) {
            // Case 1: Explicit test sentiment page result
            sentimentData = sentimentResult;
            sentimentSource = 'test-sentiment-page';
          } else if (tweet.sentiment) {
            // Case 2: Pre-labeled sentiment from Gemini
            const confidence = tweet.sentiment === 'neutral' ? 0.5 : 0.8;
            
            sentimentData = {
              label: tweet.sentiment,
              score: tweet.sentiment === 'positive' ? 0.8 : 
                    tweet.sentiment === 'negative' ? 0.2 : 0.5,
              confidence: confidence
            };
            sentimentSource = 'gemini-prelabeled';
          } else {
            // Case 3: Fallback to worker analysis when no other sentiment data exists
            console.log(`No pre-labeled sentiment found, analyzing for tweet: ${tweet.text.substring(0, 50)}...`);
            sentimentData = await analyzeSentiment(tweet.text);
            sentimentSource = 'local-sentiment-worker';
          }
          
          console.log(`Using sentiment from ${sentimentSource} for tweet ${tweet.id}: ${sentimentData.label}`);
          
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
      } catch (error: unknown) {
        console.error(`Error processing tweet ${tweet.id}:`, error);
        // Continue processing other tweets even if one fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      savedCount: savedTweets.length,
      duplicateCount: duplicates.length
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