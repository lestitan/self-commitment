"use client";

/**
 * Mock implementation of Stripe Elements for client-side development
 * This allows testing the payment flow without real Stripe API keys
 */
import React, { createContext, useContext, useState } from 'react';
import { Button } from '@/components/ui/button';

// Define types that mimic the Stripe API
export interface MockStripeElements {
  getElement: (type: string) => any;
}

export interface MockStripeElement {
  // Mock element methods
}

export interface MockPaymentIntent {
  id: string;
  client_secret: string;
  status: "succeeded" | "processing" | "requires_payment_method" | "canceled";
  amount: number;
  currency: string;
  created: number;
}

export interface MockStripeError {
  type: string;
  message: string;
  code?: string;
}

export interface MockStripeConfirmPaymentResult {
  paymentIntent?: MockPaymentIntent;
  error?: MockStripeError;
}

export interface MockStripe {
  elements: () => MockStripeElements;
  confirmPayment: (options: {
    elements: MockStripeElements;
    confirmParams?: Record<string, any>;
    redirect?: string;
  }) => Promise<MockStripeConfirmPaymentResult>;
}

// Create a context for our mock Stripe implementation
export const MockStripeContext = createContext<{
  stripe: MockStripe | null;
  elements: MockStripeElements | null;
}>({
  stripe: null,
  elements: null,
});

// Custom hook to use the mock Stripe context
export const useMockStripe = () => useContext(MockStripeContext);

// Mock Stripe elements provider
export const MockStripeElementsProvider: React.FC<{
  children: React.ReactNode;
  clientSecret?: string;
}> = ({ children, clientSecret }) => {
  // Create mock elements
  const mockElements: MockStripeElements = {
    getElement: (type: string) => ({ type }),
  };

  // Create mock stripe instance
  const mockStripe: MockStripe = {
    elements: () => mockElements,
    confirmPayment: async ({ confirmParams }) => {
      return new Promise<MockStripeConfirmPaymentResult>((resolve) => {
        // Simulate network delay
        setTimeout(() => {
          // Generate a mock payment intent with success status
          const paymentIntent: MockPaymentIntent = {
            id: `pi_mock_${Math.random().toString(36).substr(2, 9)}`,
            client_secret: clientSecret || "mock_secret",
            status: "succeeded",
            amount: 1000, // $10.00
            currency: "usd",
            created: Date.now(),
          };
          
          resolve({ paymentIntent });
          
          // You can simulate errors by uncommenting this:
          // resolve({ 
          //   error: { 
          //     type: "card_error", 
          //     message: "Your card was declined." 
          //   } 
          // });
        }, 1000); // Simulate 1 second delay
      });
    },
  };

  return (
    <MockStripeContext.Provider value={{ stripe: mockStripe, elements: mockElements }}>
      {children}
    </MockStripeContext.Provider>
  );
};

// This is a mock implementation of the PaymentElement component
export const MockPaymentElement: React.FC<{ className?: string }> = ({ className }) => {
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242"); // Test card number
  const [expiry, setExpiry] = useState("12/25");
  const [cvc, setCvc] = useState("123");
  const [name, setName] = useState("Test User");
  
  return (
    <div className={`mock-payment-element ${className || ""}`}>
      <div className="p-4 border rounded-md mb-4 bg-gray-50">
        <h4 className="text-sm font-medium mb-2">Mock Payment Form (Test Mode)</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1 text-gray-700">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="4242 4242 4242 4242"
            />
            <div className="text-xs text-gray-500 mt-1">
              Use 4242 4242 4242 4242 for success, 4000 0000 0000 0002 for decline
            </div>
          </div>
          
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm mb-1 text-gray-700">Expiry</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="MM/YY"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1 text-gray-700">CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="123"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-gray-700">Cardholder Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Jane Doe"
            />
          </div>
        </div>
        
        <div className="mt-4 p-2 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
          This is a mock payment form for testing. No real payments will be processed.
        </div>
      </div>
    </div>
  );
};