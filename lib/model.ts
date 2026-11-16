// Token Radar's model, radar-2: one snapshot of the protocol universe in, one ranked board out.
//
// The board covers every slug in the snapshot's watchlist (the floor, never a ceiling) and every
// other pre-token protocol the house rule would keep: the early rows the radar exists to find. A
// protocol is pre-token when its index entry records no token (no market cap, no CoinGecko id, no
// symbol); the snapshot's live-token protocols are kept apart and shown as the market's own values,
// never mixed into the ranked board.
//
// Implied value follows only from the snapshot's own figures, in two steps:
//
//   1. Comparables. For each category, the live-token protocols in it carry a market cap and a TVL,
//      so the category's median market-cap-per-dollar-of-TVL is a fact of this snapshot, not a
//      guess. A category with few live protocols is shrunk toward the global median with a
//      pseudo-count of 3, and the ratio used is capped at 3.0x and floored at 0.02x, so one
//      outlier (a prediction market at 400x, a token locker at 19x) cannot price the whole board.
//      A category with no live protocol at all uses the global median.
//   2. The protocol's own record. The category ratio is applied to its TVL, then adjusted by its
//      seven-day growth and by how long it has run with no token:
//
//        growth     = clamp(change_7d, -60, 120) per cent
//        growthMult = 1 + (growth / 100) x GROWTH_WEIGHT
//        maturity   = 0.6 + min(age_days, 1095) / 1095 x 0.4   (age_days unknown: 365)
//        implied    = max(1, round(tvl_usd x ratio x growthMult x maturity))
//
// No protocol name is ever special-cased: the same function scores every row, and the dashboard's
// model panel prints the whole comparables table the function read.
//
// Two signals ride along with each row but never change its implied value: the protocol's
// seven-day growth against the live median of its own category, and an evidence score for how
// much of the snapshot backs the row's numbers, so a reader can tell a well-measured rank from
// a thin one. The farm plan ends with an exit step, and its total capital, gas and hold are
// carried on the row, so the cost of farming it is visible before the first transaction.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them. */
export interface ModelConstants {
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_days: number;
  shrink_prior: number;
  ratio_floor: number;
  ratio_cap: number;
}

export const MODEL: ModelConstants = {
  growth_weight: 0.5,
  growth_floor: -60,
  growth_cap: 120,
  maturity_floor: 0.6,
  maturity_range: 0.4,
  maturity_days: 1095,
  unknown_age_days: 365,
  shrink_prior: 3,
  ratio_floor: 0.02,
  ratio_cap: 3.0,
};

/** The model's version label: the dashboard names it and the rules quote it. */
export const MODEL_VERSION = 'radar-2';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 48;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  model: {
    ratio: number;
    ratio_median: number;
    ratio_n: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    age_days: number | null;
  };
  farm_steps: string[];
  growth_vs_category_pct: number | null;
  evidence_score: number;
  evidence_label: 'strong' | 'fair' | 'thin';
  farm_capital_usd: number;
  farm_gas_usd: number;
  farm_hold_days: number;
}

/** The dashboard's compact view of one row, with farm plans generated in the page. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  ratio: number;
  ratio_n: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  growth_vs_category_pct: number | null;
  evidence_score: number;
  evidence_label: 'strong' | 'fair' | 'thin';
  farm_capital_usd: number;
  farm_gas_usd: number;
  farm_hold_days: number;
  watchlist: boolean;
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** One category's comparables: the live protocols that price it. */
export interface CalibrationRow {
  category: string;
  n: number;
  median: number;
  ratio: number;
}

/** One category's seven-day growth among the protocols whose token already trades. */
export interface GrowthRow {
  category: string;
  n: number;
  median_change_7d: number;
}

/** One row's signals: how its growth compares with its category's live peers, and how much
 * of the snapshot actually backs its score. Both are figures of the snapshot, never a list. */
export interface RowSignals {
  growth_vs_category_pct: number | null;
  evidence_score: number;
  evidence_label: 'strong' | 'fair' | 'thin';
}

/** What one farm position costs in total: the capital, the gas, and the hold. */
export interface FarmSummary {
  capital_usd: number;
  gas_usd: number;
  hold_days: number;
}

/** Everything the dashboard needs: the board, the live set, the calibration and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  total_implied_usd: number;
  median_implied_usd: number;
  global_median_ratio: number;
  calibration: CalibrationRow[];
  growth: GrowthRow[];
  rows: RadarRow[];
  live: LiveRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** The lower median of a sorted array (the middle element, rounding down on even counts). */
