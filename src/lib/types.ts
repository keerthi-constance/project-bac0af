export type AccountType = "Savings" | "Current" | "Fixed Deposit";
export type AccountStatus = "Active" | "Closed";

export interface Account {
  id: string;
  number: string;
  name: string;
  type: AccountType;
  status: AccountStatus;
  vip: boolean;
  balance: number;
  createdAt: number;
}

export type TxnType = "Deposit" | "Withdrawal" | "Transfer";
export type TxnStatus = "Completed" | "Failed" | "Reversed";

export interface Transaction {
  id: string;
  type: TxnType;
  from: string | null;
  to: string | null;
  amount: number;
  status: TxnStatus;
  at: number;
  note: string;
}

export type RequestPriority = "VIP" | "Urgent" | "Normal";

export interface ServiceRequest {
  id: string;
  customer: string;
  account: string;
  kind: string;
  priority: RequestPriority;
  createdAt: number;
}

export interface ErrorEntry {
  id: string;
  at: number;
  type: string;
  message: string;
  operation: string;
}

export interface BranchNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export const PRIORITY_RANK: Record<RequestPriority, number> = {
  VIP: 0,
  Urgent: 1,
  Normal: 2,
};