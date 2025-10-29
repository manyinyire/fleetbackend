"use client";

import { useState } from 'react';
import { ImpersonationModal } from '@/components/admin/impersonation';

interface ImpersonationButtonProps {
  tenantId: string;
  tenantName: string;
}

export function ImpersonationButton({ tenantId, tenantName }: ImpersonationButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Impersonate {tenantName}
      </button>
      
      <ImpersonationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantId={tenantId}
      />
    </>
  );
}
