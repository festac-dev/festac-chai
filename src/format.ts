import { formatUnits } from "viem";
import { TOKEN_DECIMALS } from "./contract";

/** All amounts are bigint base units; display only via formatUnits (no floats). */
export function fmtAmount(v: bigint): string {
  const s = formatUnits(v, TOKEN_DECIMALS);
  const [whole, frac = ""] = s.split(".");
  const trimmed = frac.slice(0, 4).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

/** Signed P&L, computed in bigint before formatting. */
export function fmtPnl(v: bigint): string {
  return (v > 0n ? "+" : "") + fmtAmount(v);
}

/** Countdown using bigint seconds only. */
export function timeLeft(closeTime: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  let d = closeTime - now;
  if (d <= 0n) return "closed";
  const days = d / 86400n; d %= 86400n;
  const hrs = d / 3600n; d %= 3600n;
  const mins = d / 60n;
  return days > 0n ? `${days}d ${hrs}h left` : `${hrs}h ${mins}m left`;
}
