import { ContractStatus, PaymentStatus } from '@/types/contract';

describe('Contract Types', () => {
  describe('ContractStatus', () => {
    it('should have all required status values', () => {
      expect(ContractStatus.DRAFT).toBe('DRAFT');
      expect(ContractStatus.PENDING_PAYMENT).toBe('PENDING_PAYMENT');
      expect(ContractStatus.ACTIVE).toBe('ACTIVE');
      expect(ContractStatus.COMPLETED).toBe('COMPLETED');
      expect(ContractStatus.FAILED).toBe('FAILED');
      expect(ContractStatus.CANCELLED).toBe('CANCELLED');
    });
  });

  describe('PaymentStatus', () => {
    it('should have all required payment status values', () => {
      expect(PaymentStatus.PENDING).toBe('PENDING');
      expect(PaymentStatus.COMPLETED).toBe('COMPLETED');
      expect(PaymentStatus.FAILED).toBe('FAILED');
    });
  });
});