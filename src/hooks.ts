import { useQuery } from "@tanstack/react-query";
import { useReadContract, useReadContracts, usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { baseSepolia } from "wagmi/chains";
import { CONTRACT_ADDRESS, DEPLOY_BLOCK, marketAbi } from "./contract";

export type Market = { id: bigint; question: string; closeTime: bigint; resolved: boolean; winningOutcome: bigint };

/** Reads every market from the configured contract; open = not resolved and not past close. */
export function useMarkets() {
  const count = useReadContract({ address: CONTRACT_ADDRESS, abi: marketAbi, functionName: "marketCount", chainId: baseSepolia.id });
  const n = count.data ?? 0n;
  const ids = Array.from({ length: Number(n) }, (_, i) => BigInt(i)); // index count only, not an amount
  const reads = useReadContracts({
    contracts: ids.map((id) => ({ address: CONTRACT_ADDRESS, abi: marketAbi, functionName: "getMarket" as const, args: [id] as const, chainId: baseSepolia.id })),
    query: { enabled: count.isSuccess && ids.length > 0 },
  });
  const markets: Market[] = (reads.data ?? []).flatMap((r, i) =>
    r.status === "success" ? [{ id: ids[i], ...(r.result as Omit<Market, "id">) }] : [],
  );
  return {
    markets,
    isLoading: count.isLoading || reads.isLoading,
    isError: count.isError || reads.isError,
    refetch: () => { count.refetch(); reads.refetch(); },
  };
}

const stakedEvent = parseAbiItem("event Staked(uint256 indexed marketId, address indexed user, uint256 outcome, uint256 amount)");
const claimedEvent = parseAbiItem("event Claimed(uint256 indexed marketId, address indexed user, uint256 amount)");

export type Position = { marketId: bigint; stakes: Map<bigint, bigint>; staked: bigint; claimed: bigint };

/** One indexed-event query filtered by the connected user's address (no per-market scan). */
export function usePositions(user?: `0x${string}`) {
  const client = usePublicClient({ chainId: baseSepolia.id });
  return useQuery({
    queryKey: ["positions", user],
    enabled: !!user && !!client,
    retry: 3,
    queryFn: async () => {
      const [stakes, claims] = await Promise.all([
        client!.getLogs({ address: CONTRACT_ADDRESS, event: stakedEvent, args: { user }, fromBlock: DEPLOY_BLOCK, toBlock: "latest" }),
        client!.getLogs({ address: CONTRACT_ADDRESS, event: claimedEvent, args: { user }, fromBlock: DEPLOY_BLOCK, toBlock: "latest" }),
      ]);
      const byMarket = new Map<bigint, Position>();
      const get = (id: bigint) => {
        let p = byMarket.get(id);
        if (!p) { p = { marketId: id, stakes: new Map(), staked: 0n, claimed: 0n }; byMarket.set(id, p); }
        return p;
      };
      for (const l of stakes) {
        const p = get(l.args.marketId!);
        const o = l.args.outcome!, a = l.args.amount!;
        p.stakes.set(o, (p.stakes.get(o) ?? 0n) + a);
        p.staked += a;
      }
      for (const l of claims) get(l.args.marketId!).claimed += l.args.amount!;
      return [...byMarket.values()];
    },
  });
}
