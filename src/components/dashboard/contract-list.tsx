'use client';

import { Card } from "@/components/ui/card";
import { Contract, ContractStatus } from "@/types/contract";
import Link from "next/link";

interface ContractListProps {
  contracts: Contract[];
}

export function ContractList({ contracts }: ContractListProps) {
  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return "text-green-600";
      case ContractStatus.PENDING_PAYMENT:
        return "text-yellow-600";
      case ContractStatus.COMPLETED:
        return "text-blue-600";
      case ContractStatus.FAILED:
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (!contracts.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No commitments found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {contracts.map((contract) => (
        <Link key={contract.id} href={`/contracts/${contract.id}`}>
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{contract.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {contract.description || "No description provided"}
                </p>
              </div>
              <div className={`text-sm font-medium ${getStatusColor(contract.status)}`}>
                {contract.status}
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm text-muted-foreground">
              <div>
                Amount: $
                {contract.amount ? 
                  Number(contract.amount).toFixed(2) : 
                  "0.00"
                }
              </div>
              <div>
                {contract.startDate && contract.endDate ? (
                  `${new Date(contract.startDate).toLocaleDateString()} - ${new Date(contract.endDate).toLocaleDateString()}`
                ) : (
                  "Date range not set"
                )}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}