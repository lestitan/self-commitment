import '@testing-library/jest-dom';

// Add aliases to jest moduleNameMapper config
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: { id: 'contract_1' },
  }),
  useParams: () => ({ id: 'contract_1' }),
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(() => ({
      create: jest.fn(),
      update: jest.fn(),
      mount: jest.fn(),
      unmount: jest.fn(),
    })),
    confirmPayment: jest.fn(() => Promise.resolve({
      paymentIntent: { status: 'succeeded', id: 'pi_123' },
    })),
  })),
}));

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'mock_stripe_key';
process.env.STRIPE_WEBHOOK_SECRET = 'mock_webhook_secret';