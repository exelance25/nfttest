import { connectorsForWallets, getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  metaMaskWallet,
  rabbyWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http } from "wagmi";
import { createConfig } from "wagmi";
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

const transports = {
  [monadTestnet.id]: http(env.NEXT_PUBLIC_MONAD_TESTNET_RPC),
  [baseSepolia.id]: http(env.NEXT_PUBLIC_BASE_SEPOLIA_RPC),
} as const;

/** Localhost: Reown allowlist gerekmez — tarayici cuzdani (MetaMask vb.) */
const useInjectedWalletsOnly = process.env.NODE_ENV === "development";

export const wagmiConfig = useInjectedWalletsOnly
  ? createConfig({
      chains: aklnChains,
      connectors: connectorsForWallets(
        [
          {
            groupName: "Recommended",
            wallets: [metaMaskWallet, rabbyWallet, coinbaseWallet],
          },
        ],
        { appName: APP_NAME, projectId },
      ),
      transports,
      ssr: true,
    })
  : getDefaultConfig({
      appName: APP_NAME,
      projectId,
      chains: aklnChains,
      transports,
      ssr: true,
    });
