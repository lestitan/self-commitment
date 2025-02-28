import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ContractStatus } from "@/types/contract";

// Helper function to get status badge color
const getStatusColor = (status: string) => {
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

async function getContract(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/contracts/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contract');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching contract:', error);
    return null;
  }
}

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  const contract = await getContract(params.id);
  
  if (!contract) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center p-8 border rounded-lg bg-white shadow">
            <h2 className="text-2xl font-bold mb-4">Contract Not Found</h2>
            <p className="mb-6 text-muted-foreground">
              The contract you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
            {contract.status}
          </span>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-2">{contract.title}</h1>
          
          <div className="flex items-center gap-4 text-sm mb-6">
            <span className="font-medium">Amount: ${contract.amount.toFixed(2)}</span>
            <span className="text-muted-foreground">
              {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
            </span>
          </div>
          
          <div className="border-t pt-4 mb-8">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="whitespace-pre-line">
              {contract.description || "No description provided."}
            </p>
          </div>
          
          <div className="border-t pt-4 mb-8">
            <h2 className="text-xl font-semibold mb-4">Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="mr-4 bg-green-100 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Contract Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(contract.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {contract.status === ContractStatus.PENDING_PAYMENT && (
                <div className="flex items-start">
                  <div className="mr-4 bg-yellow-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Payment Required</p>
                    <p className="text-sm text-muted-foreground">
                      Complete payment to activate your commitment
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-6">
            {contract.status === ContractStatus.PENDING_PAYMENT && (
              <Button className="w-full">Complete Payment to Activate</Button>
            )}
            
            {contract.status === ContractStatus.ACTIVE && (
              <div className="space-y-4">
                <Button className="w-full">Mark as Completed</Button>
                <Button variant="outline" className="w-full">Request Extension</Button>
              </div>
            )}
            
            {contract.status === ContractStatus.COMPLETED && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="font-medium text-green-800 mb-2">Congratulations on completing your commitment!</p>
                <p className="text-sm text-green-700">Would you like to share your success story?</p>
                <Button variant="outline" className="mt-3">Share Success Story</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}