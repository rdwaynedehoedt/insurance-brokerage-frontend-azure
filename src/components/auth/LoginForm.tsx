'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    // Add basic environment information for debugging
    if (process.env.NODE_ENV !== 'development') {
      const info = {
        env: process.env.NODE_ENV,
        apiBase: process.env.NEXT_PUBLIC_API_BASE ? 'SET' : 'NOT_SET',
        hasApiToken: process.env.NEXT_PUBLIC_API_TOKEN ? 'YES' : 'NO'
      };
      setDebugInfo(JSON.stringify(info));
    }
    
    // Security check for credentials in URL
    const hasEmailInUrl = searchParams.has('email');
    const hasPasswordInUrl = searchParams.has('password');
    
    if (hasEmailInUrl || hasPasswordInUrl) {
      setSecurityWarning('Security warning: Never use URLs with credentials. This is insecure!');
      
      // We can pre-fill the email but NEVER the password for security reasons
      if (hasEmailInUrl) {
        setFormData(prev => ({
          ...prev,
          email: searchParams.get('email') || ''
        }));
      }
      
      // Remove credentials from URL by redirecting to a clean one
      router.replace('/login');
    }
  }, [searchParams, router]);

  const validateForm = () => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);

    // Email validation
    if (!formData.email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure default form submission is prevented
    if (e && e.preventDefault) e.preventDefault();
    
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);

    try {
      await login({
        email: formData.email,
        password: formData.password,
      }, true); // Always remember user
    } catch (error) {
      // Error handling
      if (error instanceof Error) {
        // Set error state for display
        if (error.message.includes('401') || error.message.includes('credentials')) {
          setError('Invalid email or password');
        } else if (error.message.includes('403') || error.message.includes('active')) {
          setError('Your account is not active. Please contact administrator.');
        } else {
          setError('An error occurred. Please try again later.');
        }
        
        // Add a small delay to ensure the error is displayed before any other action
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        setError('An unexpected error occurred');
      }
      
      // Stop any potential redirect that might be causing a refresh
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
    if (name === 'email' && emailError) setEmailError(null);
    if (name === 'password' && passwordError) setPasswordError(null);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Add a debug click handler to log hidden debug info to console
  const handleDebugClick = () => {
    console.log('Debug info:', debugInfo);
    console.log('API Base:', process.env.NEXT_PUBLIC_API_BASE);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
      {securityWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{securityWarning}</p>
            </div>
          </div>
        </div>
      )}
      
      {debugInfo && process.env.NODE_ENV !== 'development' && (
        <div onClick={handleDebugClick} className="text-xs text-gray-300 text-center cursor-pointer">
          v1.0.1
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={formData.email}
              onChange={handleChange}
              className={`pl-10 block w-full rounded-lg border ${
                emailError || error 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
              } px-4 py-3 text-gray-800 placeholder-gray-400 
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-20`}
              placeholder="Email"
              disabled={isLoading}
              aria-invalid={emailError ? 'true' : 'false'}
              aria-describedby={emailError ? 'email-error' : undefined}
            />
          </div>
          {emailError && (
            <p id="email-error" className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {emailError}
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className={`pl-10 pr-10 block w-full rounded-lg border ${
                passwordError || error 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
              } px-4 py-3 text-gray-800 placeholder-gray-400 
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-20`}
              placeholder="Password"
              disabled={isLoading}
              aria-invalid={passwordError ? 'true' : 'false'}
              aria-describedby={passwordError ? 'password-error' : undefined}
            />
            <button 
              type="button" 
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {passwordError && (
            <p id="password-error" className="text-sm text-red-600 mt-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {passwordError}
            </p>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
        >
          {isLoading ? (
            <>
              <span className="sr-only">Loading...</span>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </div>
    </form>
  );
} 