import { PaymentService } from '@/services/payment.service';
import prisma from '@/lib/prisma';
import stripe from '@/lib/stripe';
import { Stripe } from 'stripe';
import { ContractStatus, PaymentStatus } from '@/types/contract';

// Mock Stripe
jest.mock('@/lib/stripe', () => ({
  __esModule: true,
  default: {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    payment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    contract: {
      update: jest.fn(),
    },
  },
}));

describe('PaymentService', () => {
  const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
    id: 'pi_test123',
    client_secret: 'secret_test123',
    amount: 1000, // $10.00
    currency: 'usd',
    status: 'requires_payment_method',
  };

  const mockPayment = {
    id: 'payment_test123',
    contractId: 'contract_test123',
    amount: 10.00,
    status: PaymentStatus.PENDING,
    stripePaymentId: 'pi_test123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('creates a payment intent and records it in the database', async () => {
      (stripe.paymentIntents.create as jest.Mock).mockResolvedValueOnce(mockPaymentIntent);
      (prisma.payment.create as jest.Mock).mockResolvedValueOnce(mockPayment);

      const result = await PaymentService.createPaymentIntent({
        amount: 10.00,
        contractId: 'contract_test123',
      });

      // Check Stripe API call
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000, // Should be converted to cents
        currency: 'usd',
        metadata: {
          contractId: 'contract_test123',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Check database record creation
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: {
          contractId: 'contract_test123',
          amount: 10.00,
          status: 'PENDING',
          stripePaymentId: mockPaymentIntent.id,
        },
      });

      // Check response format
      expect(result).toEqual({
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id,
      });
    });

    it('throws error for amount less than $0.50', async () => {
      await expect(
        PaymentService.createPaymentIntent({
          amount: 0.49,
          contractId: 'contract_test123',
        })
      ).rejects.toThrow('Payment amount must be at least $0.50 USD');

      expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  describe('handleSuccessfulPayment', () => {
    const mockPaymentWithContract = {
      ...mockPayment,
      contract: {
        id: 'contract_test123',
        status: ContractStatus.PENDING_PAYMENT,
      },
    };

    it('updates payment and contract status on successful payment', async () => {
      (prisma.payment.findFirst as jest.Mock).mockResolvedValueOnce(mockPaymentWithContract);
      (prisma.payment.update as jest.Mock).mockResolvedValueOnce({ ...mockPayment, status: PaymentStatus.COMPLETED });
      (prisma.contract.update as jest.Mock).mockResolvedValueOnce({ 
        ...mockPaymentWithContract.contract,
        status: ContractStatus.ACTIVE,
      });

      await PaymentService.handleSuccessfulPayment('pi_test123');

      // Check payment status update
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: mockPayment.id },
        data: { status: 'COMPLETED' },
      });

      // Check contract status update
      expect(prisma.contract.update).toHaveBeenCalledWith({
        where: { id: mockPaymentWithContract.contract.id },
        data: { status: ContractStatus.ACTIVE },
      });
    });

    it('throws error when payment not found', async () => {
      (prisma.payment.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        PaymentService.handleSuccessfulPayment('pi_test123')
      ).rejects.toThrow('No payment found for payment intent: pi_test123');

      expect(prisma.payment.update).not.toHaveBeenCalled();
      expect(prisma.contract.update).not.toHaveBeenCalled();
    });
  });

  describe('handleFailedPayment', () => {
    it('updates payment status on failed payment', async () => {
      (prisma.payment.findFirst as jest.Mock).mockResolvedValueOnce(mockPayment);
      (prisma.payment.update as jest.Mock).mockResolvedValueOnce({ ...mockPayment, status: PaymentStatus.FAILED });

      await PaymentService.handleFailedPayment('pi_test123');

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: mockPayment.id },
        data: { status: 'FAILED' },
      });
    });

    it('throws error when payment not found', async () => {
      (prisma.payment.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        PaymentService.handleFailedPayment('pi_test123')
      ).rejects.toThrow('No payment found for payment intent: pi_test123');

      expect(prisma.payment.update).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentIntent', () => {
    it('retrieves payment intent from Stripe', async () => {
      (stripe.paymentIntents.retrieve as jest.Mock).mockResolvedValueOnce(mockPaymentIntent);

      const result = await PaymentService.getPaymentIntent('pi_test123');

      expect(stripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test123');
      expect(result).toEqual(mockPaymentIntent);
    });

    it('throws error when payment intent not found', async () => {
      const error = new Error('Payment intent not found');
      (stripe.paymentIntents.retrieve as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        PaymentService.getPaymentIntent('pi_test123')
      ).rejects.toThrow(error);
    });
  });
});