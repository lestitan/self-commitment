import { prisma } from '@/lib/prisma';
import { ContractCreate, ContractStatus, ContractUpdate } from '@/types/contract';

export class ContractService {
  /**
   * Create a new contract
   */
  static async createContract(userId: string, data: ContractCreate) {
    return prisma.contract.create({
      data: {
        ...data,
        userId,
        // Default to DRAFT status if not provided
        status: data.status || ContractStatus.DRAFT
      }
    });
  }

  /**
   * Get all contracts for a user
   */
  static async getContracts(userId: string) {
    return prisma.contract.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get a single contract by ID
   */
  static async getContract(id: string, userId: string) {
    return prisma.contract.findFirst({
      where: {
        id,
        userId
      },
      include: {
        payments: true
      }
    });
  }

  /**
   * Update a contract
   */
  static async updateContract(id: string, userId: string, data: ContractUpdate) {
    return prisma.contract.update({
      where: {
        id,
        userId
      },
      data
    });
  }

  /**
   * Delete a contract
   */
  static async deleteContract(id: string, userId: string) {
    return prisma.contract.delete({
      where: {
        id,
        userId
      }
    });
  }

  /**
   * Update contract status
   */
  static async updateContractStatus(id: string, status: ContractStatus) {
    return prisma.contract.update({
      where: {
        id
      },
      data: {
        status
      }
    });
  }
}