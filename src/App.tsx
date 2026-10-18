import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useMarkets, usePositions } from "./hooks";
import { ClaimButton } from "./ClaimButton";
import { fmtAmount, fmtPnl, timeLeft } from "./format";

function Wallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  if (isConnected && address)
    return <button className="btn ghost" onClick={() => disconnect()}>{address.slice(0, 6)}…{address.slice(-4)} · Disconnect</button>;
  return <button className="btn" disabled={isPending} onClick={() => connect({ connector: connectors[0] })}>{isPending ? "Connecting…" : "Connect wallet"}</button>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2>{title}</h2>{children}</section>;
}

function ErrorBox({ what, onRetry }: { what: string; onRetry: () => void }) {
  return <div className="errbox" role="alert">Couldn't load {what}. Your connection may have dropped. <button className="btn" onClick={onRetry}>Retry</button></div>;
}

export default function App() {
  const { address } = useAccount();
  const m = useMarkets();
  const p = usePositions(address);
  const byId = new Map(m.markets.map((x) => [x.id, x]));
  const open = m.markets.filter((x) => !x.resolved && timeLeft(x.closeTime) !== "closed");

  return (
    <main>
      <header><h1>☕ Chai-Stall Terminal</h1><Wallet /></header>
      <p className="note">Play tokens only · Base Sepolia</p>

      <Block title="Open markets">
        {m.isLoading && <p>Loading markets…</p>}
        {m.isError && <ErrorBox what="markets" onRetry={m.refetch} />}
        {!m.isLoading && !m.isError && open.length === 0 && <p>No markets are open right now.</p>}
        {open.map((x) => (
          <div className="card" key={String(x.id)}><strong>{x.question}</strong><span>{timeLeft(x.closeTime)}</span></div>
        ))}
      </Block>

      <Block title="My positions">
        {!address && <p>Connect your wallet to see what you hold.</p>}
        {address && p.isLoading && <p>Loading your positions…</p>}
        {address && p.isError && <ErrorBox what="your positions" onRetry={() => p.refetch()} />}
        {address && p.data?.length === 0 && <p>You have no positions yet.</p>}
        {p.data?.map((pos) => {
          const mk = byId.get(pos.marketId);
          const won = !!mk?.resolved && (pos.stakes.get(mk.winningOutcome) ?? 0n) > 0n;
          const pnl = pos.claimed - pos.staked; // bigint arithmetic
          const needsClaim = won && pos.claimed === 0n;
          return (
            <div className="card col" key={String(pos.marketId)}>
              <strong>{mk?.question ?? `Market #${pos.marketId}`}</strong>
              <span>Staked: {fmtAmount(pos.staked)}</span>
              {mk?.resolved && <span>{won ? "You won" : "You lost"} · P&L so far: {fmtPnl(pnl)}</span>}
              {mk && needsClaim && <ClaimButton market={mk} />}
              {won && pos.claimed > 0n && <span className="ok">Claimed {fmtAmount(pos.claimed)}</span>}
            </div>
          );
        })}
      </Block>
    </main>
  );
}
