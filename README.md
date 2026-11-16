# Token Radar — token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/Senz14/token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/Senz14/token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar: 198 pre-token protocols ranked by implied value, with a farm plan for
each one, on a sealed DefiLlama snapshot (2026-11-14, 758 protocols, 40 on the watchlist).

Entry for the make.fun bounty **token-radar-01** ("Build the best token launch radar"). See the [bounty page](https://make.fun/bounty/token-radar-01).

## The model (radar-2)

Implied value follows only from the snapshot's own figures:

1. **Comparables.** Each category is priced from its own live-token protocols: the median
   market-cap-per-TVL of the protocols in that category whose token already trades, shrunk
   toward the global median (0.20x) with a pseudo-count of 3 and capped at 3.0x, so one outlier
   cannot price the whole board.
2. **The protocol's own record.** `implied = round(tvl_usd x category_ratio x growth x maturity)`,
   where growth is the seven-day TVL change clamped to [-60%, +120%] at weight 0.5, and maturity
   rises from 0.6 to 1.0 over three years listed with no token.

No protocol name is special-cased. The dashboard prints the whole comparables table and
recomputes every row it shows, so the page's code and `board.json` agree.

Each row also carries two signals that never change its implied value: its seven-day growth
against the live median of its own category, and an evidence score (0–100) for how much of the
snapshot backs its numbers. The detail view shows both, plus the farm's total capital, gas and
hold, and a category-mix panel shows where the board's rows sit.

## The board

- All 40 watchlist protocols, plus every other pre-token protocol the house rule would keep,
  at any size (138 below the $50M floor and more above it).
- Live-token protocols are set aside in their own view with their market caps — the market's
  own values, never mixed into the ranking.
- Every row carries an 8-step farm plan derived from its category, chains, TVL and age, each
  step with a cost and a time, ending with a planned exit.

## How to read the board

Each row is one pre-token protocol, ranked by implied value. The number is the
model's estimate of what the protocol would be worth if it launched a token
today, priced from its own category's live comparables. It is not a prediction
of the launch price: a launch can list far above or below the implied value,
and the board never mixes live market caps into the ranking.

Three signals sit next to every implied value, and none of them changes it:

- **Growth vs peers.** The protocol's seven-day TVL change minus the median
  seven-day change of the live-token protocols in its own category. A positive
  number means the protocol is outpacing its category; a negative one means it
  is lagging it. The board tags rows that outpace their peers.
- **Evidence score (0-100).** How much of the snapshot backs the row: 30 points
  for a reported seven-day change, 25 for a listed date, up to 25 for the live
  comparables that priced its category, and 5 to 20 for the TVL tier (5 below
  $50M, 10 at $50M, 15 at $100M, 20 at $1B). 75 and up is `strong`, 50 to 74 is
  `fair`, below 50 is `thin`. Thin evidence does not lower the implied value;
  it says how far to trust it.
- **Farm totals.** The plan's total capital, gas and hold, so a row can be
  judged on what it costs to farm, not only on what it might be worth.

The `Where the board points` panel groups the rows by category: the eight
categories with the most rows, each with its median implied value. Clicking a
category filters the board to it, so the mix of the board can be read at a
glance before any single row is opened.

## The farm plan

Every row carries an eight-step farm plan, derived from the protocol's own
category, chains, TVL and age — never from a hand-written list of names:

1. Start with a fresh wallet that holds only the funds you plan to farm, and
   keep its seed phrase offline.
2. Take the category's main action (supply, provide liquidity, bridge, stake,
   deposit margin, fund a market, deposit into a vault, mint, or deposit).
3. Take a second, different action on the same protocol, so the wallet shows
   more than one transaction.
4. Repeat the position on the protocol's second chain, or, if it runs on one
   chain only, make one qualifying action each week.
5. Hold the position for the plan's hold period, so the activity is counted
   in more than one snapshot.
6. Before withdrawing, check the protocol's own points or rewards page, and
   claim only from the link it publishes — never pay anyone to claim for you.
7. Write the wallet, the dates and every transaction in a farm log.
8. Plan the exit before you need it: withdraw in two tranches a week apart,
   and leave a dust position so the wallet stays eligible if a later snapshot
   counts it.

The plan's capital is sized from the protocol's TVL: $250 above $5B, $150
above $1B, $100 above $100M, $50 below that; $150 or more of capital costs
about $8 of gas, less costs about $4. The hold period is longer for younger
protocols — 60 days if listed less than six months ago, 45 days under a year,
30 days otherwise — so a young protocol's activity has time to be counted. The
full playbook, with the reasoning behind each step and a worked example, is in
`docs/farm-playbook.md`.

## Limits

The radar is a ranking, not a forecast. It cannot see a protocol's tokenomics,
its vesting, its team, or whether a launch will happen at all — the snapshot
has none of that. A high implied value on thin evidence is a reason to look
closer, not a reason to farm more. The farm plan is a procedure for qualifying
activity, not financial advice, and every step's cost is stated so the reader
can decide whether the position is worth it.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json
```

Node 22+, standard library only, no network. `out/` holds `board.json`, `data.js`,
`dashboard/`, `screenshots/` and `dossier.json`.

## Layout

- `main.ts` — entrypoint: reads the snapshot, writes the outputs.
- `lib/model.ts` — the model, the board, the farm plans, the snapshot parser.
- `dashboard/` — the static page (index.html, app.css, app.js), no network.
- `docs/farm-playbook.md` — the reasoning behind the eight-step farm plan, with sizing and a worked example.
- `screenshots/` — the board, a protocol's detail view, a filtered view.
- `vendor/makefun-board.ts` — make.fun's dossier library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=jkmc4mts&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
