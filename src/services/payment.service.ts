import { Stripe } from "stripe";
import stripe from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Decimal } from '@prisma/client/runtime/library';
import { RefundStatus } from "@/types/contract";

export interface CreatePaymentIntentParams {
  amount: number; // Amount in dollars
  contractId: string;
  metadata?: Record<string, string>;
}

export interface PaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export class PaymentService {
  /**
   * Create a payment intent for a commitment
   */
  static async createPaymentIntent({
    amount,
    contractId,
    metadata = {},
  }: CreatePaymentIntentParams): Promise<PaymentResponse> {
    try {
      // Validate amount (minimum $0.50)
      if (amount < 0.5) {
        throw new Error("Payment amount must be at least $0.50 USD");
      }

      // Convert amount to cents for Stripe
      const amountInCents = Math.round(amount * 100);

      // Create a payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: {
          contractId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create a payment record associated with this contract
      await prisma.payment.create({
        data: {
          contractId,
          amount: amount, // Store original amount in dollars
          status: "PENDING",
          stripePaymentId: paymentIntent.id,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret as string,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw error;
    }
  }

  /**
   * Handle a successful payment
   */
  static async handleSuccessfulPayment(paymentIntentId: string): Promise<void> {
    try {
      // Find the payment associated with this payment intent
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: paymentIntentId },
        include: { contract: true },
      });

      if (!payment) {
        throw new Error(`No payment found for payment intent: ${paymentIntentId}`);
      }

      // Update the payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
        },
      });

      // Update the associated contract status (if needed)
      await prisma.contract.update({
        where: { id: payment.contractId },
        data: {
          status: "ACTIVE", // Change contract status to active after successful payment
        },
      });

      // Here you could also send confirmation emails or process other business logic
    } catch (error) {
      console.error("Error handling successful payment:", error);
      throw error;
    }
  }

  /**
   * Handle a failed payment
   */
  static async handleFailedPayment(paymentIntentId: string): Promise<void> {
    try {
      // Find the payment associated with this payment intent
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: paymentIntentId },
      });

      if (!payment) {
        throw new Error(`No payment found for payment intent: ${paymentIntentId}`);
      }

      // Update the payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
        },
      });

      // Here you could also send notification emails about payment failure
    } catch (error) {
      console.error("Error handling failed payment:", error);
      throw error;
    }
  }

  /**
   * Retrieve payment intent details
   */
  static async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error(`Error retrieving payment intent ${paymentIntentId}:`, error);
      throw error;
    }
  }

  /**
   * Process a refund for a successful completion
   */
  static async processRefund(paymentIntentId: string): Promise<void> {
    try {
      // Find the payment record
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: paymentIntentId },
      });

      if (!payment) {
        throw new Error(`No payment found for payment intent: ${paymentIntentId}`);
      }

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      // Update payment record using raw update to bypass type checking
      await prisma.$executeRaw`
        UPDATE payments 
        SET refund_id = ${refund.id}, 
            refund_status = ${RefundStatus.PROCESSING}
        WHERE id = ${payment.id}
      `;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }
}