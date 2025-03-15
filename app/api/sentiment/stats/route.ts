import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Define the interface for a tweet with sentiment
interface TweetWithSentiment {
  id: string;
  sentiment: {
    label: string;
  } | null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const policyId = searchParams.get('policyId');

  if (!policyId) {
    return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
  }

  try {
    // Get all tweets with sentiment for this policy
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
    console.error('Error fetching sentiment stats:', error);
    return NextResponse.json({ error: 'Failed to fetch sentiment stats' }, { status: 500 });
  }
}