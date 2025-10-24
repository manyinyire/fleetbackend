'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, MinusIcon } from '@heroicons/react/24/outline';

interface BulkSelectProps {
  items: Array<{ id: string; [key: string]: any }>;
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  className?: string;
}

export function BulkSelect({ 
  items, 
  selectedItems, 
  onSelectionChange, 
  className = "" 
}: BulkSelectProps) {
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  useEffect(() => {
    const selectedCount = selectedItems.length;
    const totalCount = items.length;
    
    setIsAllSelected(selectedCount === totalCount && totalCount > 0);
    setIsIndeterminate(selectedCount > 0 && selectedCount < totalCount);
  }, [selectedItems, items]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  };

  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const getCheckboxIcon = () => {
    if (isIndeterminate) {
      return <MinusIcon className="h-4 w-4" />;
    }
    if (isAllSelected) {
      return <CheckIcon className="h-4 w-4" />;
    }
    return null;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Select All Checkbox */}
      <div className="flex items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate;
              }}
              onChange={handleSelectAll}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            {getCheckboxIcon() && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {getCheckboxIcon()}
              </div>
            )}
          </div>
          <span className="ml-2 text-sm font-medium text-gray-700">
            Select All ({selectedItems.length} of {items.length})
          </span>
        </label>
      </div>

      {/* Individual Item Checkboxes */}
      <div className="divide-y divide-gray-200">
        {items.map((item) => (
          <div key={item.id} className="flex items-center px-4 py-3 hover:bg-gray-50">
            <label className="flex items-center cursor-pointer flex-1">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                {selectedItems.includes(item.id) && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <CheckIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1">
                {/* This would be customized based on the item type */}
                <div className="text-sm font-medium text-gray-900">
                  {item.name || item.title || item.registrationNumber || item.fullName || `Item ${item.id}`}
                </div>
                {item.description && (
                  <div className="text-sm text-gray-500">
                    {item.description}
                  </div>
                )}
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}