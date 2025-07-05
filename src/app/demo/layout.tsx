'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <Link href="/" className="text-xl font-bold text-blue-600">
                Insurance Brokerage
              </Link>
              <span className="ml-2 text-sm text-gray-500">Demo Pages</span>
            </div>
            
            <nav className="flex space-x-4">
              <Link 
                href="/demo/parallel-upload"
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/demo/parallel-upload')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Parallel Upload Demo
              </Link>
              
              {/* Add more demo links here as needed */}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      
      <footer className="bg-white border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-500">
          Demo pages for frontend optimizations - Insurance Brokerage System
        </div>
      </footer>
    </div>
  );
} 