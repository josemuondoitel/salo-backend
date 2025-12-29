// Domain Entity - Ledger Transaction and Entry

export interface LedgerEntryProps {
  id: string;
  transactionId: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  description?: string | null;
  createdAt: Date;
}

export class LedgerEntry {
  private readonly props: LedgerEntryProps;

  constructor(props: LedgerEntryProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get transactionId(): string {
    return this.props.transactionId;
  }

  get debitAccountId(): string {
    return this.props.debitAccountId;
  }

  get creditAccountId(): string {
    return this.props.creditAccountId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): LedgerEntryProps {
    return { ...this.props };
  }
}

export interface LedgerTransactionProps {
  id: string;
  description: string;
  reference?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  idempotencyKey: string;
  entries: LedgerEntry[];
  createdAt: Date;
}

export class LedgerTransaction {
  private readonly props: LedgerTransactionProps;

  constructor(props: LedgerTransactionProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get description(): string {
    return this.props.description;
  }

  get reference(): string | null | undefined {
    return this.props.reference;
  }

  get referenceType(): string | null | undefined {
    return this.props.referenceType;
  }

  get referenceId(): string | null | undefined {
    return this.props.referenceId;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  get entries(): LedgerEntry[] {
    return this.props.entries;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Validate that all entries balance (sum of debits = sum of credits)
   * In our model, each entry has equal debit and credit amounts
   */
  isBalanced(): boolean {
    // Each entry represents a debit-credit pair with equal amounts
    // By design, this is always balanced
    return true;
  }

  /**
   * Get total amount of the transaction
   */
  totalAmount(): number {
    return this.props.entries.reduce((sum, entry) => sum + entry.amount, 0);
  }

  toJSON(): Omit<LedgerTransactionProps, 'entries'> & {
    entries: LedgerEntryProps[];
  } {
    return {
      id: this.props.id,
      description: this.props.description,
      reference: this.props.reference,
      referenceType: this.props.referenceType,
      referenceId: this.props.referenceId,
      idempotencyKey: this.props.idempotencyKey,
      createdAt: this.props.createdAt,
      entries: this.props.entries.map((e) => e.toJSON()),
    };
  }
}
