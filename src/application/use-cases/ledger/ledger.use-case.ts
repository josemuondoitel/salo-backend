// Ledger Use Case - Double Entry Accounting
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  ILedgerRepository,
  LEDGER_REPOSITORY,
} from '../../../domain/repositories/ledger.repository.interface';
import { LedgerAccountType } from '../../../domain/entities/ledger-account.entity';
import { LedgerTransaction } from '../../../domain/entities/ledger-transaction.entity';
import { IdempotencyService } from '../../../infrastructure/cache/idempotency.service';

export interface CreateLedgerTransactionDto {
  description: string;
  reference?: string;
  referenceType?: string;
  referenceId?: string;
  entries: {
    debitAccountCode: string;
    creditAccountCode: string;
    amount: number;
    description?: string;
  }[];
}

export interface LedgerTransactionResponseDto {
  id: string;
  description: string;
  reference?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  totalAmount: number;
  entries: {
    id: string;
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    description?: string | null;
  }[];
  createdAt: Date;
}

export interface AccountBalanceDto {
  accountId: string;
  accountCode: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

// Standard account codes for SALO
export const LEDGER_ACCOUNTS = {
  CASH: 'CASH',
  ACCOUNTS_RECEIVABLE: 'AR',
  SUBSCRIPTION_REVENUE: 'SUB_REV',
  PLATFORM_FEES: 'PLATFORM_FEES',
  RESTAURANT_PAYABLE: 'REST_PAY',
} as const;

@Injectable()
export class LedgerUseCase {
  constructor(
    @Inject(LEDGER_REPOSITORY)
    private readonly ledgerRepository: ILedgerRepository,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Initialize standard ledger accounts
   */
  async initializeAccounts(): Promise<void> {
    const accounts = [
      {
        code: LEDGER_ACCOUNTS.CASH,
        name: 'Cash',
        accountType: LedgerAccountType.ASSET,
      },
      {
        code: LEDGER_ACCOUNTS.ACCOUNTS_RECEIVABLE,
        name: 'Accounts Receivable',
        accountType: LedgerAccountType.ASSET,
      },
      {
        code: LEDGER_ACCOUNTS.SUBSCRIPTION_REVENUE,
        name: 'Subscription Revenue',
        accountType: LedgerAccountType.REVENUE,
      },
      {
        code: LEDGER_ACCOUNTS.PLATFORM_FEES,
        name: 'Platform Fees Revenue',
        accountType: LedgerAccountType.REVENUE,
      },
      {
        code: LEDGER_ACCOUNTS.RESTAURANT_PAYABLE,
        name: 'Restaurant Payable',
        accountType: LedgerAccountType.LIABILITY,
      },
    ];

    for (const account of accounts) {
      const existing = await this.ledgerRepository.findAccountByCode(
        account.code,
      );
      if (!existing) {
        await this.ledgerRepository.createAccount(account);
      }
    }
  }

  /**
   * Record subscription payment - Double entry
   * Debit: Cash (increase asset)
   * Credit: Subscription Revenue (increase revenue)
   */
  async recordSubscriptionPayment(
    subscriptionId: string,
    amount: number,
    idempotencyKey: string,
  ): Promise<LedgerTransactionResponseDto> {
    // Check idempotency
    const existingResult = await this.idempotencyService.check(idempotencyKey);
    if (existingResult.exists && existingResult.response) {
      return existingResult.response.body as LedgerTransactionResponseDto;
    }

    // Check if transaction already exists
    const existingTransaction =
      await this.ledgerRepository.findTransactionByIdempotencyKey(
        idempotencyKey,
      );
    if (existingTransaction) {
      return this.toResponseDto(existingTransaction);
    }

    // Get accounts
    const cashAccount = await this.ledgerRepository.findAccountByCode(
      LEDGER_ACCOUNTS.CASH,
    );
    const revenueAccount = await this.ledgerRepository.findAccountByCode(
      LEDGER_ACCOUNTS.SUBSCRIPTION_REVENUE,
    );

    if (!cashAccount || !revenueAccount) {
      throw new BadRequestException('Ledger accounts not initialized');
    }

    // Create double-entry transaction
    const transaction = await this.ledgerRepository.createTransaction({
      description: `Subscription payment for subscription ${subscriptionId}`,
      reference: `SUB-${subscriptionId}`,
      referenceType: 'Subscription',
      referenceId: subscriptionId,
      idempotencyKey,
      entries: [
        {
          debitAccountId: cashAccount.id,
          creditAccountId: revenueAccount.id,
          amount,
          description: 'Subscription payment received',
        },
      ],
    });

    const response = this.toResponseDto(transaction);

    // Store idempotency result
    await this.idempotencyService.store(idempotencyKey, 201, response);

    return response;
  }

  /**
   * Get transactions by reference
   */
  async getTransactionsByReference(
    referenceType: string,
    referenceId: string,
  ): Promise<LedgerTransactionResponseDto[]> {
    const transactions =
      await this.ledgerRepository.findTransactionsByReference(
        referenceType,
        referenceId,
      );
    return transactions.map((t) => this.toResponseDto(t));
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountCode: string): Promise<AccountBalanceDto> {
    const account = await this.ledgerRepository.findAccountByCode(accountCode);
    if (!account) {
      throw new BadRequestException(`Account ${accountCode} not found`);
    }

    const balance = await this.ledgerRepository.getAccountBalance(account.id);

    return {
      accountId: account.id,
      accountCode: account.code,
      ...balance,
    };
  }

  /**
   * Verify ledger is balanced (sum of all debits = sum of all credits)
   * This is a key invariant for double-entry accounting
   */
  async verifyLedgerBalance(): Promise<{
    isBalanced: boolean;
    totalDebits: number;
    totalCredits: number;
  }> {
    const accounts = await this.ledgerRepository.findAllAccounts();

    let totalDebits = 0;
    let totalCredits = 0;

    for (const account of accounts) {
      const balance = await this.ledgerRepository.getAccountBalance(account.id);
      totalDebits += balance.debitTotal;
      totalCredits += balance.creditTotal;
    }

    return {
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01, // Allow for floating point errors
      totalDebits,
      totalCredits,
    };
  }

  private toResponseDto(
    transaction: LedgerTransaction,
  ): LedgerTransactionResponseDto {
    return {
      id: transaction.id,
      description: transaction.description,
      reference: transaction.reference,
      referenceType: transaction.referenceType,
      referenceId: transaction.referenceId,
      totalAmount: transaction.totalAmount(),
      entries: transaction.entries.map((e) => ({
        id: e.id,
        debitAccountId: e.debitAccountId,
        creditAccountId: e.creditAccountId,
        amount: e.amount,
        description: e.description,
      })),
      createdAt: transaction.createdAt,
    };
  }
}
