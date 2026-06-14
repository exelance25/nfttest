import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { baseSepolia } from "viem/chains";
import { defineChain } from "viem";
import { env } from "@/config/env";

export const APP_NAME = "AKLN";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [env.NEXT_PUBLIC_MONAD_TESTNET_RPC] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadvision.com" },
  },
  testnet: true,
});

export const aklnChains = [monadTestnet, baseSepolia] as const;

const projectId =
  env.NEXT_PUBLIC_WC_PROJECT_ID.trim() || "00000000000000000000000000000000";

export const wagmiConfig = getDefaultConfig({
  appName: APP_NAME,
  projectId,
  chains: aklnChains,
  transports: {
    [monadTestnet.id]: http(env.NEXT_PUBLIC_MONAD_TESTNET_RPC),
    [baseSepolia.id]: http(env.NEXT_PUBLIC_BASE_SEPOLIA_RPC),
  },
  ssr: true,
});
