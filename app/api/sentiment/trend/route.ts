import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const policyId = searchParams.get('policyId');

    if (!policyId) {
      return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
    }
    
    // Get tweets with sentiment for this policy
    const tweets = await prisma.tweet.findMany({
      where: { policyId },
      include: { sentiment: true },
      orderBy: { createdAt: 'desc' }
    });
    
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

    interface TweetWithSentiment {
      createdAt: Date;
      sentiment: SentimentData | null;
    }

    interface SentimentData {
      label: string;
    }

    const sentimentByDate: SentimentByDate = tweets.reduce((acc: SentimentByDate, tweet: TweetWithSentiment) => {
      if (!tweet.sentiment) return acc;
      
      const date: string = new Date(tweet.createdAt).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          positive: 0,
          negative: 0,
          neutral: 0,
          total: 0
        };
      }
      
      const sentiment: string = tweet.sentiment.label.toLowerCase();
      if (sentiment === 'positive' || sentiment === 'negative' || sentiment === 'neutral') {
        acc[date][sentiment as keyof Omit<SentimentCounts, 'total'>]++;
        acc[date].total++;
      }
      
      return acc;
    }, {});
    
    // Convert to array format for charts
    const chartData = Object.keys(sentimentByDate).map(date => ({
      date,
      positive: sentimentByDate[date].positive,
      negative: sentimentByDate[date].negative,
      neutral: sentimentByDate[date].neutral
    }));
    
    // Sort by date
    chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // If no data, provide an empty example
    if (chartData.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      chartData.push({
        date: today,
        positive: 0,
        negative: 0,
        neutral: 0
      });
    }
    
    return NextResponse.json(chartData);
  } catch (error: unknown) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';

    console.error('Error fetching sentiment trend data:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}