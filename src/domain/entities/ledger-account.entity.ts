// Domain Entity - Ledger Account

export enum LedgerAccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export interface LedgerAccountProps {
  id: string;
  code: string;
  name: string;
  accountType: LedgerAccountType;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class LedgerAccount {
  private readonly props: LedgerAccountProps;

  constructor(props: LedgerAccountProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get accountType(): LedgerAccountType {
    return this.props.accountType;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): LedgerAccountProps {
    return { ...this.props };
  }
}
