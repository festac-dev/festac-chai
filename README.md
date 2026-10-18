# Chai-Stall Terminal

One-screen app for the forecasting club: see open markets, your positions (incl. P&L on resolved markets), and claim winnings. Play tokens only, Base Sepolia. React + Vite, wagmi, viem, TanStack Query.

## Run against the reference contract
1. Node 20.12+ (`nvm use 22`).
2. `npm install`
3. `cp .env.example .env` and set `VITE_CONTRACT_ADDRESS` (and `VITE_DEPLOY_BLOCK`) from the event page.
4. Paste the reference ABI into `src/contract.ts` (`marketAbi`). If function/event names differ from the assumed ones (`marketCount`, `getMarket`, `claim`, `Staked`, `Claimed`), adjust `src/hooks.ts` and `src/ClaimButton.tsx`.
5. `npm run dev` (open on a phone via the printed network URL), or `npm run build`.

## Design notes
- Amounts stay `bigint`; displayed only via `formatUnits`. P&L is bigint subtraction.
- Positions: one `getLogs` per event type, filtered by the connected address (indexed `user`), not a per-market scan.
- Claim is shown only when the on-chain market `resolved` flag is true, is blocked on the wrong chain (switch prompt + `chainId` on the write), and success shows only after a receipt with `status === "success"`.
- Failed reads show a message and Retry; RPC transport falls back across several endpoints with retries for flaky Wi-Fi.
- No secrets in the repo; `.env` is git-ignored.
