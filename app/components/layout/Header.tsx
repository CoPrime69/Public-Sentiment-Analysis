'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Sentiment Analysis
            </Link>
          </div>
          
          <nav className="flex space-x-6">
            <Link 
              href="/dashboard" 
              className={`${
                isActive('/dashboard') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              } px-1 py-2`}
            >
              Dashboard
            </Link>
            <Link 
              href="/policies" 
              className={`${
                isActive('/policies') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-blue-600'
              } px-1 py-2`}
            >
              Policies
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
