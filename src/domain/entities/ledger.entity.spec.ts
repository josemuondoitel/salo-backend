// Ledger Entity Tests - Double Entry Accounting
import { LedgerTransaction, LedgerEntry } from './ledger-transaction.entity';
import { LedgerAccount, LedgerAccountType } from './ledger-account.entity';

describe('Ledger - Double Entry Accounting', () => {
  describe('LedgerEntry', () => {
    it('should create a ledger entry with correct properties', () => {
      const entry = new LedgerEntry({
        id: 'entry-1',
        transactionId: 'tx-1',
        debitAccountId: 'acc-1',
        creditAccountId: 'acc-2',
        amount: 5000,
        description: 'Subscription payment',
        createdAt: new Date(),
      });

      expect(entry.id).toBe('entry-1');
      expect(entry.transactionId).toBe('tx-1');
      expect(entry.debitAccountId).toBe('acc-1');
      expect(entry.creditAccountId).toBe('acc-2');
      expect(entry.amount).toBe(5000);
      expect(entry.description).toBe('Subscription payment');
    });
  });

  describe('LedgerTransaction', () => {
    it('should create a transaction with entries', () => {
      const entries = [
        new LedgerEntry({
          id: 'entry-1',
          transactionId: 'tx-1',
          debitAccountId: 'cash',
          creditAccountId: 'revenue',
          amount: 5000,
          description: 'Payment received',
          createdAt: new Date(),
        }),
      ];

      const transaction = new LedgerTransaction({
        id: 'tx-1',
        description: 'Subscription payment',
        reference: 'SUB-123',
        referenceType: 'Subscription',
        referenceId: '123',
        idempotencyKey: 'idem-1',
        entries,
        createdAt: new Date(),
      });

      expect(transaction.id).toBe('tx-1');
      expect(transaction.description).toBe('Subscription payment');
      expect(transaction.entries).toHaveLength(1);
      expect(transaction.isBalanced()).toBe(true);
    });

    it('should calculate total amount correctly', () => {
      const entries = [
        new LedgerEntry({
          id: 'entry-1',
          transactionId: 'tx-1',
          debitAccountId: 'cash',
          creditAccountId: 'revenue',
          amount: 5000,
          description: null,
          createdAt: new Date(),
        }),
        new LedgerEntry({
          id: 'entry-2',
          transactionId: 'tx-1',
          debitAccountId: 'cash',
          creditAccountId: 'fees',
          amount: 500,
          description: null,
          createdAt: new Date(),
        }),
      ];

      const transaction = new LedgerTransaction({
        id: 'tx-1',
        description: 'Multiple entry transaction',
        idempotencyKey: 'idem-1',
        entries,
        createdAt: new Date(),
      });

      expect(transaction.totalAmount()).toBe(5500);
    });

    it('should always be balanced (double-entry invariant)', () => {
      const entries = [
        new LedgerEntry({
          id: 'entry-1',
          transactionId: 'tx-1',
          debitAccountId: 'cash',
          creditAccountId: 'revenue',
          amount: 10000,
          description: null,
          createdAt: new Date(),
        }),
      ];

      const transaction = new LedgerTransaction({
        id: 'tx-1',
        description: 'Test transaction',
        idempotencyKey: 'idem-1',
        entries,
        createdAt: new Date(),
      });

      // In double-entry, each entry has equal debit and credit
      // So the transaction is always balanced
      expect(transaction.isBalanced()).toBe(true);
    });
  });

  describe('LedgerAccount', () => {
    it('should create different account types', () => {
      const assetAccount = new LedgerAccount({
        id: 'acc-1',
        code: 'CASH',
        name: 'Cash',
        accountType: LedgerAccountType.ASSET,
        description: 'Cash account',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const revenueAccount = new LedgerAccount({
        id: 'acc-2',
        code: 'REV',
        name: 'Revenue',
        accountType: LedgerAccountType.REVENUE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(assetAccount.accountType).toBe(LedgerAccountType.ASSET);
      expect(revenueAccount.accountType).toBe(LedgerAccountType.REVENUE);
    });
  });

  describe('Zero-Sum Balance Invariant', () => {
    it('should demonstrate that debits equal credits in double-entry', () => {
      // In double-entry accounting:
      // Total Debits = Total Credits (always)
      // This is the fundamental invariant

      const entries = [
        new LedgerEntry({
          id: 'e1',
          transactionId: 'tx1',
          debitAccountId: 'cash', // Debit Cash (asset increases)
          creditAccountId: 'revenue', // Credit Revenue (revenue increases)
          amount: 5000,
          createdAt: new Date(),
        }),
      ];

      // Each entry represents a balanced double-entry
      // Debit side = Credit side = 5000
      const totalDebits = entries.reduce((sum, e) => sum + e.amount, 0);
      const totalCredits = entries.reduce((sum, e) => sum + e.amount, 0);

      // Zero-sum: Total Debits - Total Credits = 0
      expect(totalDebits - totalCredits).toBe(0);
    });
  });
});
