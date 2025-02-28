'use client';

import { Button } from "@/components/ui/button";
import { Contract, ContractStatus } from "@/types/contract";
import { useEffect, useState } from "react";
import Link from "next/link";

export function ContractList() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/contracts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch contracts');
        }
        
        const data = await response.json();
        setContracts(data);
      } catch (error) {
        console.error('Error fetching contracts:', error);
        setError('Unable to load your contracts. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, []);

  // Helper function to get status badge color
  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return "bg-green-100 text-green-800";
      case ContractStatus.COMPLETED:
        return "bg-blue-100 text-blue-800";
      case ContractStatus.FAILED:
        return "bg-red-100 text-red-800";
      case ContractStatus.PENDING_PAYMENT:
        return "bg-yellow-100 text-yellow-800";
      case ContractStatus.DRAFT:
        return "bg-gray-100 text-gray-800";
      case ContractStatus.CANCELLED:
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <h3 className="font-medium text-lg mb-2">No Commitments Yet</h3>
        <p className="text-muted-foreground mb-4">
          You haven't created any commitments yet. Get started by creating your first commitment.
        </p>
        <Button asChild>
          <Link href="/">Create Commitment</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => (
        <div 
          key={contract.id} 
          className="p-4 border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-lg mb-1">{contract.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {contract.description?.substring(0, 120)}
                {contract.description && contract.description.length > 120 ? '...' : ''}
              </p>
              
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  ${contract.amount.toFixed(2)}
                </span>
                <span className="text-muted-foreground">
                  {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                  {contract.status}
                </span>
              </div>
            </div>
            
            <Button 
              asChild 
              variant="outline" 
              size="sm"
            >
              <Link href={`/contracts/${contract.id}`}>View Details</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}