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

  /**
   * Verify evidence for contract completion
   */
  static async verifyEvidence(contractId: string, evidence: FormData): Promise<{ verified: boolean; evidenceUrl: string }> {
    try {
      // Here you would:
      // 1. Upload the evidence file to a storage service (e.g., S3)
      // 2. Verify the file type and content
      // 3. Return the result with a URL to the uploaded evidence

      // For now, we'll simulate this process
      const file = evidence.get('file') as File;
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file type
      if (!file.type.startsWith('application/pdf')) {
        throw new Error('Invalid file type');
      }

      // Simulate file upload to storage
      const evidenceUrl = `https://storage.example.com/${contractId}/${file.name}`;

      return {
        verified: true,
        evidenceUrl,
      };
    } catch (error) {
      console.error('Error verifying evidence:', error);
      throw error;
    }
  }
}