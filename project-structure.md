# Self-Commitment Platform - Project Structure

## Root Files
- `.env` - Environment variables (not tracked in git)
- `components.json` - ShadCN UI configuration
- `docker-compose.yml` - Docker configuration for PostgreSQL and Redis
- `eslint.config.mjs` - ESLint configuration
- `implementation-checklist.md` - Development progress tracking
- `next.config.ts` - Next.js configuration
- `package.json` - Project dependencies
- `postcss.config.mjs` - PostCSS configuration
- `project-structure.md` - This file
- `README.md` - Project documentation
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

## Database (/prisma)
- `schema.prisma` - Database schema definition with User, Contract, Payment, and SuccessStory models
- `/migrations` - Database migrations
  - `20250226152557_init` - Initial migration
  - `20250301230434_make_user_id_optional` - Making userId optional in Contract model
  - `migration_lock.toml` - Lock file for migrations

## Source Code (/src)
- `middleware.ts` - Clerk authentication middleware

### Core Application (/app)
- `layout.tsx` - Root layout component with Clerk provider
- `page.tsx` - Homepage with "Make Commitment" button and commitment flow
- `globals.css` - Global styles
- `favicon.ico` - Site favicon

### Authentication Pages
- `/sign-in/page.tsx` - Sign-in page
- `/sign-up/page.tsx` - Sign-up page
- `/dashboard/page.tsx` - User dashboard with contract listing

### Contract Pages
- `/contracts/[id]/page.tsx` - Contract detail page

### API Routes (/app/api)
- `/contracts/route.ts` - Contract creation and listing endpoints
- `/contracts/[id]/route.ts` - Contract detail, update, and delete endpoints
- `/preview-pdf/route.ts` - PDF preview generation endpoint (server-side)
- `/save-pdf/route.ts` - Save commitment and PDF data endpoint
- `/payments/route.ts` - Payment processing endpoint with Stripe integration
- `/payments/webhook/route.ts` - Stripe webhook handler for payment events

### Components (/components)
- `/forms/commitment-modal.tsx` - Multi-step modal with form, preview, and payment
- `/forms/contract-form.tsx` - Contract creation form for authenticated users
- `/dashboard/contract-list.tsx` - Dashboard contract listing with status indicators
- `/ui/button.tsx` - Button component (shadcn)
- `/ui/card.tsx` - Card component (shadcn)
- `/ui/dialog.tsx` - Dialog/modal component (shadcn)
- `/ui/input.tsx` - Input component (shadcn)
- `/ui/label.tsx` - Label component (shadcn)
- `/ui/textarea.tsx` - Textarea component (shadcn)
- `/ui/nav-bar.tsx` - Navigation bar component with auth states

### Library (/lib)
- `prisma.ts` - Prisma client instance
- `stripe.ts` - Stripe client configuration
- `pdf-generator.ts` - Client-side PDF generator for commitment scrolls
- `pdf-generator-server.ts` - Server-side PDF generator
- `utils.ts` - Utility functions

### Services (/services)
- `contract.service.ts` - Contract business logic with Prisma integration
- `payment.service.ts` - Payment processing with Stripe integration

### Types (/types)
- `contract.ts` - Contract and Payment type definitions with enums

## Public Assets (/public)
- `file.svg`
- `globe.svg`
- `next.svg`
- `vercel.svg`
- `window.svg`

## Development Environment
- `/.vscode/settings.json` - VS Code settings

## Required Dependencies
- `@clerk/nextjs` - Authentication
- `@prisma/client` - Database ORM
- `@stripe/react-stripe-js` - Stripe Elements UI components
- `@stripe/stripe-js` - Stripe client SDK
- `stripe` - Stripe server SDK
- `jspdf` - PDF generation
- `jspdf-autotable` - PDF table support
- `jsdom` - For server-side PDF generation
- `@radix-ui/react-dialog` - Modal dialogs
- `@radix-ui/react-label` - Form labels
- `class-variance-authority` - Component styling variants
- `clsx` - Class name utilities
- `tailwindcss` - CSS framework
- `lucide-react` - Icons

## Environment Variables Needed
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `NEXT_PUBLIC_APP_URL` - Application URL
