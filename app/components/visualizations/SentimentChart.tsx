"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  // Legend,
  Tooltip,
  Sector
} from "recharts";

interface TrendData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
}

interface TrendAnalysisProps {
  policyId: string;
  timeframe?: "week" | "month" | "all";
}

// Define the ActiveShapeProps interface based on the props Recharts will provide
// interface ActiveShapeProps {
//   cx: number;
//   cy: number;
//   innerRadius: number;
//   outerRadius: number;
//   startAngle: number;
//   endAngle: number;
//   fill: string;
//   payload: {
//     name: string;
//     value: number;
//     [key: string]: any;
//   };
//   percent: number;
//   value: number;
//   [key: string]: any;
// }

export default function TrendAnalysis({
  policyId,
  timeframe: initialTimeframe = "all",
}: TrendAnalysisProps) {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">(
    initialTimeframe
  );
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    async function fetchTrendData() {
      try {
        const response = await fetch(
          `/api/policies/${policyId}/sentiment?timeframe=${timeframe}`
        );
        const trendData = await response.json();

        // Process data if needed
        const processedData = trendData.map((item: TrendData) => ({
          ...item,
          // Calculate percentages
          positivePercentage:
            item.total > 0 ? Math.round((item.positive / item.total) * 100) : 0,
          negativePercentage:
            item.total > 0 ? Math.round((item.negative / item.total) * 100) : 0,
          neutralPercentage:
            item.total > 0 ? Math.round((item.neutral / item.total) * 100) : 0,
        }));

        setData(processedData);
      } catch (error) {
        console.error("Error fetching trend data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (policyId) {
      setLoading(true);
      fetchTrendData();
    }
  }, [policyId, timeframe]);

  // Prepare data for pie chart - get the latest data point
  const getLatestData = () => {
    if (data.length === 0) return [];

    const latestEntry = data[data.length - 1];
    return [
      {
        name: "Positive",
        value: latestEntry.positivePercentage,
        color: "#22c55e",
      },
      {
        name: "Neutral",
        value: latestEntry.neutralPercentage,
        color: "#3b82f6",
      },
      {
        name: "Negative",
        value: latestEntry.negativePercentage,
        color: "#ef4444",
      },
    ];
  };

  // Get trend summary data
  const getTrendSummary = () => {
    if (data.length === 0) return { positive: 0, neutral: 0, negative: 0 };

    const averages = data.reduce(
      (acc, item) => {
        acc.positive += item.positivePercentage;
        acc.neutral += item.neutralPercentage;
        acc.negative += item.negativePercentage;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    return {
      positive: Math.round(averages.positive / data.length),
      neutral: Math.round(averages.neutral / data.length),
      negative: Math.round(averages.negative / data.length),
    };
  };

  const pieData = getLatestData();
  const trendSummary = getTrendSummary();

  const onPieEnter = (_: unknown, index: number): void => {
    setActiveIndex(index);
  };

  // The renderActiveShape function with proper typing
    const renderActiveShape = (props: any) => {
      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

    return (
      <g>
        <text
          x={cx}
          y={cy - 10}
          dy={8}
          textAnchor="middle"
          fill="#6b7280"
          className="text-xl font-semibold"
        >
          {payload.name}
        </text>
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          fill="#6b7280"
          className="text-2xl font-bold"
        >
          {`${value}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 14}
          fill={fill}
        />
      </g>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-white rounded-lg shadow animate-pulse">
        <div className="flex flex-col items-center">
          <svg
            className="w-10 h-10 text-gray-300 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
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
          <svg
            className="w-12 h-12 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span className="text-gray-500 font-medium">
            No trend data available for the selected timeframe
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row">
          <div className="h-80 w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  paddingAngle={2}
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, ""]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full md:w-1/2 flex flex-col justify-center items-center">
            <h4 className="text-lg font-medium mb-4">Sentiment Summary</h4>
            <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex justify-between">
                <span className="font-medium text-green-800">Positive</span>
                <span className="text-green-800 font-bold">
                  {trendSummary.positive}%
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex justify-between">
                <span className="font-medium text-blue-800">Neutral</span>
                <span className="text-blue-800 font-bold">
                  {trendSummary.neutral}%
                </span>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex justify-between">
                <span className="font-medium text-red-800">Negative</span>
                <span className="text-red-800 font-bold">
                  {trendSummary.negative}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <button
            className={`px-4 py-2 rounded-full transition-all duration-200 font-medium ${
              timeframe === "week"
                ? "bg-blue-600 text-white shadow-md cursor-pointer"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
            }`}
            onClick={() => setTimeframe("week")}
          >
            Last Week
          </button>
          <button
            className={`px-4 py-2 rounded-full transition-all duration-200 font-medium ${
              timeframe === "month"
                ? "bg-blue-600 text-white shadow-md cursor-pointer"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
            }`}
            onClick={() => setTimeframe("month")}
          >
            Last Month
          </button>
          <button
            className={`px-4 py-2 rounded-full transition-all duration-200 font-medium ${
              timeframe === "all"
                ? "bg-blue-600 text-white shadow-md cursor-pointer"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
            }`}
            onClick={() => setTimeframe("all")}
          >
            All Time
          </button>
        </div>
      </div>
    </div>
  );
}