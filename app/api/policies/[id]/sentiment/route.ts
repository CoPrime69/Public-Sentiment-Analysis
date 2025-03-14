import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Define the Tweet interface with the properties we need
interface TweetWithSentiment {
  sentiment: {
    label: string;
  } | null;
  createdAt: Date | string;
}

export async function GET(request: NextRequest) {
  try {
    const policyId = request.nextUrl.pathname.split('/').pop(); // Extract id from URL

    const tweets = await prisma.tweet.findMany({
      where: { policyId },
      include: { sentiment: true },
      orderBy: { createdAt: 'desc' },
    });

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

    const sentimentByDate = tweets.reduce((acc: SentimentByDate, tweet: TweetWithSentiment) => {
      if (!tweet.sentiment) return acc;

      const date = new Date(tweet.createdAt).toISOString().split('T')[0];

      if (!acc[date]) {
        acc[date] = { positive: 0, negative: 0, neutral: 0, total: 0 };
      }

      const sentiment = tweet.sentiment.label.toLowerCase();
      if (sentiment in acc[date]) {
        acc[date][sentiment as SentimentLabel]++;
        acc[date].total++;
      }

      return acc;
    }, {} as SentimentByDate);

    const chartData = Object.keys(sentimentByDate).map((date) => ({
      date,
      ...sentimentByDate[date],
    }));

    chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(chartData);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}