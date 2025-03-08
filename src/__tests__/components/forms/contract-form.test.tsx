import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContractForm } from '@/components/forms/contract-form';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import userEvent from '@testing-library/user-event';

// Mock the clerk auth hook
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn()
}));

// Mock the next router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

describe('ContractForm', () => {
  const mockRouter = {
    push: jest.fn()
  };

  const mockAuth = {
    userId: 'test-user-id'
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<ContractForm />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<ContractForm />);

    const form = screen.getByRole('form');

    // Clear default values and set invalid values
    fireEvent.input(screen.getByLabelText(/title/i), { 
      target: { value: '' } 
    });
    fireEvent.input(screen.getByLabelText(/amount/i), { 
      target: { value: '0' } 
    });

    // Submit the form
    fireEvent.submit(form);

    // Wait for the validation error messages
    await waitFor(() => {
      expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'test-contract-id' })
    });
    global.fetch = mockFetch;

    render(<ContractForm />);
    
    const form = screen.getByRole('form');

    // Fill in form fields
    fireEvent.input(screen.getByLabelText(/title/i), { 
      target: { value: 'Test Contract' } 
    });
    fireEvent.input(screen.getByLabelText(/description/i), { 
      target: { value: 'Test Description' } 
    });
    fireEvent.input(screen.getByLabelText(/amount/i), { 
      target: { value: '100' } 
    });

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 7);

    fireEvent.input(screen.getByLabelText(/start date/i), { 
      target: { value: today.toISOString().split('T')[0] } 
    });
    fireEvent.input(screen.getByLabelText(/end date/i), { 
      target: { value: futureDate.toISOString().split('T')[0] } 
    });

    // Submit the form
    fireEvent.submit(form);

    // Wait for the fetch call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/contracts', expect.any(Object));
    });

    // Verify redirect
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });
});