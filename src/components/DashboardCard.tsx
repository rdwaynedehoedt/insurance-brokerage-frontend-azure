import React, { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
}

/**
 * A reusable dashboard card component for displaying metrics
 */
export default function DashboardCard({
  title,
  value,
  icon,
  loading = false,
  className = ''
}: DashboardCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          
          {loading ? (
            <div className="animate-pulse mt-2">
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          )}
        </div>
        
        {icon && (
          <div className="bg-blue-50 p-3 rounded-full">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
} 
