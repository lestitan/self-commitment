import { Decimal } from "@prisma/client/runtime/library";

export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface Contract {
  id: string;
  userId: string;
  title: string;
  description?: string;
  // Support both naming conventions (amount and stakeAmount)
  amount?: number | Decimal;
  stakeAmount?: number;
  // Support both date conventions (startDate/endDate and deadline)
  startDate?: Date;
  endDate?: Date;
  deadline?: string | Date;
  status: ContractStatus;
  paymentIntentId?: string;
  paymentStatus?: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ContractCreate = Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: ContractStatus;
};

export type ContractUpdate = Partial<Omit<Contract, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export interface ContractWithPayments extends Contract {
  payments: Payment[];
}

interface Payment {
  id: string;
  amount: number | Decimal;
  status: string;
  stripePaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}