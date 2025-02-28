export enum ContractStatus {
    DRAFT = 'DRAFT',
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
  }
  
  export interface Contract {
    id: string;
    userId: string;
    title: string;
    description?: string;
    amount: number;
    startDate: Date;
    endDate: Date;
    status: ContractStatus;
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
    amount: number;
    status: string;
    stripePaymentId?: string;
    createdAt: Date;
    updatedAt: Date;
  }