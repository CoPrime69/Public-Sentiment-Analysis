import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const policyId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || 'all';
    
    console.log(`Fetching sentiment data for policy ${policyId}, timeframe: ${timeframe}`);
    
    // Handle various cases
    if (!policyId) {
      return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
    }
    
    // Check if policy exists
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      select: { id: true, name: true }
    });
    
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }
    
    // Fetch tweets with sentiment data for this policy
    // Using select to avoid the updatedAt field issue
    const tweetsWithSentiment = await prisma.tweet.findMany({
      where: {
        policyId: policyId
      },
      select: {
        id: true,
        tweetId: true,
        text: true,
        author: true,
        createdAt: true,
        sentiment: {
          select: {
            label: true,
            score: true
          }
        }
      }
    });
    
    console.log(`Found ${tweetsWithSentiment.length} tweets with sentiment data`);
    
    // Group by date and count sentiments
    const sentimentByDate = new Map();
    
    // Process tweets based on timeframe
    tweetsWithSentiment.forEach(tweet => {
      // Format date differently based on timeframe
      let dateKey;
      
      if (timeframe === 'week') {
        // For week, group by day
        dateKey = new Date(tweet.createdAt).toISOString().split('T')[0];
      } else if (timeframe === 'month') {
        // For month, group by day
        dateKey = new Date(tweet.createdAt).toISOString().split('T')[0];
      } else {
        // For all time, group by month
        const date = new Date(tweet.createdAt);
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      // Initialize stats for this date if not already there
      if (!sentimentByDate.has(dateKey)) {
        sentimentByDate.set(dateKey, {
          date: dateKey,
          positive: 0,
          negative: 0,
          neutral: 0,
          total: 0
        });
      }
      
      // Increment counters
      const stats = sentimentByDate.get(dateKey);
      stats.total++;
      
      if (tweet.sentiment) {
        const label = tweet.sentiment.label?.toLowerCase();
        if (label === 'positive') {
          stats.positive++;
        } else if (label === 'negative') {
          stats.negative++;
        } else if (label === 'neutral') {
          stats.neutral++;
        }
      }
    });
    
    // Convert to array and sort by date
    const result = Array.from(sentimentByDate.values())
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error fetching sentiment trend data:', error);
    
    // Return error details
    return NextResponse.json({
      error: 'Failed to fetch sentiment trend data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}