function medianOf(sorted: number[]): number {
  return sorted[Math.floor(sorted.length / 2)]!;
}

/**
 * The comparables table: for every category, the median market-cap-per-TVL of the snapshot's
 * live-token protocols in it, shrunk toward the global median and capped. Categories with no live
 * protocol fall back to the global median at read time.
 */
export interface Calibration {
  globalMedian: number;
  byCategory: Map<string, { n: number; median: number; ratio: number }>;
}

export function calibrate(snapshot: Snapshot, model: ModelConstants): Calibration {
  const liveRatios: number[] = [];
  const byCategory = new Map<string, number[]>();
  for (const p of snapshot.protocols) {
    if (isPreToken(p)) continue;
    if (p.mcap_usd === null || p.tvl_usd <= 0) continue;
    const ratio = p.mcap_usd / p.tvl_usd;
    if (!Number.isFinite(ratio) || ratio <= 0) continue;
    liveRatios.push(ratio);
    const key = p.category ?? '(no category)';
    const list = byCategory.get(key) ?? [];
    list.push(ratio);
    byCategory.set(key, list);
  }
  liveRatios.sort((a, b) => a - b);
  const globalMedian = liveRatios.length > 0 ? medianOf(liveRatios) : 0.25;
  const table = new Map<string, { n: number; median: number; ratio: number }>();
  for (const [key, ratios] of byCategory) {
    ratios.sort((a, b) => a - b);
    const median = medianOf(ratios);
    const n = ratios.length;
    const shrunk = (n * median + model.shrink_prior * globalMedian) / (n + model.shrink_prior);
    const ratio = Math.min(model.ratio_cap, Math.max(model.ratio_floor, shrunk));
    table.set(key, { n, median: round4(median), ratio: round4(ratio) });
  }
  return { globalMedian: round4(globalMedian), byCategory: table };
}

/** The ratio a category's pre-token protocols are priced at, with its comparables count. */
export function categoryRatio(category: string | null, cal: Calibration): { ratio: number; median: number; n: number } {
  const entry = cal.byCategory.get(category ?? '(no category)');
  if (entry === undefined) return { ratio: cal.globalMedian, median: cal.globalMedian, n: 0 };
  return { ratio: entry.ratio, median: entry.median, n: entry.n };
}

/**
 * The growth table: for every category, the median seven-day TVL change of the snapshot's
 * live-token protocols in it that report one. A pre-token protocol growing faster than the
 * live peers in its own category is outpacing its market, not just rising with it.
 */
export function growthCalibration(snapshot: Snapshot): Map<string, GrowthRow> {
  const byCategory = new Map<string, number[]>();
  for (const p of snapshot.protocols) {
    if (isPreToken(p) || p.change_7d === null) continue;
    const key = p.category ?? '(no category)';
    const list = byCategory.get(key) ?? [];
    list.push(p.change_7d);
    byCategory.set(key, list);
  }
  const table = new Map<string, GrowthRow>();
  for (const [category, changes] of byCategory) {
    changes.sort((a, b) => a - b);
    table.set(category, { category, n: changes.length, median_change_7d: round4(medianOf(changes)) });
  }
  return table;
}

/** A protocol's seven-day growth minus its category's live median, or null when either is unreported. */
export function growthVsCategory(p: SnapshotProtocol, growthCal: Map<string, GrowthRow>): number | null {
  if (p.change_7d === null) return null;
  const row = growthCal.get(p.category ?? '(no category)');
  if (row === undefined) return null;
  return round4(p.change_7d - row.median_change_7d);
}

/**
 * How much of the snapshot backs one row's score, 0 to 100: a reported seven-day change, a
 * listed date, the live comparables that priced its category, and a TVL large enough to leave a
 * public record. Thin evidence does not change the implied value; it says how far to trust it.
 */
export function evidenceScore(p: SnapshotProtocol, ratioN: number): { score: number; label: 'strong' | 'fair' | 'thin' } {
  let score = 0;
  if (p.change_7d !== null) score += 30;
  if (p.listed_at !== null) score += 25;
  score += Math.round((25 * Math.min(ratioN, 10)) / 10);
  score += p.tvl_usd >= 1_000_000_000 ? 20 : p.tvl_usd >= 100_000_000 ? 15 : p.tvl_usd >= 50_000_000 ? 10 : 5;
  const label = score >= 75 ? 'strong' : score >= 50 ? 'fair' : 'thin';
  return { score, label };
}

