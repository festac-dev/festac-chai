import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { CONTRACT_ADDRESS, marketAbi } from "./contract";
import type { Market } from "./hooks";

export function ClaimButton({ market }: { market: Market }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchAccountChain();
  const qc = useQueryClient();
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash, chainId: baseSepolia.id });

  const confirmed = receipt.isSuccess && receipt.data?.status === "success";
  const reverted = receipt.isSuccess && receipt.data?.status !== "success";
  useEffect(() => { if (confirmed) qc.invalidateQueries({ queryKey: ["positions"] }); }, [confirmed, qc]);

  // Claim only rendered when chain state says the market is resolved.
  if (!market.resolved) return null;
  if (!isConnected) return null;

  if (chainId !== baseSepolia.id)
    return <button className="btn warn" onClick={() => switchChain({ chainId: baseSepolia.id })}>Switch to Base Sepolia to claim</button>;

  if (confirmed) return <p className="ok">✓ Winnings claimed</p>;

  const busy = isPending || (!!hash && receipt.isLoading);
  return (
    <div>
      <button
        className="btn"
        disabled={busy || chainId !== baseSepolia.id}
        onClick={() => { reset(); writeContract({ address: CONTRACT_ADDRESS, abi: marketAbi, functionName: "claim", args: [market.id], chainId: baseSepolia.id }); }}
      >
        {isPending ? "Confirm in wallet…" : busy ? "Waiting for confirmation…" : "Claim winnings"}
      </button>
      {(reverted || receipt.isError || writeError) && <p className="err">Claim failed. {writeError ? writeError.message.split("\n")[0] : "Transaction did not succeed."} Try again.</p>}
    </div>
  );
}

function useSwitchAccountChain() { return useSwitchChain(); }
