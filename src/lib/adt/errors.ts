/** Domain + ADT error classes used across VaultCore. */

export class VaultError extends Error {
  readonly kind: string;
  constructor(kind: string, message: string) {
    super(message);
    this.kind = kind;
    this.name = kind;
  }
}

export class InsufficientFundsError extends VaultError {
  constructor(message = "Insufficient funds for this operation") {
    super("InsufficientFundsError", message);
  }
}
export class AccountNotFoundError extends VaultError {
  constructor(message = "Account not found") {
    super("AccountNotFoundError", message);
  }
}
export class InvalidAmountError extends VaultError {
  constructor(message = "Amount must be a positive number") {
    super("InvalidAmountError", message);
  }
}
export class StackUnderflowError extends VaultError {
  constructor(message = "Stack underflow: the stack is empty") {
    super("StackUnderflowError", message);
  }
}
export class StackOverflowError extends VaultError {
  constructor(message = "Stack overflow: capacity exceeded") {
    super("StackOverflowError", message);
  }
}
export class QueueOverflowError extends VaultError {
  constructor(message = "Queue overflow: capacity exceeded") {
    super("QueueOverflowError", message);
  }
}
export class QueueUnderflowError extends VaultError {
  constructor(message = "Queue underflow: the queue is empty") {
    super("QueueUnderflowError", message);
  }
}
export class DuplicateAccountError extends VaultError {
  constructor(message = "An account with this number already exists") {
    super("DuplicateAccountError", message);
  }
}
export class ClosedAccountError extends VaultError {
  constructor(message = "This account is closed") {
    super("ClosedAccountError", message);
  }
}
export class SelfTransferError extends VaultError {
  constructor(message = "Source and destination accounts must differ") {
    super("SelfTransferError", message);
  }
}
export class NegativeCycleError extends VaultError {
  constructor(message = "Graph contains a negative-weight cycle") {
    super("NegativeCycleError", message);
  }
}