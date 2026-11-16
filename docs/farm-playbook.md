# Farm playbook — Token Radar

This is the reasoning behind the eight-step farm plan each board row carries.
The plan is generated from the protocol's own record (category, chains, TVL
and age) by `lib/model.ts`; nothing in it is written by hand for a single
name. The goal is qualifying activity: a wallet that shows real, repeated use
of the protocol, held long enough to be counted in more than one snapshot,
and exited deliberately.

## The eight steps, and why each one is there

1. **Fresh wallet.** A farm wallet holds only the funds being farmed, and its
   seed phrase stays offline. If one wallet is drained or flagged, the loss
   stops there, and the farm's history stays clean and auditable.
2. **The main action.** The category's primary use — supply, liquidity, bridge,
   stake, margin, a market position, a vault deposit, a mint. This is the
   position the snapshots will see.
3. **A second, different action.** A farm is more than one transaction. A
   borrow against a deposit, a swap through the protocol's own router, or a
   second feature shows the wallet uses the protocol rather than parking in it.
4. **A second chain, or a weekly cadence.** If the protocol runs on two chains,
   repeat the position on the second one. If it runs on one, make one qualifying
   action each week, so the wallet stays active instead of going quiet.
5. **Hold.** The position stays open for the plan's hold period — longer for
   younger protocols (60 days under six months, 45 under a year, 30 otherwise)
   — so the activity is counted in more than one snapshot.
6. **Check before you claim.** Open the protocol's own points or rewards page
   and claim only from the link it publishes. Never pay anyone to claim for
   you — a paid claim is the most common way a farm is stolen.
7. **Keep a farm log.** The wallet, the dates and every transaction, written
   down. The log is what lets you repeat a position, or unwind it, without
   guessing.
8. **Exit in two tranches.** Withdraw a week apart, and leave a dust position
   behind, so the wallet stays eligible if a later snapshot counts it. The
   exit is planned before it is needed, not improvised on launch day.

## Sizing

The plan's capital is sized from the protocol's TVL: $250 above $5B, $150
above $1B, $100 above $100M, $50 below that. Capital of $150 or more costs
about $8 of gas; less costs about $4. The hold period is longer for younger
protocols — 60 days if listed less than six months ago, 45 days under a year,
30 days otherwise — so a young protocol's activity has time to be counted in
more than one snapshot. A row's farm totals — capital, gas and hold — are
printed next to its implied value, so a row can be judged on what it costs
to farm, not only on what it might be worth.

## A worked example

The board's top three rows by implied value are Steakhouse ($1.98B), Sentora
($1.90B) and Gauntlet ($1.18B). All three are large, established protocols, so
their evidence is strong — a reported change, a listed date, many comparables,
and a large TVL — and their hold periods are the standard 30 days for an
established protocol. Farming one of them still means a real position: the main
action, a second action, a weekly cadence, a log, and a two-tranche exit. A
smaller row lower on the board may cost less to farm, but its evidence is
often thinner — the board's evidence score says how far to trust the number
before committing capital.

## What the plan does not do

The plan does not predict a launch, a price, or an allocation. It does not
move money for you, and it does not guarantee eligibility: a protocol can
change its rules, exclude a category of wallet, or never launch at all. The
plan is a procedure for qualifying activity, and every step's cost is stated
so the reader can decide whether the position is worth it.
