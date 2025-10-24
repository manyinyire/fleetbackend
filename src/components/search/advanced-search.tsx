'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.any()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional()
});

type SearchFormData = z.infer<typeof searchSchema>;

interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface AdvancedSearchProps {
  onSearch: (searchData: SearchFormData) => void;
  onClear: () => void;
  filters: FilterOption[];
  placeholder?: string;
  className?: string;
}

export function AdvancedSearch({ 
  onSearch, 
  onClear, 
  filters, 
  placeholder = "Search...",
  className = ""
}: AdvancedSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: '',
      filters: {},
      sortBy: '',
      sortOrder: 'desc'
    }
  });

  const watchedValues = form.watch();

  // Check if there are active filters
  useEffect(() => {
    const hasFilters = Object.values(watchedValues.filters || {}).some(value => 
      value !== undefined && value !== '' && value !== null
    );
    const hasQuery = watchedValues.query && watchedValues.query.trim() !== '';
    const hasDateRange = watchedValues.dateRange?.start || watchedValues.dateRange?.end;
    
    setHasActiveFilters(hasFilters || hasQuery || hasDateRange);
  }, [watchedValues]);

  const handleSubmit = (data: SearchFormData) => {
    onSearch(data);
  };

  const handleClear = () => {
    form.reset({
      query: '',
      filters: {},
      sortBy: '',
      sortOrder: 'desc'
    });
    onClear();
  };

  const handleFilterChange = (key: string, value: any) => {
    const currentFilters = form.getValues('filters') || {};
    form.setValue('filters', {
      ...currentFilters,
      [key]: value
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            {...form.register('query')}
            type="text"
            placeholder={placeholder}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${
            showFilters || hasActiveFilters
              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="h-4 w-4 mr-1" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-indigo-600 bg-indigo-100 rounded-full">
              !
            </span>
          )}
        </button>
        
        <button
          type="button"
          onClick={handleSubmit(form.getValues())}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Search
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Advanced Filters
            </h3>
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                
                {filter.type === 'text' && (
                  <input
                    type="text"
                    placeholder={filter.placeholder}
                    value={form.watch(`filters.${filter.key}`) || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
                
                {filter.type === 'select' && (
                  <select
                    value={form.watch(`filters.${filter.key}`) || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {filter.type === 'date' && (
                  <input
                    type="date"
                    value={form.watch(`filters.${filter.key}`) || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
                
                {filter.type === 'number' && (
                  <input
                    type="number"
                    placeholder={filter.placeholder}
                    value={form.watch(`filters.${filter.key}`) || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
                
                {filter.type === 'boolean' && (
                  <select
                    value={form.watch(`filters.${filter.key}`) || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value === 'true')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                {...form.register('dateRange.start')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                {...form.register('dateRange.end')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                {...form.register('sortBy')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Default</option>
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Updated Date</option>
                <option value="name">Name</option>
                <option value="amount">Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <select
                {...form.register('sortOrder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSubmit(form.getValues())}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}