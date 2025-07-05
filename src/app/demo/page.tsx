'use client';

import Link from 'next/link';

export default function DemoIndex() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Frontend Optimizations Demo</h1>
      
      <p className="text-gray-600 mb-8">
        This section contains demonstrations of various frontend optimizations 
        implemented in the Insurance Brokerage system.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/demo/parallel-upload" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-blue-600 mb-2">Parallel Upload Demo</h2>
            <p className="text-gray-600 mb-4">
              Demonstrates client-side image compression and parallel document uploads
              for significantly improved performance.
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-500 space-y-1">
              <li>Client-side image compression</li>
              <li>Parallel uploads with concurrency control</li>
              <li>Real-time progress tracking</li>
              <li>Optimized for large batches of files</li>
            </ul>
          </div>
        </Link>
        
        {/* Add more demo cards here as needed */}
      </div>
    </div>
  );
} 