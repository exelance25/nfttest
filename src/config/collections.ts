import type { Address } from "viem";
import { parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import { env } from "@/config/env";
import { monadTestnet, type NftChainId } from "@/lib/wagmi";

/** 0.0001 ETH per mint on both networks */
export const NFT_MINT_PRICE = parseEther("0.0001");

export const NFT_MAX_SUPPLY = 200n;

export const NFT_TREASURY = "0x1491baEd4db010D8F8B54cED442aF3326ed2c77a" as const;

/** Bridged ETH on Monad Testnet — cuzdanda gorunen ETH bu token */
export const MONAD_ETH_ADDRESS =
  "0x05a816Ef3330924F0A70b040A656E80D3D03363C" as const;

export type NftCollectionId = "monad" | "base";

export type PaymentKind = "native" | "erc20";

export type NftCollectionConfig = {
  id: NftCollectionId;
  label: string;
  name: string;
  symbol: string;
  chainId: NftChainId;
  chainName: string;
  /** User-facing payment symbol — always ETH (never MON on Monad) */
  paymentSymbol: string;
  /** Short note shown on the card */
  paymentNote: string;
  paymentKind: PaymentKind;
  /** ERC20 ETH token on Monad; null = native ETH (Base) */
  paymentToken: Address | null;
  explorerBaseUrl: string;
  contractAddress: Address | null;
  metadataApiPath: string;
};

function parseAddress(value: string | undefined): Address | null {
  const trimmed = value?.trim();
  if (!trimmed?.startsWith("0x") || trimmed.length !== 42) return null;
  return trimmed as Address;
}

export const NFT_COLLECTIONS: Record<NftCollectionId, NftCollectionConfig> = {
  monad: {
    id: "monad",
    label: "NFT Monad",
    name: "NFT Monad",
    symbol: "NFT-M",
    chainId: monadTestnet.id,
    chainName: "Monad Testnet",
    paymentSymbol: "ETH",
    paymentNote: "MON degil — ETH ile odeme",
    paymentKind: "erc20",
    paymentToken: parseAddress(env.NEXT_PUBLIC_MONAD_ETH_ADDRESS) ?? MONAD_ETH_ADDRESS,
    explorerBaseUrl: "https://testnet.monadvision.com",
    contractAddress: parseAddress(env.NEXT_PUBLIC_MONAD_NFT_ADDRESS),
    metadataApiPath: "/api/nft/metadata/monad",
  },
  base: {
    id: "base",
    label: "NFT Base",
    name: "NFT Base",
    symbol: "NFT-B",
    chainId: baseSepolia.id,
    chainName: "Base Sepolia",
    paymentSymbol: "ETH",
    paymentNote: "Native ETH ile odeme",
    paymentKind: "native",
    paymentToken: null,
    explorerBaseUrl: "https://sepolia.basescan.org",
    contractAddress: parseAddress(env.NEXT_PUBLIC_BASE_NFT_ADDRESS),
    metadataApiPath: "/api/nft/metadata/base",
  },
};

export const NFT_COLLECTION_IDS: NftCollectionId[] = ["monad", "base"];
