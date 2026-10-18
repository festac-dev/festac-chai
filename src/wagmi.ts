import { createConfig, http, fallback } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Several public RPCs: if one drops on bad Wi-Fi, viem retries on the next.
const rpcs = [import.meta.env.VITE_RPC_URL as string | undefined, "https://sepolia.base.org", "https://base-sepolia-rpc.publicnode.com"]
  .filter((u): u is string => !!u)
  .map((u) => http(u, { retryCount: 3, retryDelay: 800, timeout: 10_000 }));

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: { [baseSepolia.id]: fallback(rpcs) },
});
