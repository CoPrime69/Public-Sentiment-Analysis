'use client';

import { useEffect, useState, useRef } from 'react';

interface WordCloudProps {
  policyId: string;
}

interface WordFrequency {
  text: string;
  value: number;
}

interface Tweet {
  text: string;
  id?: string;
  tweetId?: string;
  author?: string;
}

export default function WordCloud({ policyId }: WordCloudProps) {
  const [words, setWords] = useState<WordFrequency[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    async function fetchTweets() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/tweets?policyId=${policyId}`);
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("API response:", data);
        
        // Check the structure of the response to extract tweets array
        let tweetsArray: Tweet[] = [];
        
        // Handle different response formats
        if (Array.isArray(data)) {
          // If data is already an array of tweets
          tweetsArray = data;
        } else if (data && typeof data === 'object') {
          // If data is an object with a tweets property
          if (Array.isArray(data.tweets)) {
            tweetsArray = data.tweets;
          } else if (Array.isArray(data.data)) {
            tweetsArray = data.data;
          } else if (Array.isArray(data.results)) {
            tweetsArray = data.results;
          } else {
            // If we can't find an array, check if it's a single tweet object
            if (data.text && typeof data.text === 'string') {
              tweetsArray = [data];
            } else {
              throw new Error('Response format not recognized as tweets data');
            }
          }
        } else {
          throw new Error('Invalid response format');
        }
        
        if (tweetsArray.length === 0) {
          console.log("No tweets found in the response");
          setWords([]);
          return;
        }
        
        // Process tweets to get word frequencies
        const wordFrequencies: Record<string, number> = {};
        const stopWords = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'is', 'it', 'that', 'for', 'on', 'with', 'as', 'this', 'by', 'be', 'are', 'was', 'were', 'at', 'from', 'an', 'or', 'but', 'not', 'what', 'all', 'when', 'how', 'where', 'which', 'who', 'will', 'can', 'just', 'has', 'have', 'had', 'would', 'could', 'should', 'did', 'do', 'does', 'if', 'so', 'no', 'yes', 'their', 'there', 'they', 'them', 'these', 'those', 'then', 'than', 'your', 'you', 'my', 'mine', 'his', 'her', 'our', 'we', 'us', 'i', 'me', 'he', 'she', 'it', 'its', 'am', 'been', 'being', 'very', 'too', 'much', 'more', 'most', 'some', 'any', 'many', 'few', 'each', 'every', 'other', 'another', 'such', 'own', 'same', 'both', 'either', 'neither', 'again', 'here', 'there', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very']);
        
        // Process each tweet to extract words
        tweetsArray.forEach((tweet: Tweet) => {
          // Make sure tweet has text before processing
          if (!tweet || typeof tweet.text !== 'string') {
            console.warn('Tweet missing text property:', tweet);
            return; // Skip this tweet
          }
          
          const text: string = tweet.text.toLowerCase();
          // Remove URLs, mentions, special characters
          const cleanText: string = text.replace(/https?:\/\/\S+|@\w+|[^\w\s]|RT/g, '');
          const words: string[] = cleanText.split(/\s+/);
          
          words.forEach((word: string) => {
            if (word.length > 2 && !stopWords.has(word)) {
              wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
            }
          });
        });
        
        // Convert to array and sort by frequency
        const wordArray = Object.entries(wordFrequencies)
          .map(([text, value]) => ({ text, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 100); // Take top 100 words
        
        setWords(wordArray);
      } catch (error) {
        console.error('Error fetching tweets for word cloud:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setWords([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (policyId) {
      fetchTweets();
    } else {
      setLoading(false);
    }
  }, [policyId]);
  
  if (loading) {
    return (
      <div className="w-full border rounded-lg p-6 flex justify-center items-center min-h-[300px] bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-40 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full border rounded-lg p-6 flex justify-center items-center min-h-[300px] bg-red-50">
        <div className="text-red-500 text-center">
          <p className="font-semibold">Error loading word cloud</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }
  
  if (words.length === 0) {
    return (
      <div className="w-full border rounded-lg p-6 flex justify-center items-center min-h-[300px] bg-gray-50">
        <div className="text-gray-500 text-center">
          <p>No data available for word cloud</p>
          <p className="text-sm">Try selecting a different policy or time period</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Common Words in Tweets</h3>
      <div 
        ref={containerRef} 
        className="border rounded-lg p-4 min-h-[300px] flex flex-wrap gap-2 justify-center items-center"
      >
        {words.slice(0, 50).map((word, index) => (
          <span 
            key={index}
            className="inline-block"
            style={{
              fontSize: `${Math.max(1, Math.min(5, 1 + word.value / 10))}rem`,
              opacity: 0.7 + (word.value / (words[0].value * 2)),
              color: `hsl(${index * 137.5 % 360}, 70%, 50%)`
            }}
          >
            {word.text}
          </span>
        ))}
      </div>
    </div>
  );
}