"use client";

import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { MockStripeElementsProvider, MockPaymentElement } from "./mock-stripe-elements";

// Check if we should use the mock implementation
// The mock will be used if:
// 1. In development environment without a publishable key
// 2. In test environment
// 3. If explicitly requested by setting useMockStripe=true
const shouldUseMockStripe = () => {
  // Check if running in a test environment
  if (typeof window !== 'undefined' && window.location.href.includes('test=true')) {
    return true;
  }
  
  // Check if we have a publishable key
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey || publishableKey.startsWith('pk_test_')) {
    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  }
  
  return false;
};

// Get the Stripe instance with publishable key
let stripePromise: Promise<any> | null = null;
const getStripePromise = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.warn('Stripe publishable key not found. Using mock implementation.');
    return null;
  }
  
  if (!stripePromise && publishableKey) {
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

export interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret?: string;
}

// Export the MockPaymentElement component for use in other parts of the app
export { MockPaymentElement } from "./mock-stripe-elements";

// Stripe Provider component that conditionally uses real or mock implementation
export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  // Decide whether to use the mock or real implementation
  const useMockImplementation = shouldUseMockStripe();
  
  // If no client secret is provided or we're using the mock, render with mock provider
  if (useMockImplementation || !clientSecret) {
    console.info('Using mock Stripe implementation');
    return (
      <MockStripeElementsProvider clientSecret={clientSecret}>
        {children}
      </MockStripeElementsProvider>
    );
  }
  
  // Otherwise use the real Stripe implementation
  const stripePromise = getStripePromise();
  
  if (!stripePromise) {
    console.error('Failed to initialize Stripe');
    return (
      <div className="text-red-500">
        Error: Stripe could not be initialized. Please check your API keys.
      </div>
    );
  }
  
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as 'stripe', // Explicitly cast to the correct type
      variables: {
        colorPrimary: '#6366f1',
      },
    },
  };
  
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}