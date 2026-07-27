import type { Account, BranchNode, ServiceRequest, Transaction } from "../types";

const PERSONAL_NAMES = [
  "Nimali Perera",
  "Kasun Fernando",
  "Anushka Jayawardena",
  "Tharindu Silva",
  "Fathima Rizwan",
  "Dilani Wickramasinghe",
  "Sanjeewa Bandara",
  "Ayesha Nazeer",
  "Ruwan Dissanayake",
  "Malithi Gunasekara",
  "Chamara Rathnayake",
  "Hasini Abeywardena",
  "Isuru Weerasinghe",
  "Shanika Herath",
  "Nuwan Ekanayake",
  "Menaka Samarasinghe",
  "Roshan Karunaratne",
  "Thilini Madushani",
  "Dinesh Amarasekara",
  "Sachini Liyanage",
  "Pradeep Kumarasiri",
  "Nadeesha Wijesuriya",
  "Mohamed Farhan",
 ];

const CORPORATE_NAMES = ["Ceylon Textiles (Pvt) Ltd", "Lanka Agri Exports"];

const REQUEST_KINDS = [
  "Cheque book request",
  "Loan consultation",
  "Card replacement",
  "Statement request",
  "Fixed deposit renewal",
  "Address update",
  "Dispute a charge",
  "Foreign remittance",
];

export const BRANCHES: BranchNode[] = [
  { id: "COL", label: "Colombo Fort HQ", x: 180, y: 260 },
  { id: "KAN", label: "Kandy", x: 400, y: 170 },
  { id: "GAL", label: "Galle", x: 240, y: 430 },
  { id: "JAF", label: "Jaffna", x: 430, y: 40 },
  { id: "NEG", label: "Negombo", x: 100, y: 130 },
  { id: "MAT", label: "Matara", x: 430, y: 460 },
];

export const BRANCH_EDGES: { from: string; to: string; weight: number }[] = [
  { from: "COL", to: "NEG", weight: 4 },
  { from: "COL", to: "KAN", weight: 12 },
  { from: "COL", to: "GAL", weight: 9 },
  { from: "NEG", to: "KAN", weight: 11 },
  { from: "KAN", to: "JAF", weight: 18 },
  { from: "NEG", to: "JAF", weight: 26 },
  { from: "GAL", to: "MAT", weight: 5 },
  { from: "KAN", to: "MAT", weight: 21 },
  { from: "GAL", to: "KAN", weight: 14 },
];

const DAY = 86_400_000;

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

export function padAccount(n: number): string {
  return `ACC-${String(n).padStart(4, "0")}`;
}

export function generateAccounts(): Account[] {
  const names = [...PERSONAL_NAMES.slice(0, 23), ...CORPORATE_NAMES];
  const types: Account["type"][] = [];
  for (let i = 0; i < 12; i++) types.push("Savings");
  for (let i = 0; i < 8; i++) types.push("Current");
  for (let i = 0; i < 5; i++) types.push("Fixed Deposit");
  const now = Date.now();
  const accounts: Account[] = [];
  for (let i = 0; i < 25; i++) {
    const isCorp = i >= 23;
    accounts.push({
      id: `acc-${i + 1}`,
      number: padAccount(i + 1),
      name: names[i],
      type: types[i],
      status: "Active",
      vip: false,
      balance: Math.round(isCorp ? rand(2_000_000, 12_400_000) : rand(4_500, 1_800_000)),
      createdAt: now - randInt(30, 1095) * DAY,
    });
  }
  [3, 9, 16, 23].forEach((i) => (accounts[i].vip = true));
  [11, 20].forEach((i) => (accounts[i].status = "Closed"));
  return accounts;
}