/** The multipliers and the implied value one protocol gets under `model` and the calibration. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  model: ModelConstants,
  cal: Calibration,
): { implied: number; ratio: number; ratioMedian: number; ratioN: number; growthPct: number; growthMult: number; maturityMult: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const { ratio, median, n } = categoryRatio(protocol.category, cal);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const ageForModel = age ?? model.unknown_age_days;
  const maturityMult = model.maturity_floor + (Math.min(Math.max(ageForModel, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
  const implied = Math.max(1, Math.round(protocol.tvl_usd * ratio * growthMult * maturityMult));
  return { implied, ratio, ratioMedian: median, ratioN: n, growthPct, growthMult, maturityMult, age };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** Categories that are a wrapped, staked or bridged product of a token that already trades. */
const PRODUCT_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);

/** Exchange names a protocol must not begin with: an exchange's own product is not a launch. */
const EXCHANGE_PREFIX = /^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/;

/** A whole word that marks a wrapped or staked product. */
const WRAPPED_WORD = /\b(wrapped|staked|staking)\b/i;

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/**
 * Whether a protocol is one the board may rank: pre-token, and not a wrapped, staked or bridged
 * product of a token that already trades, by the house rule's own tests. The snapshot carries no
 * parentProtocol field, so a protocol the house list leaves out for having a parent still ranks
 * here when its own record is pre-token: the list is a floor, and the board says so.
 */
