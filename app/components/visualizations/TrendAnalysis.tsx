'use client';

import { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface TrendData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

interface TrendAnalysisProps {
  policyId: string;
  timeframe?: 'week' | 'month' | 'all';
}

export default function TrendAnalysis({ 
  policyId, 
  timeframe: initialTimeframe = 'week' 
}: TrendAnalysisProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>(initialTimeframe);
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    async function fetchTrendData() {
      try {
        const response = await fetch(`/api/policies/${policyId}/sentiment?timeframe=${timeframe}`);
        const trendData = await response.json();
        const fn = 0;
        // fn++;
        // Process data if needed edeidhe
        const processedData = trendData.map((item: TrendData) => ({
          ...item,
          // Calculate percentages
          positivePercentage: item.total > 0 ? Math.round((item.positive / item.total) * 100) : 0,
          negativePercentage: item.total > 0 ? Math.round((item.negative / item.total) * 100) : 0,
          neutralPercentage: item.total > 0 ? Math.round((item.neutral / item.total) * 100) : 0,
        }));
        
        setData(processedData);
      } catch (error) {
        console.error('Error fetching trend data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (policyId) {
      setLoading(true);
      fetchTrendData();
    }
  }, [policyId, timeframe]);
  
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-white rounded-lg shadow animate-pulse">
        <div className="flex flex-col items-center">
          <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <span className="text-gray-500">Loading trend analysis...</span>
        </div>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-white rounded-lg shadow">
        <div className="flex flex-col items-center">
          <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-gray-500 font-medium">No trend data available for the selected timeframe</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Sentiment Trend Over Time</h3>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }} 
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, '']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              <Area 
                type="monotone" 
                dataKey="positivePercentage" 
                name="Positive" 
                stackId="1"
                stroke="#22c55e" 
                strokeWidth={2}
                fill="url(#colorPositive)" 
              />
              <Area 
                type="monotone" 
                dataKey="neutralPercentage" 
                name="Neutral" 
                stackId="1"
                stroke="#3b82f6" 
                strokeWidth={2} 
                fill="url(#colorNeutral)" 
              />
              <Area 
                type="monotone" 
                dataKey="negativePercentage" 
                name="Negative" 
                stackId="1"
                stroke="#ef4444" 
                strokeWidth={2}
                fill="url(#colorNegative)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 flex justify-center space-x-4">
          <button 
            className={`px-4 py-2 rounded-full transition-all duration-200 font-medium ${
              timeframe === 'week' 
                ? 'bg-blue-600 text-white shadow-md cursor-pointer' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
            }`}
            onClick={() => setTimeframe('week')}
          >
            Last Week
          </button>
          <button 
            className={`px-4 py-2 rounded-full transition-all duration-200 font-medium ${
              timeframe === 'month' 
                ? 'bg-blue-600 text-white shadow-md cursor-pointer' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
            }`}
            onClick={() => setTimeframe('month')}
          >
            Last Month
          </button>
          <button 
            className={`px-4 py-2 rounded-full transition-all duration-200 font-medium ${
              timeframe === 'all' 
                ? 'bg-blue-600 text-white shadow-md cursor-pointer' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
            }`}
            onClick={() => setTimeframe('all')}
          >
            All Time
          </button>
        </div>
      </div>
    </div>
  );
}