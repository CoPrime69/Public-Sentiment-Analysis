import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentiment } from '@/lib/sentiment';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }
    
    // Run sentiment analysis
    const result = await analyzeSentiment(text);
    
    return NextResponse.json({
      input: text,
      result: result,
      success: true
    });
  } catch (error: unknown) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';
    console.error('Error in test sentiment analysis:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}