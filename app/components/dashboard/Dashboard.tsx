"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import PolicySelector from "./PolicySelector";
import SentimentOverview from "./SentimentOverview";
import SentimentChart from "../visualizations/SentimentChart";
import TrendAnalysis from "../visualizations/TrendAnalysis";
import WordCloud from "../visualizations/WordCloud";

interface Policy {
  id: string;
  name: string;
  description: string;
  _count: {
    tweets: number;
  };
}

export default function Dashboard() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const response = await fetch("/api/policies");
        const data = await response.json();
        setPolicies(data);
        if (data.length > 0) {
          setSelectedPolicy(data[0]);
        }
      } catch (error) {
        console.error("Error fetching policies:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPolicies();
  }, []);

  const handlePolicyChange = (policy: Policy): void => {
    setSelectedPolicy(policy);
  };

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (policies.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-4">No policies found</h2>
        <p className="mb-4">
          You need to create a policy to start analyzing sentiment.
        </p>
        <Link
          href="/policies"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Policy
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PolicySelector
        policies={policies}
        selectedPolicy={selectedPolicy}
        onChange={handlePolicyChange}
      />

      {selectedPolicy && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SentimentOverview policyId={selectedPolicy.id} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <SentimentChart policyId={selectedPolicy.id} />
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <TrendAnalysis policyId={selectedPolicy.id} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <WordCloud policyId={selectedPolicy.id} />
          </div>
        </>
      )}
    </div>
  );
}