import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const policyId = searchParams.get('policyId');

  if (!policyId) {
    return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
  }

  try {
    console.log(`Fetching sentiment stats for policy ID: ${policyId}`);
    
    // Check if policy exists first
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      select: { id: true, name: true } // Only select fields we need
    });
    
    if (!policy) {
      console.log(`Policy with ID ${policyId} not found`);
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }
    
    // Instead of include, use select to avoid the problematic updatedAt field
    const tweets = await prisma.tweet.findMany({
      where: { policyId: policyId },
      select: {
        id: true,
        tweetId: true,
        text: true,
        author: true,
        // Explicitly exclude updatedAt
        sentiment: {
          select: {
            label: true,
            score: true,
            confidence: true
          }
        }
      }
    });

    console.log(`Found ${tweets.length} tweets for policy ${policyId}`);

    // Count sentiments
    const stats = {
      positive: 0,
      negative: 0,
      neutral: 0,
      total: tweets.length
    };

    tweets.forEach((tweet) => {
      if (tweet.sentiment) {
        const label = tweet.sentiment.label?.toLowerCase();
        if (label === 'positive') {
          stats.positive++;
        } else if (label === 'negative') {
          stats.negative++;
        } else {
          stats.neutral++;
        }
      }
    });

    console.log('Stats calculated:', stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching sentiment stats:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: 'Failed to fetch sentiment stats',
      details: errorMessage
    }, { status: 500 });
  }
}