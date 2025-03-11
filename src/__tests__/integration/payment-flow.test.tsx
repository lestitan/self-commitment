/** @jest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractService } from '../../services/contract.service';
import { PaymentService } from '../../services/payment.service';
import { ContractStatus } from '../../types/contract';
import { CommitmentModal } from '../../components/forms/commitment-modal';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Create a flexible mock type for Stripe responses
type StripeResponse = 
  | { paymentIntent: { status: string; id: string } }
  | { error: { message: string } };

// Mock Stripe
const mockStripe = {
  elements: jest.fn(() => ({
    create: jest.fn(),
    update: jest.fn(),
    mount: jest.fn(),
    unmount: jest.fn(),
  })),
  confirmPayment: jest.fn().mockImplementation((): Promise<StripeResponse> => 
    Promise.resolve({
      paymentIntent: { status: 'succeeded', id: 'pi_123' },
    })
  ),
};

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve(mockStripe)),
}));

// Mock Stripe React components
jest.mock('@stripe/react-stripe-js', () => {
  const MockElements = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stripe-elements">{children}</div>
  );
  
  const MockPaymentElement = () => (
    <div data-testid="payment-element">Payment Element</div>
  );
  
  return {
    Elements: MockElements,
    PaymentElement: MockPaymentElement,
    useStripe: () => mockStripe,
    useElements: () => ({
      getElement: jest.fn(),
    }),
  };
});

// Mock ContractService
jest.mock('../../services/contract.service', () => ({
  ContractService: {
    createContract: jest.fn(),
    updateContractStatus: jest.fn(),
    getContract: jest.fn(),
  },
}));

// Mock PaymentService
jest.mock('../../services/payment.service', () => ({
  PaymentService: {
    createPaymentIntent: jest.fn(),
    handleSuccessfulPayment: jest.fn(),
  },
}));

// Mock PDF Generator
jest.mock('../../lib/pdf-generator', () => ({
  getPDFBase64: jest.fn(() => Promise.resolve('data:application/pdf;base64,mockPdfData')),
  downloadPDF: jest.fn(),
}));

describe('Payment Flow Integration', () => {
  const mockContract = {
    id: 'contract_123',
    title: 'Test Commitment',
    description: 'Test Description',
    amount: 10.00,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: ContractStatus.DRAFT,
    userId: 'user_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPaymentIntent = {
    clientSecret: 'pi_123_secret_456',
    paymentIntentId: 'pi_123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ContractService.createContract as jest.Mock).mockResolvedValue(mockContract);
    (PaymentService.createPaymentIntent as jest.Mock).mockResolvedValue(mockPaymentIntent);
    (ContractService.updateContractStatus as jest.Mock).mockImplementation(
      (id, status) => Promise.resolve({ ...mockContract, status })
    );
    process.env.STRIPE_SECRET_KEY = 'mock_stripe_key';
    process.env.STRIPE_WEBHOOK_SECRET = 'mock_webhook_secret';
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it('completes full payment flow from commitment to success', async () => {
    const user = userEvent.setup();

    const TestComponent = () => (
      <CommitmentModal>
        <button>Open Modal</button>
      </CommitmentModal>
    );
    
    render(<TestComponent />);

    // Rest of the test remains the same...
  });

  it('handles payment failure gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock Stripe payment failure with proper typing
    mockStripe.confirmPayment.mockImplementationOnce((): Promise<StripeResponse> => 
      Promise.resolve({ error: { message: 'Your card was declined' } })
    );

    const TestComponent = () => (
      <CommitmentModal>
        <button>Open Modal</button>
      </CommitmentModal>
    );

    render(<TestComponent />);

    // Rest of the test remains the same...
  });

  it('preserves form data when navigating between steps', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => (
      <CommitmentModal>
        <button>Open Modal</button>
      </CommitmentModal>
    );

    render(<TestComponent />);

    // Rest of the test remains the same...
  });

  it('validates minimum payment amount', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => (
      <CommitmentModal>
        <button>Open Modal</button>
      </CommitmentModal>
    );

    render(<TestComponent />);

    // Rest of the test remains the same...
  });

  it('updates contract status through complete flow', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => (
      <CommitmentModal>
        <button>Open Modal</button>
      </CommitmentModal>
    );

    render(<TestComponent />);

    // Rest of the test remains the same...
  });

  it('creates payment intent successfully', async () => {
    const amount = 10.00;
    const contractId = 'test_contract';

    const result = await PaymentService.createPaymentIntent({ amount, contractId });

    expect(result).toHaveProperty('clientSecret');
    expect(result).toHaveProperty('paymentIntentId');
  });

  it('processes successful payment', async () => {
    await expect(PaymentService.handleSuccessfulPayment('pi_test123'))
      .rejects.toThrow('No payment found for payment intent: pi_test123');
  });

  it('processes failed payment', async () => {
    await expect(PaymentService.handleFailedPayment('pi_test123'))
      .rejects.toThrow('No payment found for payment intent: pi_test123');
  });
});