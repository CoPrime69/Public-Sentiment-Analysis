import Link from "next/link";
import CopyButton from "@/utils/CopyButton";

interface Policy {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  _count: {
    tweets: number;
  };
}

async function getPolicies() {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXTAUTH_URL || "http://localhost:3000"
      : "";

  const res = await fetch(`${baseUrl}/api/policies`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch policies");
  }

  return res.json();
}

export default async function PoliciesPage() {
  let policies: Policy[] = [];

  try {
    policies = await getPolicies();
  } catch (error) {
    console.error("Error fetching policies:", error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Policies Management</h1>
        <Link
          href="/policies/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add New Policy
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Keywords
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tweets
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {policies.length > 0 ? (
              policies.map((policy) => (
                <tr key={policy.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {policy.name}
                    </div>
                    <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs break-all">
                      <div className="font-bold bg-gray-300 mb-[2px] py-[2px] px-[6px] rounded-sm">
                        Policy ID for testing
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="truncate">{policy.id}</span>
                        <CopyButton textToCopy={policy.id} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 line-clamp-2">
                    {policy.description}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {policy.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy._count.tweets}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/policies/${policy.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/policies/${policy.id}/analyze`}
                      className="text-green-600 hover:text-green-900"
                    >
                      Analyze
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No policies found. Create your first policy to start analyzing
                  sentiment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
