'use client';

import { useState } from 'react';
import { analyzeSentiment } from '@/lib/sentiment';

interface SentimentResult {
  score: number;
  label: string;
  confidence: number;
}

export default function TestSentimentPage() {
  const [text, setText] = useState('The new healthcare policy is making a positive impact. Better access to affordable care means more people can see doctors when they need to.');
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const analyzeText = async () => {
    setLoading(true);
    setError('');
    setSaveSuccess('');
    try {
      const sentimentResult = await analyzeSentiment(text);
      console.log('Sentiment result:', sentimentResult);
      setResult(sentimentResult);
    } catch (err: any) {
      console.error('Error analyzing sentiment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTweet = async () => {
    analyzeText();

    if (!result) {
      setError('Please analyze the text first before saving');
      return;
    }

    setSaveSuccess('');
    setError('');
    
    try {
      const policyId = prompt('Enter the policy ID:');
      if (!policyId) return;
      
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyId,
          tweets: [
            {
              id: `test_${Date.now()}`,
              text: text,
              author_id: 'test_user',
              created_at: new Date().toISOString()
            }
          ],
          // Including the sentiment analysis result directly
          sentimentResult: result
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSaveSuccess(`Tweet saved successfully! ${data.savedCount} tweets processed.`);
      } else {
        setError(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    }
    analyzeText();
  };

  const getSentimentColor = () => {
    if (!result) return 'bg-gray-100';
    switch (result.label) {
      case 'positive': return 'bg-green-50 border-green-200';
      case 'negative': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getSentimentClassification = () => {
    if (!result) return '';
    
    return `${result.label.charAt(0).toUpperCase() + result.label.slice(1)} - Based on our thresholds:
    - 0 to 0.45: Negative
    - 0.45 to 0.55: Neutral
    - 0.55 to 1: Positive`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Test Sentiment Analysis</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Enter text to analyze:</label>
        <textarea 
          className="w-full border p-2 rounded"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      
      <div className="mb-4 flex gap-4">
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          onClick={analyzeText}
          disabled={loading || !text}
        >
          {loading ? 'Analyzing...' : 'Analyze Text'}
        </button>
        
        <button 
          className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          onClick={handleSaveTweet}
          disabled={!result}
        >
          Save as Test Tweet
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {saveSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {saveSuccess}
        </div>
      )}
      
      {result && (
        <div className={`border p-4 rounded ${getSentimentColor()}`}>
          <h2 className="text-xl font-semibold mb-2">Analysis Result:</h2>
          <div>
            <p><strong>Sentiment:</strong> {result.label.charAt(0).toUpperCase() + result.label.slice(1)}</p>
            {/* <p><strong>Raw Score:</strong> {result.score.toFixed(4)}</p>
            <p><strong>Classification:</strong> {getSentimentClassification()}</p> */}
          </div>
        </div>
      )}
    </div>
  );
}