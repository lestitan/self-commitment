/**
 * Mock Stripe implementation for development without API keys
 * This provides simulated Stripe functionality for testing the payment flow
 */

export class MockStripe {
  static paymentIntents = {
    create: async ({ amount, currency, metadata, automatic_payment_methods }: any) => {
      console.log('Mock Stripe: Creating payment intent', { amount, currency, metadata });
      
      // Generate a fake payment intent ID with "mock_" prefix
      const id = `mock_pi_${Math.random().toString(36).substring(2, 15)}`;
      
      // Generate a fake client secret
      const client_secret = `${id}_secret_${Math.random().toString(36).substring(2, 10)}`;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id,
        object: 'payment_intent',
        amount,
        client_secret,
        currency,
        status: 'requires_payment_method',
        created: Date.now(),
        metadata,
      };
    },
    
    retrieve: async (id: string) => {
      console.log('Mock Stripe: Retrieving payment intent', id);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!id.startsWith('mock_pi_')) {
        throw new Error(`Mock Stripe: Unknown payment intent ID: ${id}`);
      }
      
      return {
        id,
        object: 'payment_intent',
        amount: 1000, // $10.00
        client_secret: `${id}_secret_123456789`,
        currency: 'usd',
        status: 'succeeded',
        created: Date.now() - 60000, // 1 minute ago
        metadata: {
          contractId: 'mock_contract_123',
        },
      };
    },
  };

  static webhooks = {
    constructEvent: (rawBody: string, signature: string, secret: string) => {
      console.log('Mock Stripe: Constructing webhook event');
      
      // In development, always return a mock successful event
      return {
        id: `evt_${Math.random().toString(36).substring(2, 10)}`,
        object: 'event',
        api_version: '2023-10-16',
        created: Date.now(),
        data: {
          object: {
            id: `mock_pi_${Math.random().toString(36).substring(2, 15)}`,
            object: 'payment_intent',
            amount: 1000,
            currency: 'usd',
            status: 'succeeded',
            client_secret: 'mock_secret',
            metadata: {
              contractId: 'mock_contract_123',
            },
          },
        },
        type: 'payment_intent.succeeded',
      };
    },
  };

  static refunds = {
    create: async ({ payment_intent }: { payment_intent: string }) => {
      console.log('Mock Stripe: Creating refund for', payment_intent);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 700));
      
      return {
        id: `mock_re_${Math.random().toString(36).substring(2, 10)}`,
        object: 'refund',
        amount: 1000,
        payment_intent,
        status: 'succeeded',
        created: Date.now(),
      };
    },
  };
}