// lib/twitter.ts

export async function fetchTweetsByKeywords(keywords: string[], maxResults: number = 100, retryCount: number = 0) {
  try {
    const response = await fetch('/api/twitter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        keywords,
        maxResults
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        const waitTime = data.error?.match(/(\d+) seconds/) ? 
          parseInt(data.error.match(/(\d+) seconds/)[1]) : 60;
        
        // Throw a more user-friendly error message
        throw new Error(`Twitter API rate limit reached. Please wait ${waitTime} seconds before trying again.`);
      }
      
      // For other errors
      throw new Error(data.error || 'Failed to fetch tweets');
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching tweets:', error);
    throw error;
  }
}

export async function saveTweetsForPolicy(policyId: string, tweets: any[]) {
  try {
    const response = await fetch('/api/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        policyId,
        tweets
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
