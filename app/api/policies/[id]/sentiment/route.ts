import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Access params.id directly as it's actually already available
    // The error is misleading - the params object itself doesn't need to be awaited
    const policyId = params.id;
    
    // Get tweets with sentiment for this policy
    const tweets = await prisma.tweet.findMany({
      where: { policyId },
      include: { sentiment: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Define Tweet interface
    interface Tweet {
      sentiment?: {
        label: string;
      };
      createdAt: Date | string;
    }
    
    // Group by date and sentiment
    interface SentimentCounts {
      positive: number;
      negative: number;
      neutral: number;
      total: number;
    }

    interface SentimentByDate {
      [date: string]: SentimentCounts;
    }

    type SentimentLabel = 'positive' | 'negative' | 'neutral';

    const sentimentByDate: SentimentByDate = tweets.reduce((acc: SentimentByDate, tweet: Tweet) => {
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
    }, {});
    
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}