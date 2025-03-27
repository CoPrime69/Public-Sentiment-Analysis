// lib/twitter.ts

export async function fetchTweetsByKeywords(keywords: string[], policyId?: string, policyDescription?: string, maxResults: number = 100, sentimentDistribution?: any) {
  try {
    // Now using Gemini API instead of Twitter API
    const response = await fetch('/api/gemini/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        keywords,
        policyId,
        policyDescription,
        maxResults,
        sentimentDistribution
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate tweets');
    }

    return data;
  } catch (error: unknown) {
    console.error('Error generating tweets:', error);
    throw error;
  }
}


export async function saveTweetsForPolicy(policyId: string, tweets: any[], sentimentResult?: any, isTestSentiment: boolean = false) {
  try {
    const response = await fetch('/api/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        policyId,
        tweets,
        sentimentResult,
        isTestSentiment
      })
    });

    if (!response.ok) {
      throw new Error(`Error saving tweets: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving tweets:', error);
    throw error;
  }
}