export function isRankable(p: SnapshotProtocol): boolean {
  return (
    isPreToken(p) &&
    !PRODUCT_CATEGORIES.has(p.category ?? '') &&
    !VERSIONED.test(p.name) &&
    !EXCHANGE_PREFIX.test(p.name) &&
    !WRAPPED_WORD.test(p.name)
  );
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const cal = calibrate(snapshot, model);
  const growthCal = growthCalibration(snapshot);
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug, even one the snapshot no longer carries (it cannot, but
  // the board's coverage is the gate's row and is never gambled on a missing record).
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: every other pre-token protocol the house rule would keep, at any size. Never a
  // replacement for a watchlist row: a chosen protocol stays chosen.
  for (const p of snapshot.protocols) {
    if (!chosen.has(p.slug) && isRankable(p)) chosen.set(p.slug, p);
  }

  const scored = [...chosen.values()].map((p) => {
    const v = impliedValue(p, snapshot.as_of, model, cal);
    return { p, ...v };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  return scored.map((s, i) => {
    const signals = {
      growth_vs_category_pct: growthVsCategory(s.p, growthCal),
      ...evidenceScore(s.p, s.ratioN),
    };
    const farm = farmSummary(s.p, s.age);
    return {
      rank: i + 1,
      slug: s.p.slug,
      name: s.p.name,
      category: s.p.category,
      chains: s.p.chains,
      tvl_usd: s.p.tvl_usd,
      change_7d: s.p.change_7d,
      mcap_usd: s.p.mcap_usd,
      listed_at: s.p.listed_at,
      gecko_id: s.p.gecko_id,
      symbol: s.p.symbol,
      token_status: 'pre-token',
      age_days: s.age,
      implied_value_usd: s.implied,
      model: {
        ratio: s.ratio,
        ratio_median: s.ratioMedian,
        ratio_n: s.ratioN,
        growth_pct: s.growthPct,
        growth_multiplier: round4(s.growthMult),
        maturity_multiplier: round4(s.maturityMult),
        age_days: s.age,
      },
      farm_steps: farmSteps(s.p, s.age).map(stepText),
      growth_vs_category_pct: signals.growth_vs_category_pct,
      evidence_score: signals.score,
      evidence_label: signals.label,
      farm_capital_usd: farm.capital_usd,
      farm_gas_usd: farm.gas_usd,
      farm_hold_days: farm.hold_days,
    };
  });
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** What one farm position costs in total: the capital, the gas for its transactions, and the hold. */
export function farmSummary(p: SnapshotProtocol, age: number | null): FarmSummary {
  const capital = capitalFor(p);
  return { capital_usd: capital, gas_usd: capital >= 150 ? 8 : 4, hold_days: holdDaysFor(age) };
}

/** The category's main action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and keep the position open.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('staking') || c.includes('restak')) return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedge.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one market position on ${name}.`;
  if (c.includes('curator') || c.includes('allocator')) return `Deposit $${capital} into a ${name} vault on ${chain} and keep the shares.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain}.`;
  if (c.includes('rwa')) return `Mint $${capital} of the protocol's yield asset on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/** The category's second, different action: a farm is more than one transaction. */
function secondActionFor(p: SnapshotProtocol, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Borrow $25 against the deposit on ${name} and repay it the same week, so the position shows both sides.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Swap $25 through ${name}'s own router on ${chain} so the wallet shows trading as well as liquidity.`;
  if (c.includes('bridge')) return `Swap half the bridged funds on ${chain} through the app ${name} routes to, and keep the receipt.`;
  if (c.includes('staking') || c.includes('restak')) return `Open ${name}'s points or rewards page and confirm the stake is counted before the next snapshot.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Close the hedge, then open a second small one in the opposite direction to show repeated use.`;
  if (c.includes('prediction')) return `Settle the first market, then place a second position on a different outcome.`;
  if (c.includes('curator') || c.includes('allocator')) return `Check the vault's performance page and deposit $25 more into a second ${name} vault.`;
  if (c.includes('stable')) return `Swap $25 of the stable asset back to USDC and then in again, to show two-way use.`;
  if (c.includes('rwa')) return `Check the yield accrued on the position and compound $25 of it back into the asset.`;
  if (c.includes('insurance')) return `Open a second, smaller cover on a different pool so the wallet holds two policies.`;
  return `Use ${name}'s second feature on ${chain} once, such as a swap, a vote or a claim, and keep the receipt.`;
}

/**
 * A protocol's farm plan: eight steps, each an action with a cost and a time. The plan is derived
 * from the protocol's own record (category, chains, TVL and age), never from a hand-written list
 * of names. The first two steps are the category's two different actions; the fourth repeats the
 * position on a second chain when the protocol runs on one, else it sets the weekly cadence; the
 * last step plans the exit, so the farm ends deliberately instead of by accident.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const secondChain = p.chains.length > 1 ? p.chains[1]! : null;
  const { capital_usd: capital, gas_usd: gas, hold_days: hold } = farmSummary(p, age);
  return [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: 'under $3 of gas for the first transaction',
      time: '5 minutes',
    },
    {
      text: actionFor(p, capital, chain),
      cost: `$${capital} of capital and about $${gas} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: secondActionFor(p, chain),
      cost: 'about $2 of gas, plus the $25 moved',
      time: '10 minutes',
    },
    secondChain === null
      ? {
          text: `Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.`,
          cost: 'about $2 of gas a week',
          time: '10 minutes a week',
        }
      : {
          text: `Repeat the same deposit on ${secondChain}, the protocol's second chain, so the wallet is active on both.`,
          cost: `$${capital} more of capital and about $${gas} of gas`,
          time: '15 minutes',
        },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes; never pay anyone to claim for you.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
    {
      text: `Plan the exit before you need it: withdraw in two tranches a week apart, and leave a dust position so the wallet stays eligible if a later snapshot counts it.`,
      cost: 'about $4 of gas for the two withdrawals',
      time: '10 minutes, a week apart',
    },
  ];
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** A board row's compact form for data.js, with the farm plan generated in the page. */
export function radarRow(row: BoardRow, watchlist: Set<string>): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    ratio: row.model.ratio,
    ratio_n: row.model.ratio_n,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    growth_vs_category_pct: row.growth_vs_category_pct,
    evidence_score: row.evidence_score,
    evidence_label: row.evidence_label,
    farm_capital_usd: row.farm_capital_usd,
    farm_gas_usd: row.farm_gas_usd,
    farm_hold_days: row.farm_hold_days,
    watchlist: watchlist.has(row.slug),
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const cal = calibrate(snapshot, model);
  const watchlist = new Set(snapshot.watchlist);
  const early = board.filter((r) => !watchlist.has(r.slug)).length;
  const implied = board.map((r) => r.implied_value_usd).sort((a, b) => a - b);
  const calibration: CalibrationRow[] = [...cal.byCategory.entries()]
    .map(([category, v]) => ({ category, n: v.n, median: v.median, ratio: v.ratio }))
    .sort((a, b) => b.n - a.n || (a.category < b.category ? -1 : 1));
  const growth: GrowthRow[] = [...growthCalibration(snapshot).values()].sort(
    (a, b) => b.n - a.n || (a.category < b.category ? -1 : 1),
  );
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    total_implied_usd: implied.reduce((a, b) => a + b, 0),
    median_implied_usd: implied.length > 0 ? implied[Math.floor(implied.length / 2)]! : 0,
    global_median_ratio: cal.globalMedian,
    calibration,
    growth,
    rows: board.map((r) => radarRow(r, watchlist)),
    live,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
