"use client";

interface Policy {
  id: string;
  name: string;
  description: string;
  _count: {
    tweets: number;
  };
}

interface PolicySelectorProps {
  policies: Policy[];
  selectedPolicy: Policy | null;
  onChange: (policy: Policy) => void;
}

export default function PolicySelector({
  policies,
  selectedPolicy,
  onChange,
}: PolicySelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Select Policy</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg cursor-pointer transition-colors">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className={`border rounded-lg p-4 transition-colors ${
                selectedPolicy?.id === policy.id
                  ? "border-blue-500 bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => onChange(policy)}
            >
              <h3 className="font-medium text-lg">{policy.name}</h3>
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                {policy.description}
              </p>
              <div className="mt-2 text-sm text-gray-500">
                {policy._count.tweets} tweets analyzed
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <a
          href="/policies"
          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
        >
          Manage Policies →
        </a>
      </div>
    </div>
  );
}
