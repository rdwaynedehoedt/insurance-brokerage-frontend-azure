'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LoginForm from '@/components/auth/LoginForm';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const { isLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <LoadingOverlay isLoading={isLoading} message="Preparing your dashboard..." />
      
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <Image 
                src="/images/insureme-logo-pwsimg-849.jpg" 
                alt="InsureMe Insurance Brokerage" 
                width={120} 
                height={60} 
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">InsureMe Insurance Brokerage</h1>
          </div>
          
          <div>
            <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">
              Sign in
            </h2>
            <p className="text-center text-sm text-gray-600 mb-6">
              Access your dashboard
            </p>
          </div>

          {mounted && <LoginForm />}
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact your administrator
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 
