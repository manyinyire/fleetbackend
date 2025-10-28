'use client';

import { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface SearchResult {
  id: string;
  type: 'vehicle' | 'driver' | 'remittance' | 'expense' | 'income';
  title: string;
  subtitle: string;
  description?: string;
  status?: string;
  date?: string;
  amount?: number;
  metadata?: Record<string, any>;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

export function SearchResults({ 
  results, 
  query, 
  isLoading = false, 
  onResultClick,
  className = ""
}: SearchResultsProps) {
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vehicle':
        return '🚗';
      case 'driver':
        return '👤';
      case 'remittance':
        return '💰';
      case 'expense':
        return '💸';
      case 'income':
        return '📈';
      default:
        return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vehicle':
        return 'bg-blue-100 text-blue-800';
      case 'driver':
        return 'bg-green-100 text-green-800';
      case 'remittance':
        return 'bg-yellow-100 text-yellow-800';
      case 'expense':
        return 'bg-red-100 text-red-800';
      case 'income':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'inactive':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result.id);
    if (onResultClick) {
      onResultClick(result);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Searching...</span>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6 text-center">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {query ? `No results found for "${query}"` : 'Try searching for something'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Search Results
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {results.length} result{results.length !== 1 ? 's' : ''} found for &quot;{query}&quot;
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {results.map((result) => (
          <div
            key={result.id}
            onClick={() => handleResultClick(result)}
            className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
              selectedResult === result.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                  <span className="text-lg">{getTypeIcon(result.type)}</span>
                </div>
              </div>
              
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {result.title}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                      {result.type}
                    </span>
                    {result.status && (
                      <div className="flex items-center">
                        {getStatusIcon(result.status)}
                        <span className="ml-1 text-xs text-gray-500 capitalize">
                          {result.status}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {result.amount && (
                      <span className="font-medium">
                        ${result.amount.toLocaleString()}
                      </span>
                    )}
                    {result.date && (
                      <span>
                        {new Date(result.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="mt-1 text-sm text-gray-600">
                  {result.subtitle}
                </p>
                
                {result.description && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {result.description}
                  </p>
                )}
                
                {result.metadata && Object.keys(result.metadata).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(result.metadata).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {results.length > 10 && (
        <div className="px-6 py-3 bg-gray-50 text-center">
          <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
            Load more results
          </button>
        </div>
      )}
    </div>
  );
}