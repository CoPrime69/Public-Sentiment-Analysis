'use client';

import { useState, useEffect } from 'react';

interface SentimentStats {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

interface SentimentOverviewProps {
  policyId: string;
}

export default function SentimentOverview({ policyId }: SentimentOverviewProps) {
  const [stats, setStats] = useState<SentimentStats>({
    positive: 0,
    negative: 0,
    neutral: 0,
    total: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    async function fetchSentimentStats() {
      try {
        const response = await fetch(`/api/sentiment/stats?policyId=${policyId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sentiment stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching sentiment stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (policyId) {
      fetchSentimentStats();
    }
  }, [policyId]);
  
  if (loading) {
    return (
      <div className="col-span-3 p-4 bg-white rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  const getPercentage = (value: number) => {
    if (stats.total === 0) return 0;
    return Math.round((value / stats.total) * 100);
  };
  
  return (
    <>
      <div className="col-span-3 md:col-span-1">
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <span className="text-green-600 text-3xl font-bold">{getPercentage(stats.positive)}%</span>
          </div>
          <h3 className="text-lg font-medium">Positive</h3>
          <p className="text-gray-500">{stats.positive} tweets</p>
        </div>
      </div>
      
      <div className="col-span-3 md:col-span-1">
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <span className="text-blue-600 text-3xl font-bold">{getPercentage(stats.neutral)}%</span>
          </div>
          <h3 className="text-lg font-medium">Neutral</h3>
          <p className="text-gray-500">{stats.neutral} tweets</p>
        </div>
      </div>
      
      <div className="col-span-3 md:col-span-1">
        <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <span className="text-red-600 text-3xl font-bold">{getPercentage(stats.negative)}%</span>
          </div>
          <h3 className="text-lg font-medium">Negative</h3>
          <p className="text-gray-500">{stats.negative} tweets</p>
        </div>
      </div>
    </>
  );
}
