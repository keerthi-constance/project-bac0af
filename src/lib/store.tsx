import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BST } from "./adt/BST";
import { DoublyLinkedList } from "./adt/DoublyLinkedList";
import { Graph } from "./adt/Graph";
import { HashTable } from "./adt/HashTable";
import { LinkedList } from "./adt/LinkedList";
import { PriorityQueue } from "./adt/PriorityQueue";
import { Queue } from "./adt/Queue";
import { Stack } from "./adt/Stack";
import {
  AccountNotFoundError,
  ClosedAccountError,
  DuplicateAccountError,
  InsufficientFundsError,
  InvalidAmountError,
  SelfTransferError,
  VaultError,
} from "./adt/errors";
import { operationBus } from "./adt/operationBus";
import { BRANCHES, BRANCH_EDGES, generateAll, generateStressAccounts, padAccount } from "./data/generate";
import type { Account, ErrorEntry, ServiceRequest, Transaction } from "./types";
import { PRIORITY_RANK } from "./types";

export const TXN_CAP = 1_000_000;
const STORAGE_KEY = "vaultcore.state.v1";

export type AnimationSpeed = "off" | "slow" | "normal" | "fast";

interface PersistShape {
  accounts: Account[];
  transactions: Transaction[];
  requests: ServiceRequest[];
  errors: ErrorEntry[];
  tourDone: boolean;
  speed: AnimationSpeed;
  theme: "dark" | "light";
}

interface VaultApi {
  accounts: Account[];
  transactions: Transaction[];
  requests: ServiceRequest[];
  errors: ErrorEntry[];
  version: number;
  speed: AnimationSpeed;
  setSpeed: (s: AnimationSpeed) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  tourDone: boolean;
  completeTour: () => void;
  list: LinkedList<Account>;
  ledger: DoublyLinkedList<Transaction>;
  undoStack: Stack<Transaction>;
  redoStack: Stack<Transaction>;
  fifoQueue: Queue<ServiceRequest>;
  priorityQueue: PriorityQueue<ServiceRequest>;
  bst: BST<Account>;
  hash: HashTable<Account>;
  graph: Graph;
  bump: () => void;
  logError: (err: unknown, operation: string) => void;
  clearErrors: () => void;
  getAccount: (number: string) => Account | null;
  createAccount: (input: { name: string; type: Account["type"]; balance: number; vip: boolean }) => Account;
  updateAccount: (number: string, patch: Partial<Account>) => void;
  closeAccount: (number: string) => void;
  deposit: (to: string, amount: number, note?: string) => Transaction;
  withdraw: (from: string, amount: number, note?: string) => Transaction;
  transfer: (from: string, to: string, amount: number, note?: string) => Transaction;
  undo: () => Transaction | null;
  redo: () => Transaction | null;
  addRequest: (r: Omit<ServiceRequest, "id" | "createdAt">) => void;
  serveFifo: () => ServiceRequest | null;
  servePriority: () => ServiceRequest | null;
  regenerate: () => void;
  stressTest: (count: number) => number;
  animMs: (base: number) => number;
}

const VaultContext = createContext<VaultApi | null>(null);

