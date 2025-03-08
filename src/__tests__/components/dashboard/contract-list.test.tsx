import { render, screen } from '@testing-library/react';
import { ContractList } from '@/components/dashboard/contract-list';
import { Contract, ContractStatus } from '@/types/contract';

// Mock next/link since we don't need actual navigation in tests
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="contract-link">
      {children}
    </a>
  );
});

describe('ContractList', () => {
  const mockContracts: Contract[] = [
    {
      id: '1',
      title: 'Test Contract 1',
      description: 'Description 1',
      amount: 100,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: ContractStatus.ACTIVE,
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Test Contract 2',
      description: undefined, // Changed from null to undefined
      amount: 200,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-03-01'),
      status: ContractStatus.PENDING_PAYMENT,
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders empty state when no contracts', () => {
    render(<ContractList contracts={[]} />);
    
    expect(screen.getByText('No commitments found.')).toBeInTheDocument();
  });

  it('renders list of contracts', () => {
    render(<ContractList contracts={mockContracts} />);
    
    // Check if both contracts are rendered
    expect(screen.getByText('Test Contract 1')).toBeInTheDocument();
    expect(screen.getByText('Test Contract 2')).toBeInTheDocument();
    
    // Check descriptions
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('No description provided')).toBeInTheDocument();
    
    // Check amounts
    expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$200\.00/)).toBeInTheDocument();
    
    // Check dates
    expect(screen.getByText('1/1/2024 - 12/31/2024')).toBeInTheDocument();
    expect(screen.getByText('2/1/2024 - 3/1/2024')).toBeInTheDocument();
    
    // Check statuses
    expect(screen.getByText(ContractStatus.ACTIVE)).toBeInTheDocument();
    expect(screen.getByText(ContractStatus.PENDING_PAYMENT)).toBeInTheDocument();
  });

  it('renders links to contract detail pages', () => {
    render(<ContractList contracts={mockContracts} />);
    
    const links = screen.getAllByTestId('contract-link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/contracts/1');
    expect(links[1]).toHaveAttribute('href', '/contracts/2');
  });

  it('applies correct status colors', () => {
    render(<ContractList contracts={mockContracts} />);
    
    const activeStatus = screen.getByText(ContractStatus.ACTIVE);
    const pendingStatus = screen.getByText(ContractStatus.PENDING_PAYMENT);
    
    expect(activeStatus.className).toContain('text-green-600');
    expect(pendingStatus.className).toContain('text-yellow-600');
  });
});