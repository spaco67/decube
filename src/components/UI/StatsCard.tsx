import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: 'teal' | 'amber' | 'purple' | 'blue' | 'green' | 'red';
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  change, 
  icon,
  color = 'teal'
}) => {
  const colorClasses = {
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        {icon && (
          <div className={`p-2 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {typeof value === 'string' && value.startsWith('$') 
            ? `₦${value.slice(1)}` 
            : value}
        </div>
        {change !== undefined && (
          <div className="flex items-center mt-1">
            {change >= 0 ? (
              <TrendingUp size={16} className="text-green-500 mr-1" />
            ) : (
              <TrendingDown size={16} className="text-red-500 mr-1" />
            )}
            <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">vs last week</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;