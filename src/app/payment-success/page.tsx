'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ContractService } from '@/services/contract.service';
import { ContractStatus } from '@/types/contract';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { downloadPDF } from '@/lib/pdf-generator';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, isLoaded } = useAuth();
  
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Get contract ID from query params
  const contractId = searchParams.get('contract_id');
  const paymentIntentId = searchParams.get('payment_intent');
  
  useEffect(() => {
    // If we don't have auth or params yet, wait
    if (!isLoaded || !contractId) return;

    // Ensure user is authenticated
    if (!userId) {
      router.push('/sign-in');
      return;
    }

    async function loadContract() {
      try {
        if (!contractId || !userId) return;
        
        // Load contract details
        const contractData = await ContractService.getContract(contractId, userId);
        setContract(contractData);
        
        // If the contract status hasn't been updated yet (this can happen with webhook delays)
        if (contractData && contractData.status === ContractStatus.PENDING_PAYMENT) {
          // Optimistically update contract status on the frontend
          setContract({
            ...contractData,
            status: ContractStatus.ACTIVE
          });
        }
        
      } catch (err) {
        console.error('Error loading contract:', err);
        setError('Unable to load your commitment details. Please check your dashboard.');
      } finally {
        setLoading(false);
      }
    }

    loadContract();
  }, [contractId, userId, isLoaded, router]);

  // Function to download PDF
  const downloadContractPDF = async () => {
    if (!contract) return;
    
    try {
      setDownloadingPdf(true);
      
      // Format contract data for PDF generator
      const pdfData = {
        title: contract.title,
        description: contract.description,
        deadline: contract.endDate,
        stakeAmount: Number(contract.amount),
        userId: contract.userId,
      };
      
      // Download the PDF with a custom filename
      const filename = `commitment-${contract.id.slice(0, 8)}.pdf`;
      downloadPDF(pdfData, filename);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Unable to download your commitment PDF. Please try again later.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Processing Your Commitment</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Something Went Wrong</CardTitle>
            <CardDescription>We encountered an error processing your commitment.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 p-2 text-green-600">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-full w-full" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>Your commitment has been activated</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {contract && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">Commitment Details</h3>
                <p className="text-xl font-semibold mt-1">{contract.title}</p>
                <p className="text-muted-foreground mt-1">{contract.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-lg font-medium">${Number(contract.amount).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-medium text-green-600">{contract.status}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="text-lg font-medium">
                    {new Date(contract.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="text-lg font-medium">
                    {new Date(contract.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="rounded-lg bg-blue-50 p-4 text-blue-800 border border-blue-100">
            <h3 className="font-medium">What's Next?</h3>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Your commitment is now active</li>
              <li>You'll receive an email with your commitment details</li>
              <li>Track your progress on your dashboard</li>
              <li>Complete your commitment by the end date to get your stake back</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button onClick={downloadContractPDF} className="sm:flex-1" disabled={downloadingPdf}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {downloadingPdf ? 'Preparing PDF...' : 'Download Commitment'}
          </Button>
          <Button variant="outline" asChild className="sm:flex-1">
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}