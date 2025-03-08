import { jsPDF } from 'jspdf';
import { ContractStatus } from '@/types/contract';
import { getPDFBase64 } from '@/lib/pdf-generator';

// Mock jsPDF with all required methods from the implementation
const mockJsPDFInstance = {
  setFont: jest.fn(),
  setFontSize: jest.fn(),
  setDrawColor: jest.fn(),
  setFillColor: jest.fn(),
  setLineWidth: jest.fn(),
  rect: jest.fn(),
  roundedRect: jest.fn(),
  text: jest.fn(),
  line: jest.fn(),
  getStringUnitWidth: jest.fn().mockReturnValue(10),
  getFontSize: jest.fn().mockReturnValue(12),
  internal: {
    scaleFactor: 1,
    pageSize: { width: 210, height: 297 },
  },
  output: jest.fn().mockReturnValue('mock-base64-string'),
  save: jest.fn(),
};

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => mockJsPDFInstance),
}));

// Mock jspdf-autotable
jest.mock('jspdf-autotable', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('PDF Generator', () => {
  const mockContract = {
    id: 'test-contract-id',
    title: 'Test Contract',
    description: 'Test Description',
    amount: 100,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    status: ContractStatus.ACTIVE,
    userId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPDFBase64', () => {
    it('generates a base64 PDF string', async () => {
      const result = await getPDFBase64(mockContract);
      
      expect(jsPDF).toHaveBeenCalled();
      expect(result).toBe('mock-base64-string');
    });

    it('includes contract details in the PDF', async () => {
      await getPDFBase64(mockContract);
      
      expect(mockJsPDFInstance.setFont).toHaveBeenCalledWith('times', 'bold');
      expect(mockJsPDFInstance.text).toHaveBeenCalledWith(
        expect.stringContaining('COMMITMENT SCROLL'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('adds decorative border', async () => {
      await getPDFBase64(mockContract);
      
      expect(mockJsPDFInstance.setDrawColor).toHaveBeenCalledWith(139, 69, 19);
      expect(mockJsPDFInstance.rect).toHaveBeenCalled();
    });

    it('handles contracts without optional fields', async () => {
      const minimalContract = {
        ...mockContract,
        description: undefined,
      };

      await expect(getPDFBase64(minimalContract)).resolves.toBe('mock-base64-string');
    });
  });
});