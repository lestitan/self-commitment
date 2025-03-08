import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommitmentModal } from '@/components/forms/commitment-modal';
import { useRouter } from 'next/navigation';
import { getPDFBase64, downloadPDF } from '@/lib/pdf-generator';
import { loadStripe } from '@stripe/stripe-js';
import * as stripeJs from '@stripe/react-stripe-js';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock PDF generation
jest.mock('@/lib/pdf-generator', () => ({
  getPDFBase64: jest.fn(),
  downloadPDF: jest.fn()
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn()
}));

// Mock Stripe React components
jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stripe-elements">{children}</div>
  ),
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  useStripe: jest.fn(),
  useElements: jest.fn()
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('CommitmentModal', () => {
  const mockRouter = {
    push: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (getPDFBase64 as jest.Mock).mockResolvedValue('data:application/pdf;base64,mockedPdfBase64Data');
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000'
      },
      writable: true
    });

    // Mock successful fetch responses
    mockFetch.mockImplementation(async (url) => {
      if (url === '/api/save-pdf') {
        return {
          ok: true,
          json: async () => ({ contractId: 'mock-contract-id' })
        };
      } 
      if (url === '/api/payments') {
        return {
          ok: true,
          json: async () => ({ clientSecret: 'mock-client-secret' })
        };
      }
      return { ok: false };
    });
  });

  it('renders the modal with initial form step', () => {
    render(
      <CommitmentModal>
        <button>Open Modal</button>
      </CommitmentModal>
    );
    
    // Modal is initially closed
    expect(screen.getByText('Open Modal')).toBeInTheDocument();
    
    // Open the modal
    fireEvent.click(screen.getByText('Open Modal'));
    
    // Check if modal content is shown
    expect(screen.getByText('Create Your Commitment')).toBeInTheDocument();
    expect(screen.getByLabelText(/goal/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/deadline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stake amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preview commitment/i })).toBeInTheDocument();
  });

  it('validates required form fields', async () => {
    render(
      <CommitmentModal>
        <button>Open Modal</button>
      </CommitmentModal>
    );
    
    // Open the modal
    fireEvent.click(screen.getByText('Open Modal'));
    
    // Try to proceed without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /preview commitment/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Please fill out all required fields')).toBeInTheDocument();
    });
  });

  it('validates minimum stake amount', async () => {
    render(
      <CommitmentModal>
        <button>Open Modal</button>
      </CommitmentModal>
    );
    
    // Open the modal
    fireEvent.click(screen.getByText('Open Modal'));
    
    // Fill form with invalid stake amount
    fireEvent.change(screen.getByLabelText(/goal/i), { target: { value: 'Test Goal' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: '2025-12-31' } });
    fireEvent.change(screen.getByLabelText(/stake amount/i), { target: { value: '0.4' } });
    
    // Try to proceed
    fireEvent.click(screen.getByRole('button', { name: /preview commitment/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Minimum stake amount is $0.50 USD')).toBeInTheDocument();
    });
  });

  it('proceeds to PDF preview when form is valid', async () => {
    render(
      <CommitmentModal>
        <button>Open Modal</button>
      </CommitmentModal>
    );
    
    // Open the modal
    fireEvent.click(screen.getByText('Open Modal'));
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/goal/i), { target: { value: 'Test Goal' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Test Description' } });
    fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: '2025-12-31' } });
    fireEvent.change(screen.getByLabelText(/stake amount/i), { target: { value: '10' } });
    
    // Proceed to preview
    fireEvent.click(screen.getByRole('button', { name: /preview commitment/i }));
    
    // Check if PDF preview is shown
    await waitFor(() => {
      expect(screen.getByText('Your Commitment Scroll')).toBeInTheDocument();
      expect(screen.getByText('Review your commitment scroll before proceeding to payment.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /proceed to payment/i })).toBeInTheDocument();
    });
    
    // Verify PDF generation was called
    expect(getPDFBase64).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Test Goal',
      description: 'Test Description',
      deadline: '2025-12-31',
      stakeAmount: 10
    }));
  });

  it('allows downloading PDF from preview step', async () => {
    render(
      <CommitmentModal>
        <button>Open Modal</button>
      </CommitmentModal>
    );
    
    // Open the modal and fill form
    fireEvent.click(screen.getByText('Open Modal'));
    fireEvent.change(screen.getByLabelText(/goal/i), { target: { value: 'Test Goal' } });
    fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: '2025-12-31' } });
    fireEvent.change(screen.getByLabelText(/stake amount/i), { target: { value: '10' } });
    
    // Proceed to preview
    fireEvent.click(screen.getByRole('button', { name: /preview commitment/i }));
    
    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText('Your Commitment Scroll')).toBeInTheDocument();
    });
    
    // Click download button
    fireEvent.click(screen.getByRole('button', { name: /download pdf/i }));
    
    // Verify download function was called
    expect(downloadPDF).toHaveBeenCalled();
  });

  it('proceeds to payment after preview', async () => {
    render(
      <CommitmentModal>
        <button>Open Modal</button>
      </CommitmentModal>
    );
    
    // Open the modal and fill form
    fireEvent.click(screen.getByText('Open Modal'));
    fireEvent.change(screen.getByLabelText(/goal/i), { target: { value: 'Test Goal' } });
    fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: '2025-12-31' } });
    fireEvent.change(screen.getByLabelText(/stake amount/i), { target: { value: '10' } });
    
    // Proceed to preview
    fireEvent.click(screen.getByRole('button', { name: /preview commitment/i }));
    
    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText('Your Commitment Scroll')).toBeInTheDocument();
    });
    
    // Click proceed to payment button
    fireEvent.click(screen.getByRole('button', { name: /proceed to payment/i }));
    
    // Check if payment step is shown
    await waitFor(() => {
      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText('Secure your commitment with a payment.')).toBeInTheDocument();
    });
    
    // Verify API calls were made
    expect(mockFetch).toHaveBeenCalledWith('/api/save-pdf', expect.any(Object));
    expect(mockFetch).toHaveBeenCalledWith('/api/payments', expect.any(Object));
  });

  it('handles back navigation between steps', async () => {
    render(
      <CommitmentModal>
        <button>Open Modal</button>
      </CommitmentModal>
    );
    
    // Open the modal and fill form
    fireEvent.click(screen.getByText('Open Modal'));
    fireEvent.change(screen.getByLabelText(/goal/i), { target: { value: 'Test Goal' } });
    fireEvent.change(screen.getByLabelText(/deadline/i), { target: { value: '2025-12-31' } });
    fireEvent.change(screen.getByLabelText(/stake amount/i), { target: { value: '10' } });
    
    // Proceed to preview
    fireEvent.click(screen.getByRole('button', { name: /preview commitment/i }));
    
    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText('Your Commitment Scroll')).toBeInTheDocument();
    });
    
    // Go back to form
    fireEvent.click(screen.getByRole('button', { name: /back to form/i }));
    
    // Check if back on form step
    await waitFor(() => {
      expect(screen.getByText('Create Your Commitment')).toBeInTheDocument();
    });
  });
});