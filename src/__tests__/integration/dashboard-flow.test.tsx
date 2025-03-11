/** @jest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractService } from '@/services/contract.service';
import { ContractStatus } from '@/types/contract';
import DashboardPage from '@/app/dashboard/page';
import { useRouter } from 'next/navigation';

// Mock next/navigation
const mockRouter = {
  push: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
}));

// Mock Clerk
const ClerkProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(() => ({ userId: 'user_123' })),
  useAuth: jest.fn(() => ({ userId: 'user_123', isLoaded: true })),
  ClerkProvider,
}));

// Mock ContractService
jest.mock('@/services/contract.service', () => ({
  ContractService: {
    getContracts: jest.fn(),
    getContract: jest.fn(),
    updateContract: jest.fn(),
  },
}));

describe('Dashboard Flow Integration', () => {
  const mockContracts = [
    {
      id: 'contract_1',
      title: 'Active Commitment',
      description: 'This is active',
      amount: 10.00,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: ContractStatus.ACTIVE,
      userId: 'user_123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'contract_2',
      title: 'Completed Commitment',
      description: 'This is completed',
      amount: 20.00,
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: ContractStatus.COMPLETED,
      userId: 'user_123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (ContractService.getContracts as jest.Mock).mockResolvedValue(mockContracts);
  });

  it('loads and displays user commitments', async () => {
    const user = userEvent.setup();
    
    render(<DashboardPage />);

    // Verify contracts are loaded and displayed
    await waitFor(() => {
      expect(screen.getByText('Active Commitment')).toBeInTheDocument();
      expect(screen.getByText('Completed Commitment')).toBeInTheDocument();
    });

    // Verify contract details
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('$20.00')).toBeInTheDocument();
    expect(screen.getByText(ContractStatus.ACTIVE)).toBeInTheDocument();
    expect(screen.getByText(ContractStatus.COMPLETED)).toBeInTheDocument();
  });

  it('navigates to contract detail page', async () => {
    const user = userEvent.setup();
    const router = useRouter();
    
    render(<DashboardPage />);

    // Wait for contracts to load
    await waitFor(() => {
      expect(screen.getByText('Active Commitment')).toBeInTheDocument();
    });

    // Click on a contract
    await user.click(screen.getByText('Active Commitment'));

    // Verify navigation
    expect(router.push).toHaveBeenCalledWith('/contracts/contract_1');
  });

  it('filters contracts by status', async () => {
    const user = userEvent.setup();
    
    render(<DashboardPage />);

    // Wait for contracts to load
    await waitFor(() => {
      expect(screen.getByText('Active Commitment')).toBeInTheDocument();
    });

    // Click status filter
    await user.click(screen.getByRole('combobox', { name: /filter by status/i }));
    await user.click(screen.getByRole('option', { name: ContractStatus.ACTIVE }));

    // Verify filtered results
    expect(screen.getByText('Active Commitment')).toBeInTheDocument();
    expect(screen.queryByText('Completed Commitment')).not.toBeInTheDocument();
  });

  it('sorts contracts by different criteria', async () => {
    const user = userEvent.setup();
    
    render(<DashboardPage />);

    // Wait for contracts to load
    await waitFor(() => {
      expect(screen.getByText('Active Commitment')).toBeInTheDocument();
    });

    // Sort by amount
    await user.click(screen.getByRole('button', { name: /sort by amount/i }));

    // Verify sort order
    const amounts = screen.getAllByText(/\$\d+\.\d{2}/);
    expect(amounts[0]).toHaveTextContent('$20.00');
    expect(amounts[1]).toHaveTextContent('$10.00');
  });

  it('updates contract status when expired', async () => {
    // Mock an expired contract
    const expiredContract = {
      ...mockContracts[0],
      endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    };
    
    (ContractService.getContracts as jest.Mock).mockResolvedValueOnce([expiredContract]);
    (ContractService.updateContract as jest.Mock).mockResolvedValueOnce({
      ...expiredContract,
      status: ContractStatus.FAILED,
    });

    render(<DashboardPage />);

    // Verify status update
    await waitFor(() => {
      expect(ContractService.updateContract).toHaveBeenCalledWith(
        expiredContract.id,
        { status: ContractStatus.FAILED }
      );
      expect(screen.getByText(ContractStatus.FAILED)).toBeInTheDocument();
    });
  });

  it('handles pagination of contracts', async () => {
    const user = userEvent.setup();
    
    // Mock paginated data
    const page1 = mockContracts;
    const page2 = [
      {
        id: 'contract_3',
        title: 'Another Commitment',
        status: ContractStatus.PENDING_PAYMENT,
        // ... other contract fields
      },
    ];

    (ContractService.getContracts as jest.Mock)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    render(<DashboardPage />);

    // Wait for first page
    await waitFor(() => {
      expect(screen.getByText('Active Commitment')).toBeInTheDocument();
    });

    // Navigate to next page
    await user.click(screen.getByRole('button', { name: /next page/i }));

    // Verify second page
    await waitFor(() => {
      expect(screen.getByText('Another Commitment')).toBeInTheDocument();
      expect(screen.queryByText('Active Commitment')).not.toBeInTheDocument();
    });
  });
});