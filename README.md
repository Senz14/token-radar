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
- `screenshots/` — the board, a protocol's detail view, a filtered view.
- `vendor/makefun-board.ts` — make.fun's dossier library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=jkmc4mts&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
