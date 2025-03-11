/** @jest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractService } from '@/services/contract.service';
import { PaymentService } from '@/services/payment.service';
import { ContractStatus } from '@/types/contract';
import ContractDetailPage from '@/app/contracts/[id]/page';

// Mock next/navigation
const mockRouter = {
  push: jest.fn(),
  query: { id: 'contract_1' },
};

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
  useParams: jest.fn(() => ({ id: 'contract_1' })),
}));

// Mock Clerk
const ClerkProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(() => ({ userId: 'user_123' })),
  useAuth: jest.fn(() => ({ userId: 'user_123', isLoaded: true })),
  ClerkProvider,
}));

// Mock ContractService with verifyEvidence
jest.mock('@/services/contract.service', () => ({
  ContractService: {
    getContract: jest.fn(),
    updateContract: jest.fn(),
    verifyEvidence: jest.fn(),
  },
}));

// Mock PaymentService with processRefund
jest.mock('@/services/payment.service', () => ({
  PaymentService: {
    processRefund: jest.fn(),
  },
}));

describe('Contract Completion Flow Integration', () => {
  const mockContract = {
    id: 'contract_1',
    title: 'Active Commitment',
    description: 'Complete this task',
    amount: 50.00,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: ContractStatus.ACTIVE,
    userId: 'user_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    evidenceRequired: true,
    evidenceUrl: null,
    payments: [{
      id: 'payment_1',
      amount: 50.00,
      status: 'COMPLETED',
      stripePaymentId: 'pi_123',
    }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ContractService.getContract as jest.Mock).mockResolvedValue(mockContract);
  });

  it('completes full contract completion flow with evidence', async () => {
    const user = userEvent.setup();
    
    // Mock file upload
    const file = new File(['evidence'], 'evidence.pdf', { type: 'application/pdf' });
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    
    render(<ContractDetailPage params={{ id: 'contract_1' }} />);

    // Wait for contract to load
    await waitFor(() => {
      expect(screen.getByText('Active Commitment')).toBeInTheDocument();
    });

    // Upload evidence
    const fileInput = screen.getByLabelText(/upload evidence/i);
    await user.upload(fileInput, file);

    // Submit evidence
    await user.click(screen.getByRole('button', { name: /submit evidence/i }));

    // Verify evidence verification
    expect(ContractService.verifyEvidence).toHaveBeenCalledWith(
      'contract_1',
      expect.any(FormData)
    );

    // Mock successful verification
    (ContractService.verifyEvidence as jest.Mock).mockResolvedValueOnce({
      verified: true,
      evidenceUrl: 'https://example.com/evidence.pdf',
    });

    // Wait for status update
    await waitFor(() => {
      expect(ContractService.updateContract).toHaveBeenCalledWith(
        'contract_1',
        {
          status: ContractStatus.COMPLETED,
          evidenceUrl: 'https://example.com/evidence.pdf',
        }
      );
    });

    // Verify refund process
    expect(PaymentService.processRefund).toHaveBeenCalledWith('pi_123');

    // Verify success message
    expect(screen.getByText(/commitment completed successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/refund initiated/i)).toBeInTheDocument();
  });

  it('handles evidence verification failure', async () => {
    const user = userEvent.setup();
    
    render(<ContractDetailPage params={{ id: 'contract_1' }} />);

    // Wait for contract to load
    await waitFor(() => {
      expect(screen.getByText('Active Commitment')).toBeInTheDocument();
    });

    // Upload invalid evidence
    const file = new File(['invalid'], 'invalid.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/upload evidence/i);
    await user.upload(fileInput, file);

    // Submit evidence
    await user.click(screen.getByRole('button', { name: /submit evidence/i }));

    // Mock verification failure
    (ContractService.verifyEvidence as jest.Mock).mockRejectedValueOnce(
      new Error('Invalid file type')
    );

    // Verify error handling
    await waitFor(() => {
      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
    });

    // Verify contract status wasn't updated
    expect(ContractService.updateContract).not.toHaveBeenCalled();
    expect(PaymentService.processRefund).not.toHaveBeenCalled();
  });

  it('handles automatic completion for contracts without evidence', async () => {
    const noEvidenceContract = {
      ...mockContract,
      evidenceRequired: false,
    };
    (ContractService.getContract as jest.Mock).mockResolvedValueOnce(noEvidenceContract);
    
    render(<ContractDetailPage params={{ id: 'contract_1' }} />);

    // Wait for contract to load
    await waitFor(() => {
      expect(screen.getByText('Active Commitment')).toBeInTheDocument();
    });

    // Click complete button
    const completeButton = screen.getByRole('button', { name: /complete commitment/i });
    await userEvent.click(completeButton);

    // Verify direct completion
    expect(ContractService.updateContract).toHaveBeenCalledWith(
      'contract_1',
      { status: ContractStatus.COMPLETED }
    );

    // Verify refund process
    expect(PaymentService.processRefund).toHaveBeenCalledWith('pi_123');
  });

  it('prevents completion before end date', async () => {
    const earlyContract = {
      ...mockContract,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
    };
    (ContractService.getContract as jest.Mock).mockResolvedValueOnce(earlyContract);
    
    render(<ContractDetailPage params={{ id: 'contract_1' }} />);

    // Verify completion not allowed
    await waitFor(() => {
      const completeButton = screen.getByRole('button', { name: /complete commitment/i });
      expect(completeButton).toBeDisabled();
      expect(screen.getByText(/cannot complete before end date/i)).toBeInTheDocument();
    });
  });

  it('shows refund status and transaction details', async () => {
    const completedContract = {
      ...mockContract,
      status: ContractStatus.COMPLETED,
      payments: [{
        ...mockContract.payments[0],
        refundId: 're_123',
        refundStatus: 'PROCESSING',
      }],
    };
    (ContractService.getContract as jest.Mock).mockResolvedValueOnce(completedContract);
    
    render(<ContractDetailPage params={{ id: 'contract_1' }} />);

    // Verify refund information is displayed
    await waitFor(() => {
      expect(screen.getByText(/refund status: processing/i)).toBeInTheDocument();
      expect(screen.getByText(/refund id: re_123/i)).toBeInTheDocument();
    });
  });
});