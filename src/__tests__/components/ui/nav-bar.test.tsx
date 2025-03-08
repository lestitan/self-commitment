import { render, screen, within } from '@testing-library/react';
import { NavBar } from '@/components/ui/nav-bar';
import * as clerk from '@clerk/nextjs';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock Clerk components
jest.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button">User Button</div>,
  SignedIn: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-in">{children}</div>
  ),
  SignedOut: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-out">{children}</div>
  ),
}));

describe('NavBar', () => {
  it('renders the brand name and home link', () => {
    render(<NavBar />);
    
    expect(screen.getByText('Self-Commitment')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders dashboard link when signed in', () => {
    render(<NavBar />);
    
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('renders auth buttons when signed out', () => {
    render(<NavBar />);
    
    const signedOutSection = screen.getByTestId('signed-out');
    expect(signedOutSection).toBeInTheDocument();
    expect(within(signedOutSection).getByText('Sign In')).toBeInTheDocument();
    expect(within(signedOutSection).getByText('Sign Up')).toBeInTheDocument();
  });

  it('renders user button when signed in', () => {
    render(<NavBar />);
    
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    render(<NavBar />);
    
    // Check home link
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
    
    // Check dashboard link
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    
    // Check auth links
    const signInLink = screen.getByText('Sign In').closest('a');
    expect(signInLink).toHaveAttribute('href', '/sign-in');
    
    const signUpLink = screen.getByText('Sign Up').closest('a');
    expect(signUpLink).toHaveAttribute('href', '/sign-up');
  });
});