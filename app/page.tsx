import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">
          Public Sentiment Analysis on Governance Policies
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Analyze public opinion on government policies using Twitter data and machine learning
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link 
            href="/dashboard" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-lg"
          >
            View Dashboard
          </Link>
          <Link 
            href="/policies" 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium text-lg"
          >
            Manage Policies
          </Link>
        </div>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Data Collection</h2>
          <p className="text-gray-600">
            Collect tweets related to specific governance policies using the Twitter API and filter them based on relevant keywords.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sentiment Analysis</h2>
          <p className="text-gray-600">
            Analyze the sentiment of collected tweets using state-of-the-art machine learning models from Hugging Face.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Visualization</h2>
          <p className="text-gray-600">
            Visualize sentiment trends over time and gain insights into public opinion on different governance policies.
          </p>
        </div>
      </div>
    </div>
  );
}
