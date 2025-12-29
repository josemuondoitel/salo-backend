// Domain Repository Interface - Ledger
import {
  LedgerAccount,
  LedgerAccountType,
} from '../entities/ledger-account.entity';
import { LedgerTransaction } from '../entities/ledger-transaction.entity';

export interface CreateLedgerAccountData {
  code: string;
  name: string;
  accountType: LedgerAccountType;
  description?: string | null;
}

export interface CreateLedgerEntryData {
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  description?: string | null;
}

export interface CreateLedgerTransactionData {
  description: string;
  reference?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  idempotencyKey: string;
  entries: CreateLedgerEntryData[];
}

export interface ILedgerRepository {
  // Account operations
  findAccountById(id: string): Promise<LedgerAccount | null>;
  findAccountByCode(code: string): Promise<LedgerAccount | null>;
  findAllAccounts(): Promise<LedgerAccount[]>;
  createAccount(data: CreateLedgerAccountData): Promise<LedgerAccount>;

  // Transaction operations (append-only - no updates/deletes)
  findTransactionById(id: string): Promise<LedgerTransaction | null>;
  findTransactionByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<LedgerTransaction | null>;
  findTransactionsByReference(
    referenceType: string,
    referenceId: string,
  ): Promise<LedgerTransaction[]>;
  createTransaction(
    data: CreateLedgerTransactionData,
  ): Promise<LedgerTransaction>;

  // Balance calculations
  getAccountBalance(
    accountId: string,
  ): Promise<{ debitTotal: number; creditTotal: number; balance: number }>;
}

export const LEDGER_REPOSITORY = Symbol('LEDGER_REPOSITORY');
