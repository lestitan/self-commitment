import { POST } from '@/app/api/payments/webhook/route';
import { PaymentService } from '@/services/payment.service';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock process.env before importing stripe
process.env.STRIPE_SECRET_KEY = 'mock_stripe_key';
process.env.STRIPE_WEBHOOK_SECRET = 'mock_webhook_secret';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    }
  }));
});

// Mock PaymentService
jest.mock('@/services/payment.service', () => ({
  PaymentService: {
    handleSuccessfulPayment: jest.fn(),
    handleFailedPayment: jest.fn(),
  }
}));

describe('Payment Webhook Handler', () => {
  const mockStripeInstance = new Stripe('dummy_key');
  const mockRawBody = 'raw_body_data';
  const mockSignature = 'stripe_signature';

  const mockPaymentIntent: Stripe.PaymentIntent = {
    id: 'pi_123456',
    object: 'payment_intent',
    amount: 1000,
    client_secret: 'secret_test',
    currency: 'usd',
    status: 'succeeded',
    payment_method_types: ['card'],
    created: Date.now(),
    livemode: false,
    metadata: {},
    amount_capturable: 0,
    amount_received: 0,
    application: null,
    automatic_payment_methods: null,
    canceled_at: null,
    cancellation_reason: null,
    capture_method: 'automatic',
    confirmation_method: 'automatic',
    customer: null,
    description: null,
    invoice: null,
    last_payment_error: null,
    latest_charge: null,
    next_action: null,
    on_behalf_of: null,
    payment_method: null,
    payment_method_options: {},
    processing: null,
    receipt_email: null,
    review: null,
    setup_future_usage: null,
    shipping: null,
    statement_descriptor: null,
    statement_descriptor_suffix: null,
    transfer_data: null,
    transfer_group: null,
    application_fee_amount: null,
    payment_method_configuration_details: null,
    source: null
  };

  function createMockRequest(): NextRequest {
    const headers = new Headers();
    headers.append('stripe-signature', mockSignature);
    
    return new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers,
      body: mockRawBody,
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles successful payment event', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_test',
      object: 'event',
      api_version: '2023-10-16',
      created: Date.now(),
      data: {
        object: mockPaymentIntent,
      },
      livemode: false,
      pending_webhooks: 0,
      request: { id: 'req_123', idempotency_key: 'idem_key_123' },
      type: 'payment_intent.succeeded',
    };

    (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

    const response = await POST(createMockRequest());
    
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(PaymentService.handleSuccessfulPayment).toHaveBeenCalledWith('pi_123456');
    expect(PaymentService.handleFailedPayment).not.toHaveBeenCalled();
  });

  it('handles failed payment event', async () => {
    const failedPaymentIntent: Stripe.PaymentIntent = {
      ...mockPaymentIntent,
      status: 'requires_payment_method',
      last_payment_error: {
        code: 'card_declined',
        doc_url: 'https://stripe.com/docs/error-codes/card-declined',
        message: 'Your card was declined',
        payment_method: {
          id: 'pm_123',
          object: 'payment_method',
          billing_details: {
            address: null,
            email: null,
            name: null,
            phone: null
          },
          created: Date.now(),
          customer: null,
          livemode: false,
          metadata: {},
          type: 'card',
        },
        type: 'card_error',
      },
    };

    const mockEvent: Stripe.Event = {
      id: 'evt_test',
      object: 'event',
      api_version: '2023-10-16',
      created: Date.now(),
      data: {
        object: failedPaymentIntent,
      },
      livemode: false,
      pending_webhooks: 0,
      request: { id: 'req_123', idempotency_key: 'idem_key_123' },
      type: 'payment_intent.payment_failed',
    };

    (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

    const response = await POST(createMockRequest());
    
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(PaymentService.handleFailedPayment).toHaveBeenCalledWith('pi_123456');
    expect(PaymentService.handleSuccessfulPayment).not.toHaveBeenCalled();
  });

  it('handles unknown event types gracefully', async () => {
    // Setup mock event with unknown type
    const mockEvent: Stripe.Event = {
      id: 'evt_test',
      object: 'event',
      api_version: '2023-10-16',
      created: Date.now(),
      data: {
        object: mockPaymentIntent,  // Use the complete mockPaymentIntent object
      },
      livemode: false,
      pending_webhooks: 0,
      request: { id: 'req_123', idempotency_key: 'idem_key_123' },
      type: 'payment_intent.created', // Different event type
    };

    // Mock Stripe webhook verification
    (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

    // Execute the webhook handler
    const response = await POST(createMockRequest());
    
    // Verify response still indicates receipt
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });

    // Verify no services were called
    expect(PaymentService.handleSuccessfulPayment).not.toHaveBeenCalled();
    expect(PaymentService.handleFailedPayment).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid webhook signature', async () => {
    // Mock Stripe webhook verification failure
    (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    // Execute the webhook handler
    const response = await POST(createMockRequest());
    
    // Verify error response
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeTruthy();

    // Verify no services were called
    expect(PaymentService.handleSuccessfulPayment).not.toHaveBeenCalled();
    expect(PaymentService.handleFailedPayment).not.toHaveBeenCalled();
  });

  it('returns 500 for service errors', async () => {
    // Setup mock event
    const mockEvent: Stripe.Event = {
      id: 'evt_test',
      object: 'event',
      api_version: '2023-10-16',
      created: Date.now(),
      data: {
        object: mockPaymentIntent,
      },
      livemode: false,
      pending_webhooks: 0,
      request: { id: 'req_123', idempotency_key: 'idem_key_123' },
      type: 'payment_intent.succeeded',
    };

    // Mock Stripe webhook verification
    (mockStripeInstance.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
    
    // Mock service error
    (PaymentService.handleSuccessfulPayment as jest.Mock).mockRejectedValueOnce(
      new Error('Database error')
    );

    // Execute the webhook handler
    const response = await POST(createMockRequest());
    
    // Verify error response
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBeTruthy();
  });
});