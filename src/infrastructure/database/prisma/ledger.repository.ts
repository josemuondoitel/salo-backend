// Ledger Repository - Prisma Implementation
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import {
  ILedgerRepository,
  CreateLedgerAccountData,
  CreateLedgerTransactionData,
} from '../../../domain/repositories/ledger.repository.interface';
import {
  LedgerAccount,
  LedgerAccountType,
} from '../../../domain/entities/ledger-account.entity';
import {
  LedgerTransaction,
  LedgerEntry,
} from '../../../domain/entities/ledger-transaction.entity';

@Injectable()
export class PrismaLedgerRepository implements ILedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toAccountDomain(data: {
    id: string;
    code: string;
    name: string;
    accountType: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): LedgerAccount {
    return new LedgerAccount({
      id: data.id,
      code: data.code,
      name: data.name,
      accountType: data.accountType as LedgerAccountType,
      description: data.description,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  private toTransactionDomain(data: {
    id: string;
    description: string;
    reference: string | null;
    referenceType: string | null;
    referenceId: string | null;
    idempotencyKey: string;
    createdAt: Date;
    entries: {
      id: string;
      transactionId: string;
      debitAccountId: string;
      creditAccountId: string;
      amount: Prisma.Decimal;
      description: string | null;
      createdAt: Date;
    }[];
  }): LedgerTransaction {
    const entries = data.entries.map(
      (e) =>
        new LedgerEntry({
          id: e.id,
          transactionId: e.transactionId,
          debitAccountId: e.debitAccountId,
          creditAccountId: e.creditAccountId,
          amount: e.amount.toNumber(),
          description: e.description,
          createdAt: e.createdAt,
        }),
    );

    return new LedgerTransaction({
      id: data.id,
      description: data.description,
      reference: data.reference,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      idempotencyKey: data.idempotencyKey,
      entries,
      createdAt: data.createdAt,
    });
  }

  async findAccountById(id: string): Promise<LedgerAccount | null> {
    const account = await this.prisma.ledgerAccount.findUnique({
      where: { id },
    });
    return account ? this.toAccountDomain(account) : null;
  }

  async findAccountByCode(code: string): Promise<LedgerAccount | null> {
    const account = await this.prisma.ledgerAccount.findUnique({
      where: { code },
    });
    return account ? this.toAccountDomain(account) : null;
  }

  async findAllAccounts(): Promise<LedgerAccount[]> {
    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
    return accounts.map((a) => this.toAccountDomain(a));
  }

  async createAccount(data: CreateLedgerAccountData): Promise<LedgerAccount> {
    const account = await this.prisma.ledgerAccount.create({
      data: {
        code: data.code,
        name: data.name,
        accountType: data.accountType,
        description: data.description ?? null,
      },
    });
    return this.toAccountDomain(account);
  }

  async findTransactionById(id: string): Promise<LedgerTransaction | null> {
    const transaction = await this.prisma.ledgerTransaction.findUnique({
      where: { id },
      include: { entries: true },
    });
    return transaction ? this.toTransactionDomain(transaction) : null;
  }

  async findTransactionByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<LedgerTransaction | null> {
    const transaction = await this.prisma.ledgerTransaction.findUnique({
      where: { idempotencyKey },
      include: { entries: true },
    });
    return transaction ? this.toTransactionDomain(transaction) : null;
  }

  async findTransactionsByReference(
    referenceType: string,
    referenceId: string,
  ): Promise<LedgerTransaction[]> {
    const transactions = await this.prisma.ledgerTransaction.findMany({
      where: { referenceType, referenceId },
      include: { entries: true },
      orderBy: { createdAt: 'desc' },
    });
    return transactions.map((t) => this.toTransactionDomain(t));
  }

  async createTransaction(
    data: CreateLedgerTransactionData,
  ): Promise<LedgerTransaction> {
    const transaction = await this.prisma.ledgerTransaction.create({
      data: {
        description: data.description,
        reference: data.reference ?? null,
        referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null,
        idempotencyKey: data.idempotencyKey,
        entries: {
          create: data.entries.map((e) => ({
            debitAccountId: e.debitAccountId,
            creditAccountId: e.creditAccountId,
            amount: e.amount,
            description: e.description ?? null,
          })),
        },
      },
      include: { entries: true },
    });
    return this.toTransactionDomain(transaction);
  }

  async getAccountBalance(
    accountId: string,
  ): Promise<{ debitTotal: number; creditTotal: number; balance: number }> {
    // Sum all entries where this account is debited
    const debitResult = await this.prisma.ledgerEntry.aggregate({
      where: { debitAccountId: accountId },
      _sum: { amount: true },
    });

    // Sum all entries where this account is credited
    const creditResult = await this.prisma.ledgerEntry.aggregate({
      where: { creditAccountId: accountId },
      _sum: { amount: true },
    });

    const debitTotal = debitResult._sum.amount?.toNumber() ?? 0;
    const creditTotal = creditResult._sum.amount?.toNumber() ?? 0;

    return {
      debitTotal,
      creditTotal,
      balance: debitTotal - creditTotal,
    };
  }
}