function loadState(): PersistShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistShape;
  } catch {
    return null;
  }
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [version, setVersion] = useState(0);
  const [speed, setSpeed] = useState<AnimationSpeed>("normal");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [tourDone, setTourDone] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const list = useRef(new LinkedList<Account>("accounts")).current;
  const ledger = useRef(new DoublyLinkedList<Transaction>()).current;
  const undoStack = useRef(new Stack<Transaction>(50, "undo")).current;
  const redoStack = useRef(new Stack<Transaction>(50, "redo")).current;
  const fifoQueue = useRef(new Queue<ServiceRequest>(20, "fifo")).current;
  const priorityQueue = useRef(new PriorityQueue<ServiceRequest>()).current;
  const bstRef = useRef(new BST<Account>());
  const hashRef = useRef(new HashTable<Account>(16));
  const graph = useRef(new Graph()).current;

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const rebuildIndexes = useCallback((next: Account[]) => {
    const bst = new BST<Account>();
    const hash = new HashTable<Account>(16);
    for (let i = 0; i < next.length; i++) {
      bst.insert(next[i].number, next[i]);
      hash.put(next[i].name.toLowerCase(), next[i]);
    }
    bstRef.current = bst;
    hashRef.current = hash;
  }, []);

  const hydrate = useCallback(
    (data: { accounts: Account[]; transactions: Transaction[]; requests: ServiceRequest[] }) => {
      list.head = null;
      for (let i = data.accounts.length - 1; i >= 0; i--) list.insertAtHead(data.accounts[i]);
      ledger.head = null;
      ledger.tail = null;
      for (let i = 0; i < data.transactions.length; i++) ledger.insertAtTail(data.transactions[i]);
      rebuildIndexes(data.accounts);
      while (!fifoQueue.isEmpty()) fifoQueue.dequeue();
      const half = Math.ceil(data.requests.length / 2);
      for (let i = 0; i < data.requests.length; i++) {
        if (i < half) {
          if (!fifoQueue.isFull()) fifoQueue.enqueue(data.requests[i]);
        } else {
          priorityQueue.enqueue(data.requests[i], PRIORITY_RANK[data.requests[i].priority]);
        }
      }
      graph.adjacency.clear();
      BRANCHES.forEach((b) => graph.addVertex(b.id));
      BRANCH_EDGES.forEach((e) => graph.addEdge(e.from, e.to, e.weight));
      setAccounts(data.accounts);
      setTransactions(data.transactions);
      setRequests(data.requests);
      bump();
    },
    [bump, fifoQueue, graph, ledger, list, priorityQueue, rebuildIndexes],
  );

  useEffect(() => {
    const saved = loadState();
    if (saved && saved.accounts?.length) {
      setErrors(saved.errors ?? []);
      setSpeed(saved.speed ?? "normal");
      setTheme(saved.theme ?? "dark");
      setTourDone(saved.tourDone ?? false);
      hydrate({ accounts: saved.accounts, transactions: saved.transactions, requests: saved.requests });
    } else {
      setTourDone(false);
      hydrate(generateAll());
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistShape = { accounts, transactions, requests, errors, tourDone, speed, theme };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* quota — ignore */
    }
  }, [accounts, transactions, requests, errors, tourDone, speed, theme, hydrated]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const logError = useCallback((err: unknown, operation: string) => {
    const e = err as VaultError;
    setErrors((prev) => [
      {
        id: `ERR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        at: Date.now(),
        type: e?.name ?? "Error",
        message: e?.message ?? String(err),
        operation,
      },
      ...prev,
    ]);
  }, []);

  const getAccount = useCallback((num: string): Account | null => {
    return bstRef.current.search(num).value;
  }, []);

  const applyAccounts = useCallback(
    (updater: (prev: Account[]) => Account[]) => {
      setAccounts((prev) => {
        const next = updater(prev);
        rebuildIndexes(next);
        return next;
      });
      bump();
    },
    [bump, rebuildIndexes],
  );

  const createAccount: VaultApi["createAccount"] = useCallback(
    (input) => {
      if (!input.name.trim()) throw new InvalidAmountError("Account holder name is required");
      if (input.balance < 0) throw new InvalidAmountError("Opening balance cannot be negative");
      const existing = accounts.some((a) => a.name.toLowerCase() === input.name.trim().toLowerCase());
      if (existing) throw new DuplicateAccountError(`An account for "${input.name}" already exists`);
      let maxNum = 0;
      for (let i = 0; i < accounts.length; i++) {
        const n = Number(accounts[i].number.split("-")[1]);
        if (n > maxNum) maxNum = n;
      }
      const account: Account = {
        id: `acc-${maxNum + 1}`,
        number: padAccount(maxNum + 1),
        name: input.name.trim(),
        type: input.type,
        status: "Active",
        vip: input.vip,
        balance: input.balance,
        createdAt: Date.now(),
      };
      list.insertAtTail(account);
      applyAccounts((prev) => [...prev, account]);
      return account;
    },
    [accounts, applyAccounts, list],
  );

  const updateAccount: VaultApi["updateAccount"] = useCallback(
    (number, patch) => {
      const found = list.findByPredicate((a) => a.number === number);
      if (!found) throw new AccountNotFoundError(`No account ${number}`);
      Object.assign(found, patch);
      applyAccounts((prev) => prev.map((a) => (a.number === number ? { ...a, ...patch } : a)));
    },
    [applyAccounts, list],
  );

  const closeAccount: VaultApi["closeAccount"] = useCallback(
    (number) => {
      const removed = list.deleteByKey((a) => a.number === number);
      if (!removed) throw new AccountNotFoundError(`No account ${number}`);
      bstRef.current.delete(number);
      applyAccounts((prev) => prev.map((a) => (a.number === number ? { ...a, status: "Closed" as const } : a)));
    },
    [applyAccounts, list],
  );

  const assertActive = useCallback(
    (num: string, label: string): Account => {
      const acc = getAccount(num);
      if (!acc) throw new AccountNotFoundError(`${label} account ${num} does not exist`);
      if (acc.status === "Closed") throw new ClosedAccountError(`${label} account ${num} is closed`);
      return acc;
    },
    [getAccount],
  );

  const assertAmount = useCallback((amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) throw new InvalidAmountError("Amount must be greater than zero");
    if (amount > TXN_CAP) throw new InvalidAmountError(`Single-transaction cap is LKR ${TXN_CAP.toLocaleString()}`);
  }, []);

  const commit = useCallback(
    (txn: Transaction, balanceChanges: { number: string; delta: number }[]) => {
      ledger.insertAtTail(txn);
      undoStack.push(txn);
      redoStack.clear();
      setTransactions((prev) => [...prev, txn]);
      applyAccounts((prev) =>
        prev.map((a) => {
          const change = balanceChanges.find((c) => c.number === a.number);
          return change ? { ...a, balance: a.balance + change.delta } : a;
        }),
      );
      return txn;
    },
    [applyAccounts, ledger, redoStack, undoStack],
  );

  const nextTxnId = useCallback(() => `TXN-${String(transactions.length + 1).padStart(4, "0")}`, [transactions.length]);

  const deposit: VaultApi["deposit"] = useCallback(
    (to, amount, note = "Counter deposit") => {
      assertAmount(amount);
      assertActive(to, "Destination");
      return commit(
        { id: nextTxnId(), type: "Deposit", from: null, to, amount, status: "Completed", at: Date.now(), note },
        [{ number: to, delta: amount }],
      );
    },
    [assertActive, assertAmount, commit, nextTxnId],
  );

  const withdraw: VaultApi["withdraw"] = useCallback(
    (from, amount, note = "Counter withdrawal") => {
      assertAmount(amount);
      const acc = assertActive(from, "Source");
      if (acc.balance < amount)
        throw new InsufficientFundsError(`${from} holds LKR ${acc.balance.toLocaleString()} — cannot withdraw more`);
      return commit(
        { id: nextTxnId(), type: "Withdrawal", from, to: null, amount, status: "Completed", at: Date.now(), note },
        [{ number: from, delta: -amount }],
      );
    },
    [assertActive, assertAmount, commit, nextTxnId],
  );

  const transfer: VaultApi["transfer"] = useCallback(
    (from, to, amount, note = "Inter-account transfer") => {
      assertAmount(amount);
      if (from === to) throw new SelfTransferError();
      const src = assertActive(from, "Source");
      assertActive(to, "Destination");
      if (src.balance < amount)
        throw new InsufficientFundsError(`${from} holds LKR ${src.balance.toLocaleString()} — cannot transfer more`);
      return commit(
        { id: nextTxnId(), type: "Transfer", from, to, amount, status: "Completed", at: Date.now(), note },
        [
          { number: from, delta: -amount },
          { number: to, delta: amount },
        ],
      );
    },
    [assertActive, assertAmount, commit, nextTxnId],
  );

  const invert = useCallback(
    (txn: Transaction, direction: 1 | -1): { number: string; delta: number }[] => {
      const sign = direction;
      if (txn.type === "Deposit" && txn.to) return [{ number: txn.to, delta: -sign * txn.amount }];
      if (txn.type === "Withdrawal" && txn.from) return [{ number: txn.from, delta: sign * txn.amount }];
      if (txn.from && txn.to)
        return [
          { number: txn.from, delta: sign * txn.amount },
          { number: txn.to, delta: -sign * txn.amount },
        ];
      return [];
    },
    [],
  );

  const undo: VaultApi["undo"] = useCallback(() => {
    const txn = undoStack.pop();
    redoStack.push(txn);
    const changes = invert(txn, 1);
    setTransactions((prev) => prev.map((t) => (t.id === txn.id ? { ...t, status: "Reversed" as const } : t)));
    applyAccounts((prev) =>
      prev.map((a) => {
        const c = changes.find((x) => x.number === a.number);
        return c ? { ...a, balance: a.balance + c.delta } : a;
      }),
    );
    return txn;
  }, [applyAccounts, invert, redoStack, undoStack]);

  const redo: VaultApi["redo"] = useCallback(() => {
    const txn = redoStack.pop();
    undoStack.push(txn);
    const changes = invert(txn, -1);
    setTransactions((prev) => prev.map((t) => (t.id === txn.id ? { ...t, status: "Completed" as const } : t)));
    applyAccounts((prev) =>
      prev.map((a) => {
        const c = changes.find((x) => x.number === a.number);
        return c ? { ...a, balance: a.balance + c.delta } : a;
      }),
    );
    return txn;
  }, [applyAccounts, invert, redoStack, undoStack]);

  const addRequest: VaultApi["addRequest"] = useCallback(
    (r) => {
      const req: ServiceRequest = { ...r, id: `REQ-${String(Date.now()).slice(-5)}`, createdAt: Date.now() };
      if (!fifoQueue.isFull()) fifoQueue.enqueue(req);
      priorityQueue.enqueue(req, PRIORITY_RANK[req.priority]);
      setRequests((prev) => [...prev, req]);
      bump();
    },
    [bump, fifoQueue, priorityQueue],
  );

  const serveFifo: VaultApi["serveFifo"] = useCallback(() => {
    if (fifoQueue.isEmpty()) return null;
    const r = fifoQueue.dequeue();
    bump();
    return r;
  }, [bump, fifoQueue]);

  const servePriority: VaultApi["servePriority"] = useCallback(() => {
    const r = priorityQueue.dequeueHighestPriority();
    bump();
    return r;
  }, [bump, priorityQueue]);

  const regenerate = useCallback(() => {
    operationBus.reset();
    undoStack.clear();
    redoStack.clear();
    setErrors([]);
    hydrate(generateAll());
  }, [hydrate, redoStack, undoStack]);

  const stressTest = useCallback(
    (count: number) => {
      const start = accounts.length + 1;
      const extra = generateStressAccounts(start, count);
      const t0 = performance.now();
      for (let i = 0; i < extra.length; i++) bstRef.current.insert(extra[i].number, extra[i]);
      const elapsed = performance.now() - t0;
      applyAccounts((prev) => [...prev, ...extra]);
      return elapsed;
    },
    [accounts.length, applyAccounts],
  );

  const animMs = useCallback(
    (base: number) => {
      if (speed === "off") return 0;
      if (speed === "slow") return base * 2.5;
      if (speed === "fast") return base * 0.45;
      return base;
    },
    [speed],
  );

  const value = useMemo<VaultApi>(
    () => ({
      accounts,
      transactions,
      requests,
      errors,
      version,
      speed,
      setSpeed,
      theme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      tourDone,
      completeTour: () => setTourDone(true),
      list,
      ledger,
      undoStack,
      redoStack,
      fifoQueue,
      priorityQueue,
      bst: bstRef.current,
      hash: hashRef.current,
      graph,
      bump,
      logError,
      clearErrors: () => setErrors([]),
      getAccount,
      createAccount,
      updateAccount,
      closeAccount,
      deposit,
      withdraw,
      transfer,
      undo,
      redo,
      addRequest,
      serveFifo,
      servePriority,
      regenerate,
      stressTest,
      animMs,
    }),
    [
      accounts,
      transactions,
      requests,
      errors,
      version,
      speed,
      theme,
      tourDone,
      list,
      ledger,
      undoStack,
      redoStack,
      fifoQueue,
      priorityQueue,
      graph,
      bump,
      logError,
      getAccount,
      createAccount,
      updateAccount,
      closeAccount,
      deposit,
      withdraw,
      transfer,
      undo,
      redo,
      addRequest,
      serveFifo,
      servePriority,
      regenerate,
      stressTest,
      animMs,
    ],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultApi {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}