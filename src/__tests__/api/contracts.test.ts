import { POST, GET } from '@/app/api/contracts/route';
import { ContractService } from '@/services/contract.service';
import { auth } from '@clerk/nextjs/server';
import { ContractStatus } from '@/types/contract';
import { NextRequest } from 'next/server';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}));

// Mock ContractService
jest.mock('@/services/contract.service', () => ({
  ContractService: {
    createContract: jest.fn(),
    getContracts: jest.fn()
  }
}));

describe('Contract API Routes', () => {
  const mockUserId = 'test-user-id';
  const mockContract = {
    id: 'test-contract-id',
    title: 'Test Contract',
    description: 'Test Description',
    amount: 100,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: ContractStatus.DRAFT,
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ((auth as unknown) as jest.Mock).mockResolvedValue({ userId: mockUserId });
  });

  describe('POST /api/contracts', () => {
    const createRequest = (body: any): NextRequest => {
      return new NextRequest('http://localhost:3000/api/contracts', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    };

    it('creates a contract with valid data', async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const contractData = {
        title: 'Test Contract',
        description: 'Test Description',
        amount: 100,
        startDate,
        endDate
      };

      (ContractService.createContract as jest.Mock).mockResolvedValueOnce(mockContract);

      const response = await POST(createRequest(contractData));
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(ContractService.createContract).toHaveBeenCalledWith(
        mockUserId,
        {
          title: 'Test Contract',
          description: 'Test Description',
          amount: 100,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      );
      expect(data).toEqual(mockContract);
    });

    it('returns 401 when user is not authenticated', async () => {
      ((auth as unknown) as jest.Mock).mockResolvedValueOnce({ userId: null });

      const response = await POST(createRequest({}));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when required fields are missing', async () => {
      const response = await POST(createRequest({
        title: 'Test Contract',
        // Missing required fields
      }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('returns 500 when contract creation fails', async () => {
      (ContractService.createContract as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      const response = await POST(createRequest({
        title: 'Test Contract',
        description: 'Test Description',
        amount: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create contract');
    });
  });

  describe('GET /api/contracts', () => {
    const createRequest = (): NextRequest => {
      return new NextRequest('http://localhost:3000/api/contracts', {
        method: 'GET'
      });
    };

    it('returns contracts for authenticated user', async () => {
      const mockContracts = [mockContract];
      (ContractService.getContracts as jest.Mock).mockResolvedValueOnce(mockContracts);

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(ContractService.getContracts).toHaveBeenCalledWith(mockUserId);
      expect(data).toEqual(mockContracts);
    });

    it('returns 401 when user is not authenticated', async () => {
      ((auth as unknown) as jest.Mock).mockResolvedValueOnce({ userId: null });

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 500 when contract fetch fails', async () => {
      (ContractService.getContracts as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      const response = await GET(createRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch contracts');
    });
  });
});