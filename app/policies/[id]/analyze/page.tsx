"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchTweetsByKeywords, saveTweetsForPolicy } from "@/lib/twitter";
import { useParams } from "next/navigation";

export default function AnalyzePolicyPage() {
  // Use the useParams hook instead of directly accessing params
  const params = useParams();
  const policyId = params.id as string;

  const router = useRouter();
  const [policy, setPolicy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  
  // Add states for real-time updates
  const [progress, setProgress] = useState({
    stage: "",
    generatedCount: 0,
    processedCount: 0,
    savedCount: 0,
    duplicatesFiltered: 0,
    total: 0
  });

  useEffect(() => {
    async function fetchPolicy() {
      try {
        const response = await fetch(`/api/policies/${policyId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch policy");
        }
        const data = await response.json();
        setPolicy(data);
      } catch (err: unknown) {
        const errMessage = typeof err === "string" ? err : err instanceof Error ? err.message : "Unknown error";
        setError(errMessage);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPolicy();
  }, [policyId]);

  const handleCollectTweets = async () => {
    setIsCollecting(true);
    setError("");
    setResult(null);
    setProgress({
      stage: "Generating tweets...",
      generatedCount: 0,
      processedCount: 0,
      savedCount: 0,
      duplicatesFiltered: 0,
      total: 0
    });

    try {
      // Fetch tweets using the policy keywords AND description
      setProgress(prev => ({ ...prev, stage: "Generating tweets..." }));
      const twitterData = await fetchTweetsByKeywords(
        policy.keywords, 
        policy.id,
        policy.description,
        20 // Generate 20 tweets each time for better variety
      );

      if (!twitterData.data || twitterData.data.length === 0) {
        setResult({
          success: true,
          message: "No new tweets found for the specified keywords.",
          count: 0,
        });
        setIsCollecting(false);
        return;
      }

      // Update progress after generation
      setProgress(prev => ({ 
        ...prev, 
        stage: "Processing tweets...",
        generatedCount: twitterData.meta?.generated_count || twitterData.data.length,
        duplicatesFiltered: twitterData.meta?.duplicates_filtered || 0,
        total: twitterData.data.length 
      }));

      // Process tweets in batches to show progress
      const tweets = twitterData.data;
      const batchSize = 5;
      let savedCount = 0;

      for (let i = 0; i < tweets.length; i += batchSize) {
        const batch = tweets.slice(i, i + batchSize);
        
        // Save this batch
        const saveResult = await saveTweetsForPolicy(policy.id, batch);
        savedCount += saveResult.savedCount;
        
        // Update progress
        setProgress(prev => ({ 
          ...prev, 
          processedCount: Math.min(i + batchSize, tweets.length),
          savedCount: savedCount
        }));
        
        // Short delay to show progress update
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Final result
      setResult({
        success: true,
        message: `Successfully collected and analyzed tweets.`,
        count: savedCount,
      });
      
      // Also update the policy tweet count
      setPolicy({
        ...policy,
        _count: {
          ...policy._count,
          tweets: policy._count.tweets + savedCount
        }
      });
      
    } catch (err: unknown) {
      const errMessage = typeof err === 'string' ? err : err instanceof Error ? err.message : 'An error occurred';

      if (errMessage.includes("rate limit")) {
        setError(
          "API rate limit reached. Please try again in a few minutes."
        );
      } else {
        setError(errMessage);
      }
    } finally {
      setIsCollecting(false);
      setProgress(prev => ({ ...prev, stage: "Complete" }));
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading policy data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
        <div className="mt-4">
          <button
            onClick={() => router.push("/policies")}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Back to Policies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analyze Policy: {policy.name}</h1>
        <button
          onClick={() => router.push("/policies")}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Back to Policies
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Policy Details</h2>
        <p className="mb-4">{policy.description}</p>

        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {policy.keywords.map((keyword: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Stats</h3>
          <p className="text-gray-700">
            Total tweets collected:{" "}
            <span className="font-semibold">{policy._count.tweets}</span>
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          Collect and Analyze Tweets
        </h2>
        <p className="mb-4">
          Click the button below to collect new tweets based on the policy
          keywords and analyze their sentiment.
        </p>

        <button
          onClick={handleCollectTweets}
          disabled={isCollecting}
          className={`cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
            isCollecting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isCollecting ? "Collecting Tweets..." : "Collect and Analyze Tweets"}
        </button>

        {/* Real-time progress updates */}
        {isCollecting && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-semibold mb-2">Processing Status</h3>
            <p className="mb-2">{progress.stage}</p>
            
            {progress.generatedCount > 0 && (
              <div className="mb-2">
                <p>Generated {progress.generatedCount} tweets 
                  {progress.duplicatesFiltered > 0 ? 
                    ` (${progress.duplicatesFiltered} duplicates filtered)` : ''}</p>
              </div>
            )}
            
            {progress.total > 0 && (
              <div className="mb-2">
                <p>Processing: {progress.processedCount} of {progress.total} tweets</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(progress.processedCount / progress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {progress.savedCount > 0 && (
              <p className="font-medium text-blue-700">
                Saved {progress.savedCount} new tweets so far
              </p>
            )}
          </div>
        )}

        {result && !isCollecting && (
          <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <h3 className="font-semibold mb-2">Collection Complete</h3>
            <p>{result.message}</p>
            <p className="mt-2">
              {result.count > 0
                ? `Added ${result.count} new tweets to the database.`
                : "No new tweets were added."}
            </p>
            {result.count > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => router.push(`/dashboard?policy=${policy.id}`)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                  View Analysis
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}