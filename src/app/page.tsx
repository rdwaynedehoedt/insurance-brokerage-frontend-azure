'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600">Insurance Brokerage</h1>
            <nav className="flex space-x-4">
              <Link href="/demo" className="px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100">
                Demos
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Insurance Brokerage Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Modern insurance brokerage platform with optimized document handling
          </p>
          
          <div className="mt-10">
            <Link 
              href="/demo"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              View Frontend Optimizations Demo
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500">
          &copy; {new Date().getFullYear()} Insurance Brokerage System
        </div>
      </footer>
    </div>
  )
}
