'use client';

import { useState } from 'react';
import { 
  CheckIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

interface BulkOperationsProps {
  selectedItems: string[];
  onOperationComplete: (operation: string, results: any) => void;
  availableOperations: BulkOperation[];
  className?: string;
}

export function BulkOperations({ 
  selectedItems, 
  onOperationComplete, 
  availableOperations,
  className = ""
}: BulkOperationsProps) {
  const [showOperations, setShowOperations] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleOperationClick = (operation: BulkOperation) => {
    if (operation.requiresConfirmation) {
      setSelectedOperation(operation);
      setShowConfirmation(true);
    } else {
      executeOperation(operation);
    }
  };

  const executeOperation = async (operation: BulkOperation) => {
    setIsProcessing(true);
    try {
      // Simulate operation execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock results
      const results = {
        success: Math.floor(Math.random() * selectedItems.length) + 1,
        failed: Math.max(0, selectedItems.length - Math.floor(Math.random() * selectedItems.length) - 1),
        total: selectedItems.length
      };
      
      onOperationComplete(operation.id, results);
      setShowOperations(false);
    } catch (error) {
      console.error('Bulk operation error:', error);
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
      setSelectedOperation(null);
    }
  };

  const handleConfirmOperation = () => {
    if (selectedOperation) {
      executeOperation(selectedOperation);
    }
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`bg-indigo-50 border border-indigo-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-indigo-900">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowOperations(!showOperations)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Bulk Actions
            </button>
            
            <button
              onClick={() => onOperationComplete('clear', {})}
              className="text-indigo-600 hover:text-indigo-500"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showOperations && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableOperations.map((operation) => {
              const Icon = operation.icon;
              return (
                <button
                  key={operation.id}
                  onClick={() => handleOperationClick(operation)}
                  disabled={isProcessing}
                  className="flex items-center p-3 text-left bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon className={`h-5 w-5 mr-3 ${operation.color}`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {operation.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {operation.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedOperation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirm Bulk Operation
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {selectedOperation.confirmationMessage || 
                          `Are you sure you want to ${selectedOperation.name.toLowerCase()} ${selectedItems.length} selected item${selectedItems.length !== 1 ? 's' : ''}?`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirmOperation}
                  disabled={isProcessing}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}