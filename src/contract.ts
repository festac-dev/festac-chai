import { parseAbi } from "viem";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;
export const DEPLOY_BLOCK = BigInt((import.meta.env.VITE_DEPLOY_BLOCK as string) || "0");
export const TOKEN_DECIMALS = 18;

/**
 * !! REPLACE with the reference contract's real ABI from the event page. !!
 * The names below are an assumed shape; adapt the functions/events used in
 * hooks.ts (getMarket, marketCount, claim, Staked, Claimed) to match the real ABI.
 */
export const marketAbi = [
  ...parseAbi([
    "function marketCount() view returns (uint256)",
    "function claim(uint256 marketId)",
    "event Staked(uint256 indexed marketId, address indexed user, uint256 outcome, uint256 amount)",
    "event Claimed(uint256 indexed marketId, address indexed user, uint256 amount)",
  ]),
  {
    type: "function", name: "getMarket", stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{
      name: "m", type: "tuple",
      components: [
        { name: "question", type: "string" },
        { name: "closeTime", type: "uint256" },
        { name: "resolved", type: "bool" },
        { name: "winningOutcome", type: "uint256" },
      ],
    }],
  },
] as const;
