import type { Address } from "viem";
import { parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import { env } from "@/config/env";
import { monadTestnet } from "@/lib/wagmi";

/** 0.0001 native token per mint */
export const NFT_MINT_PRICE = parseEther("0.0001");

export const NFT_MAX_SUPPLY = 200n;

export const NFT_TREASURY = "0x1491baEd4db010D8F8B54cED442aF3326ed2c77a" as const;

export type NftCollectionId = "monad" | "base";

export type NftCollectionConfig = {
  id: NftCollectionId;
  label: string;
  name: string;
  symbol: string;
  chainId: number;
  chainName: string;
  nativeSymbol: string;
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
    label: "AKLN Monad",
    name: "AKLN Monad",
    symbol: "AKLN-M",
    chainId: monadTestnet.id,
    chainName: "Monad Testnet",
    nativeSymbol: "MON",
    explorerBaseUrl: "https://testnet.monadvision.com",
    contractAddress: parseAddress(env.NEXT_PUBLIC_MONAD_NFT_ADDRESS),
    metadataApiPath: "/api/nft/metadata/monad",
  },
  base: {
    id: "base",
    label: "AKLN Base",
    name: "AKLN Base",
    symbol: "AKLN-B",
    chainId: baseSepolia.id,
    chainName: "Base Sepolia",
    nativeSymbol: "ETH",
    explorerBaseUrl: "https://sepolia.basescan.org",
    contractAddress: parseAddress(env.NEXT_PUBLIC_BASE_NFT_ADDRESS),
    metadataApiPath: "/api/nft/metadata/base",
  },
};

export const NFT_COLLECTION_IDS: NftCollectionId[] = ["monad", "base"];
