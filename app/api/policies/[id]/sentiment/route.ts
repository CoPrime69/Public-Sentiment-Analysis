import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Access params.id directly as it's already available
    const policyId = params.id;
    
    // Get tweets with sentiment for this policy
    const tweets = await prisma.tweet.findMany({
      where: { policyId },
      include: { sentiment: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Define proper types for our data structures
    type SentimentLabel = 'positive' | 'negative' | 'neutral';
    
    interface SentimentCounts {
      positive: number;
      negative: number;
      neutral: number;
      total: number;
    }

    interface SentimentByDate {
      [date: string]: SentimentCounts;
    }

    // Process tweets to create sentiment data by date
    const sentimentByDate = tweets.reduce((acc: SentimentByDate, tweet) => {
      // Skip tweets without sentiment
      if (!tweet.sentiment) return acc;
      
      const date = new Date(tweet.createdAt).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          positive: 0,
          negative: 0,
          neutral: 0,
          total: 0
        };
      }
      
      const sentiment = tweet.sentiment.label.toLowerCase();
      if (sentiment === 'positive' || sentiment === 'negative' || sentiment === 'neutral') {
        acc[date][sentiment as SentimentLabel]++;
        acc[date].total++;
      }
      
      return acc;
    }, {} as SentimentByDate);
    
    // Convert to array format for charts
    const chartData = Object.keys(sentimentByDate).map(date => ({
      date,
      positive: sentimentByDate[date].positive,
      negative: sentimentByDate[date].negative,
      neutral: sentimentByDate[date].neutral,
      total: sentimentByDate[date].total
    }));
    
    // Sort by date
    chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return NextResponse.json(chartData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}