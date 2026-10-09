// Pure farm calculators. Figures are extension-service rules of thumb, shown to users as estimates.

export function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(d, last));
  return t.toISOString().slice(0, 10);
}

/* ---------- Loan with grace period (declining balance) ---------- */

export type LoanInput = {
  principal: number;
  rate: number; // annual %, declining balance
  graceMonths: number;
  termMonths: number; // repayment months after grace
  graceMode: "interest" | "capitalize"; // pay interest during grace, or add it to the principal
  start?: string; // YYYY-MM-DD disbursement date
};
export type LoanRow = { k: number; date: string; payment: number; interest: number; principal: number; balance: number; grace: boolean };

export function loanSchedule(l: LoanInput) {
  const i = l.rate / 1200;
  const start = l.start || new Date().toISOString().slice(0, 10);
  const rows: LoanRow[] = [];
  let bal = l.principal;
  for (let k = 1; k <= l.graceMonths; k++) {
    const interest = bal * i;
    if (l.graceMode === "capitalize") {
      bal += interest;
      rows.push({ k, date: addMonths(start, k), payment: 0, interest, principal: 0, balance: bal, grace: true });
    } else {
      rows.push({ k, date: addMonths(start, k), payment: interest, interest, principal: 0, balance: bal, grace: true });
    }
  }
  const n = Math.max(1, l.termMonths);
  const emi = i === 0 ? bal / n : (bal * i) / (1 - Math.pow(1 + i, -n));
  for (let k = 1; k <= n; k++) {
    const interest = bal * i;
    const principal = k === n ? bal : emi - interest;
    bal = Math.max(0, bal - principal);
    rows.push({ k: l.graceMonths + k, date: addMonths(start, l.graceMonths + k), payment: principal + interest, interest, principal, balance: bal, grace: false });
  }
  const totalPaid = rows.reduce((s, r) => s + r.payment, 0);
  return {
    rows,
    emi,
    graceMonthly: l.graceMode === "interest" && l.graceMonths ? l.principal * i : 0,
    totalPaid,
    totalInterest: totalPaid - l.principal,
  };
}

/** Amount that should have been repaid by `onDate` according to the schedule. */
export function dueBy(l: LoanInput, onDate: string) {
  return loanSchedule(l).rows.filter((r) => r.date <= onDate).reduce((s, r) => s + r.payment, 0);
}

/* ---------- Daily feed for a dairy cow ---------- */

export type FeedInput = { weight: number; milk: number; pregnant: boolean; prices: { grass: number; straw: number; conc: number; milk: number } };

export const CONC_MIX: [string, number][] = [
  ["গমের ভুসি", 40],
  ["ভাঙা ভুট্টা", 25],
  ["সরিষার খৈল", 20],
  ["ডালের ভুসি", 12],
  ["ডিসিপি (খনিজ)", 2],
  ["লবণ", 1],
];

export function feedPlan(f: FeedInput) {
  const grass = f.weight * 0.08; // fresh green fodder ≈ 8% of body weight
  const straw = f.weight * 0.01; // dry straw ≈ 1% of body weight
  const maintenance = f.weight / 200; // ~1 kg concentrate per 200 kg body weight
  const production = f.milk / 2.5; // 1 kg concentrate per 2.5 L milk
  const conc = maintenance + production + (f.pregnant ? 1 : 0);
  const water = f.weight * 0.1 + f.milk * 4;
  const cost = grass * f.prices.grass + straw * f.prices.straw + conc * f.prices.conc;
  const income = f.milk * f.prices.milk;
  return {
    grass, straw, conc, water,
    salt: 30 + f.milk * 2, // grams
    mix: CONC_MIX.map(([name, pct]) => ({ name, kg: (conc * pct) / 100 })),
    cost, income, margin: income - cost,
  };
}

/* ---------- Biogas & compost from dung ---------- */

export const BIOGAS_SIZES = [1.2, 1.6, 2.0, 2.4, 3.2, 4.8]; // m³ gas/day (IDCOL plant sizes)

export function biogas(cows: number, dungPerCow: number, lpgPrice12kg: number) {
  const dung = cows * dungPerCow; // kg/day
  const gas = dung * 0.04; // m³/day — ~0.04 m³ per kg fresh cattle dung
  const burnerHours = gas / 0.4; // a household burner uses ~0.4 m³/h
  const lpgKgMonth = gas * 0.45 * 30; // 1 m³ biogas ≈ 0.45 kg LPG
  const plant = [...BIOGAS_SIZES].reverse().find((s) => s <= gas) ?? null;
  return {
    dung, gas, burnerHours,
    lpgKgMonth,
    savingMonth: (lpgKgMonth / 12) * lpgPrice12kg,
    plant,
    compostMonth: dung * 30 * 0.5, // vermicompost ≈ half the dung weight
  };
}

/* ---------- Value added from dairy products ---------- */

export type DairyInput = {
  liters: number; fat: number; milkPrice: number;
  price: { ghee: number; doi: number; chhana: number };
  cost: { ghee: number; doi: number; chhana: number }; // extra cost per kg product (fuel, sugar, pots)
};

export function dairyProducts(d: DairyInput) {
  const raw = d.liters * d.milkPrice;
  const yields = {
    ghee: d.liters * 1.03 * (d.fat / 100) * 0.85,
    doi: d.liters * 0.95,
    chhana: d.liters * 0.17,
  };
  return (Object.keys(yields) as (keyof typeof yields)[]).map((k) => {
    const kg = yields[k];
    const value = kg * d.price[k];
    const extra = kg * d.cost[k];
    return { key: k, kg, value, extra, raw, gain: value - extra - raw };
  });
}

/* ---------- Cattle fattening ---------- */

export type FattenInput = {
  buyWeight: number; buyPrice: number; days: number; dailyGain: number;
  feedPerDay: number; other: number; sellPerKg: number;
};

export function fattening(f: FattenInput) {
  const finalWeight = f.buyWeight + f.days * f.dailyGain;
  const revenue = finalWeight * f.sellPerKg;
  const feed = f.days * f.feedPerDay;
  const cost = f.buyPrice + feed + f.other;
  const profit = revenue - cost;
  return { finalWeight, revenue, feed, cost, profit, roi: cost ? (profit / cost) * 100 : 0, perDay: f.days ? profit / f.days : 0 };
}
