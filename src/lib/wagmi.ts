import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet, rabbyWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { baseSepolia } from "viem/chains";
import { defineChain } from "viem";
import { env } from "@/config/env";

export const APP_NAME = "NFT";

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

export const nftChains = [monadTestnet, baseSepolia] as const;

const projectId =
  env.NEXT_PUBLIC_WC_PROJECT_ID.trim() || "00000000000000000000000000000000";

const transports = {
  [monadTestnet.id]: http(env.NEXT_PUBLIC_MONAD_TESTNET_RPC),
  [baseSepolia.id]: http(env.NEXT_PUBLIC_BASE_SEPOLIA_RPC),
} as const;

/** MetaMask ve Rabby — kullanici secim yapabilsin */
export const wagmiConfig = createConfig({
  chains: nftChains,
  connectors: connectorsForWallets(
    [
      {
        groupName: "Cuzdan",
        wallets: [metaMaskWallet, rabbyWallet],
      },
    ],
    { appName: APP_NAME, projectId },
  ),
  transports,
  ssr: true,
});

/** @deprecated use nftChains */
export const aklnChains = nftChains;
