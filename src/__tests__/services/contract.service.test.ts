import { ContractService } from '@/services/contract.service';
import { ContractStatus } from '@/types/contract';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    contract: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('ContractService', () => {
  const mockUserId = 'test-user-id';
  const mockContract = {
    id: 'test-contract-id',
    title: 'Test Contract',
    description: 'Test Description',
    amount: new Decimal(100),
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: ContractStatus.DRAFT,
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createContract', () => {
    it('creates a contract with valid data', async () => {
      (prisma.contract.create as jest.Mock).mockResolvedValueOnce(mockContract);

      const result = await ContractService.createContract(mockUserId, {
        title: mockContract.title,
        description: mockContract.description,
        amount: mockContract.amount,
        startDate: mockContract.startDate,
        endDate: mockContract.endDate,
        userId: mockUserId
      });

      expect(prisma.contract.create).toHaveBeenCalled();
      expect(result).toEqual(mockContract);
    });

    it('creates a contract with minimum required data', async () => {
      (prisma.contract.create as jest.Mock).mockResolvedValueOnce(mockContract);

      const result = await ContractService.createContract(mockUserId, {
        title: mockContract.title,
        amount: mockContract.amount,
        userId: mockUserId
      });

      expect(prisma.contract.create).toHaveBeenCalled();
      expect(result).toEqual(mockContract);
    });
  });

  describe('getContracts', () => {
    it('returns all contracts for a user', async () => {
      (prisma.contract.findMany as jest.Mock).mockResolvedValueOnce([mockContract]);

      const result = await ContractService.getContracts(mockUserId);

      expect(prisma.contract.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockContract]);
    });
  });

  describe('getContract', () => {
    it('returns a specific contract', async () => {
      (prisma.contract.findFirst as jest.Mock).mockResolvedValueOnce(mockContract);

      const result = await ContractService.getContract(mockContract.id, mockUserId);

      expect(prisma.contract.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockContract.id,
          userId: mockUserId,
        },
        include: {
          payments: true,
        },
      });
      expect(result).toEqual(mockContract);
    });
  });

  describe('updateContract', () => {
    it('updates a contract with valid data', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };
      
      (prisma.contract.update as jest.Mock).mockResolvedValueOnce({
        ...mockContract,
        ...updateData,
      });

      const result = await ContractService.updateContract(
        mockContract.id,
        mockUserId,
        updateData
      );

      expect(prisma.contract.update).toHaveBeenCalledWith({
        where: {
          id: mockContract.id,
          userId: mockUserId,
        },
        data: updateData,
      });
      expect(result.title).toBe(updateData.title);
      expect(result.description).toBe(updateData.description);
    });
  });

  describe('updateContractStatus', () => {
    it('updates contract status', async () => {
      const newStatus = ContractStatus.ACTIVE;
      
      (prisma.contract.update as jest.Mock).mockResolvedValueOnce({
        ...mockContract,
        status: newStatus,
      });

      const result = await ContractService.updateContractStatus(
        mockContract.id,
        newStatus
      );

      expect(prisma.contract.update).toHaveBeenCalledWith({
        where: { id: mockContract.id },
        data: { status: newStatus },
      });
      expect(result.status).toBe(newStatus);
    });
  });
});