import { prisma } from '@/lib/prisma';
import { Contract, ContractCreate, ContractUpdate, ContractStatus } from '@/types/contract';
import { Decimal } from "@prisma/client/runtime/library";

export class ContractService {
  /**
   * Create a new contract
   */
  static async createContract(userId: string, data: ContractCreate) {
    // Ensure all dates are Date objects and not undefined
    const startDate = data.startDate || new Date();
    const endDate = data.endDate || (data.deadline ? new Date(data.deadline) : new Date());

    return prisma.contract.create({
      data: {
        ...data,
        userId,
        startDate,
        endDate,
        status: data.status || ContractStatus.DRAFT,
        amount: new Decimal(data.amount || 0)
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