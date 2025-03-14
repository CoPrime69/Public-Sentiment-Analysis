import { Suspense } from 'react';
import Dashboard from '@/app/components/dashboard/Dashboard';

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Sentiment Analysis Dashboard</h1>
      
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
