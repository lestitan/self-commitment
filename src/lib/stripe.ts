import { Stripe } from 'stripe';

// Check if we're in development mode and missing a real Stripe key
const isDevMode = process.env.NODE_ENV === 'development';
const hasNoStripeKey = !process.env.STRIPE_SECRET_KEY || 
                     process.env.STRIPE_SECRET_KEY === 'mock_stripe_key';

// Create a mock implementation of Stripe for development without keys
class MockStripe {
  paymentIntents = {
    create: async (options: any) => {
      console.log('MOCK STRIPE: Creating payment intent', options);
      
      return {
        id: `pi_mock_${Math.random().toString(36).substring(2, 10)}`,
        client_secret: `pi_mock_secret_${Math.random().toString(36).substring(2, 10)}`,
        amount: options.amount,
        currency: options.currency,
        status: 'requires_payment_method',
        created: Date.now(),
        metadata: options.metadata || {},
      };
    },
    retrieve: async (id: string) => {
      console.log('MOCK STRIPE: Retrieving payment intent', id);
      
      return {
        id,
        status: 'succeeded', // Always succeed in mock mode
        amount: 1000, // $10.00
        currency: 'usd',
        created: Date.now(),
        client_secret: `${id}_secret_mock`,
        metadata: {},
      };
    },
    update: async (id: string, data: any) => {
      console.log('MOCK STRIPE: Updating payment intent', id, data);
      return { id, ...data };
    },
  };
  
  webhooks = {
    constructEvent: (rawBody: string, signature: string, secret: string) => {
      console.log('MOCK STRIPE: Constructing webhook event');
      
      return {
        id: `evt_mock_${Math.random().toString(36).substring(2, 10)}`,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: `pi_mock_${Math.random().toString(36).substring(2, 10)}`,
            status: 'succeeded',
            amount: 1000,
          },
        },
      };
    },
  };
  
  refunds = {
    create: async (options: any) => {
      console.log('MOCK STRIPE: Creating refund', options);
      
      return {
        id: `re_mock_${Math.random().toString(36).substring(2, 10)}`,
        payment_intent: options.payment_intent,
        amount: 1000, // Default to $10
        status: 'succeeded',
        created: Date.now(),
      };
    },
  };
  
  customers = {
    create: async (options: any) => {
      return {
        id: `cus_mock_${Math.random().toString(36).substring(2, 10)}`,
        email: options.email,
        name: options.name,
        created: Date.now(),
      };
    },
  };
}

// Export either a real Stripe instance or our mock implementation
let stripe: Stripe | any;

if (isDevMode && hasNoStripeKey) {
  console.warn('Using mock Stripe implementation for development');
  stripe = new MockStripe();
} else {
  // Use real Stripe if we have an API key or are in production
  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  stripe = new Stripe(stripeKey, {
    apiVersion: '2025-02-24.acacia', // Use the correct API version
  });
}

export default stripe;