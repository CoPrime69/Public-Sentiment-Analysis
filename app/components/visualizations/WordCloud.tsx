'use client';

import { useEffect, useState, useRef } from 'react';

interface WordCloudProps {
  policyId: string;
}

interface WordFrequency {
  text: string;
  value: number;
}

export default function WordCloud({ policyId }: WordCloudProps) {
  const [words, setWords] = useState<WordFrequency[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    async function fetchTweets() {
      try {
        const response = await fetch(`/api/tweets?policyId=${policyId}`);
        const tweets = await response.json();
        
        // Process tweets to get word frequencies
        const wordFrequencies: Record<string, number> = {};
        const stopWords = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'is', 'it', 'that', 'for', 'on', 'with', 'as', 'this', 'by', 'be', 'are', 'was', 'were', 'at', 'from', 'an', 'or', 'but', 'not', 'what', 'all', 'when', 'how', 'where', 'which', 'who', 'will', 'can', 'just', 'has', 'have', 'had', 'would', 'could', 'should', 'did', 'do', 'does', 'if', 'so', 'no', 'yes', 'their', 'there', 'they', 'them', 'these', 'those', 'then', 'than', 'your', 'you', 'my', 'mine', 'his', 'her', 'our', 'we', 'us', 'i', 'me', 'he', 'she', 'it', 'its', 'am', 'been', 'being', 'very', 'too', 'much', 'more', 'most', 'some', 'any', 'many', 'few', 'each', 'every', 'other', 'another', 'such', 'own', 'same', 'both', 'either', 'neither', 'again', 'here', 'there', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very']);
        
        interface Tweet {
          text: string;
          // Other tweet properties would go here
        }

        tweets.forEach((tweet: Tweet) => {
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
      } finally {
        setLoading(false);
      }
    }
    
    if (policyId) {
      fetchTweets();
    }
  }, [policyId]);
  
  useEffect(() => {
    if (words.length > 0 && containerRef.current) {
      // This would be where you'd initialize a word cloud library
      // For example, with react-wordcloud or d3-cloud
      // For simplicity, we'll just render a basic version
    }
  }, [words]);
  
  if (loading) {
    return <div>Loading word cloud...</div>;
  }
  
  if (words.length === 0) {
    return <div>No data available for word cloud</div>;
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
