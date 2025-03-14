import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentiment } from '@/lib/sentiment';
import prisma from '@/lib/prisma';

// Define interface for Tweet with sentiment
interface TweetWithSentiment {
  id: string;
  sentiment: {
    label: string;
  } | null;
}

export async function POST(request: NextRequest) {
  try {
    const { text, tweetId } = await request.json();
    
    if (!text || !tweetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Analyze sentiment using our updated function
    const sentimentResult = await analyzeSentiment(text);
    
    // Find the tweet
    const tweet = await prisma.tweet.findUnique({
      where: { id: tweetId }
    });
    
    if (!tweet) {
      return NextResponse.json(
        { error: 'Tweet not found' },
        { status: 404 }
      );
    }
    
    // Check if sentiment already exists for this tweet
    const existingSentiment = await prisma.sentiment.findFirst({
      where: { tweetId: tweet.id }
    });
    
    let sentiment;
    
    if (existingSentiment) {
      // Update existing sentiment
      sentiment = await prisma.sentiment.update({
        where: { id: existingSentiment.id },
        data: {
          score: sentimentResult.score,
          label: sentimentResult.label,
          confidence: sentimentResult.confidence
        }
      });
    } else {
      // Create new sentiment
      sentiment = await prisma.sentiment.create({
        data: {
          score: sentimentResult.score,
          label: sentimentResult.label,
          confidence: sentimentResult.confidence,
          tweetId: tweet.id
        }
      });
    }
    
    return NextResponse.json({ sentiment });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in sentiment analysis:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const policyId = searchParams.get('policyId');

  if (!policyId) {
    return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
  }

  try {
    // First, get all tweets for this policy
    const tweets = await prisma.tweet.findMany({
      where: { policyId: policyId },
      include: { sentiment: true }
    });

    // Count sentiments
    const stats = {
      positive: 0,
      negative: 0,
      neutral: 0,
      total: tweets.length
    };

    tweets.forEach((tweet: TweetWithSentiment) => {
      if (tweet.sentiment) {
        const label = tweet.sentiment.label.toLowerCase();
        if (label === 'positive') {
          stats.positive++;
        } else if (label === 'negative') {
          stats.negative++;
        } else {
          stats.neutral++;
        }
      }
    });

    return NextResponse.json(stats);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sentiment stats';
    console.error('Error fetching sentiment stats:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}