export function generateTransactions(accounts: Account[]): Transaction[] {
  const txns: Transaction[] = [];
  const now = Date.now();
  const active = accounts.filter((a) => a.status === "Active");
  let seq = 1;
  const make = (t: Partial<Transaction> & { type: Transaction["type"]; amount: number; at: number }): Transaction => ({
    id: `TXN-${String(seq++).padStart(4, "0")}`,
    type: t.type,
    from: t.from ?? null,
    to: t.to ?? null,
    amount: t.amount,
    status: t.status ?? "Completed",
    at: t.at,
    note: t.note ?? "",
  });

  for (let i = 0; i < 150; i++) {
    const daysAgo = randInt(0, 89);
    const at = now - daysAgo * DAY - randInt(0, 23) * 3_600_000;
    const roll = Math.random();
    if (roll < 0.42) {
      const a = pick(active);
      txns.push(make({ type: "Deposit", to: a.number, amount: Math.round(rand(500, 45_000)), at, note: "Counter deposit" }));
    } else if (roll < 0.8) {
      const a = pick(active);
      txns.push(make({ type: "Withdrawal", from: a.number, amount: Math.round(rand(500, 60_000)), at, note: "ATM withdrawal" }));
    } else {
      const a = pick(active);
      let b = pick(active);
      while (b.number === a.number) b = pick(active);
      txns.push(
        make({
          type: "Transfer",
          from: a.number,
          to: b.number,
          amount: Math.round(rand(10_000, 850_000)),
          at,
          note: "Inter-account transfer",
        }),
      );
    }
  }

  // Salary-day clusters on the 25th of each of the last 3 months.
  const today = new Date();
  for (let m = 0; m < 3; m++) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 25, 9, 0, 0);
    if (d.getTime() > now) continue;
    for (let i = 0; i < 7; i++) {
      const a = pick(active);
      txns.push(
        make({
          type: "Deposit",
          to: a.number,
          amount: Math.round(rand(65_000, 320_000)),
          at: d.getTime() + i * 900_000,
          note: "Salary credit",
        }),
      );
    }
  }

  for (let i = 0; i < 6; i++) {
    const a = pick(active);
    txns.push(
      make({
        type: "Withdrawal",
        from: a.number,
        amount: Math.round(rand(900_000, 2_400_000)),
        at: now - randInt(0, 89) * DAY,
        status: "Failed",
        note: "Declined — insufficient funds",
      }),
    );
  }
  for (let i = 0; i < 3; i++) {
    const a = pick(active);
    let b = pick(active);
    while (b.number === a.number) b = pick(active);
    txns.push(
      make({
        type: "Transfer",
        from: a.number,
        to: b.number,
        amount: Math.round(rand(20_000, 400_000)),
        at: now - randInt(0, 89) * DAY,
        status: "Reversed",
        note: "Reversed by branch officer",
      }),
    );
  }

  txns.sort((a, b) => a.at - b.at);
  return txns.map((t, i) => ({ ...t, id: `TXN-${String(i + 1).padStart(4, "0")}` }));
}

export function generateRequests(accounts: Account[]): ServiceRequest[] {
  const active = accounts.filter((a) => a.status === "Active");
  const out: ServiceRequest[] = [];
  const now = Date.now();
  for (let i = 0; i < 12; i++) {
    const a = active[randInt(0, active.length - 1)];
    const priority = a.vip ? "VIP" : Math.random() < 0.3 ? "Urgent" : "Normal";
    out.push({
      id: `REQ-${String(i + 1).padStart(3, "0")}`,
      customer: a.name,
      account: a.number,
      kind: REQUEST_KINDS[randInt(0, REQUEST_KINDS.length - 1)],
      priority,
      createdAt: now - randInt(1, 240) * 60_000,
    });
  }
  return out;
}

export function generateStressAccounts(startIndex: number, count: number): Account[] {
  const out: Account[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const n = startIndex + i;
    out.push({
      id: `acc-${n}`,
      number: padAccount(n),
      name: `Load Test Customer ${n}`,
      type: "Savings",
      status: "Active",
      vip: false,
      balance: Math.round(rand(5_000, 500_000)),
      createdAt: now - randInt(1, 900) * DAY,
    });
  }
  return out;
}

export function generateAll() {
  const accounts = generateAccounts();
  return {
    accounts,
    transactions: generateTransactions(accounts),
    requests: generateRequests(accounts),
  };
}