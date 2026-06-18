"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatEther } from "viem";
import {
  NFT_COLLECTIONS,
  NFT_MINT_PRICE,
  type NftCollectionId,
} from "@/config/collections";
import { getChainId } from "@wagmi/core";
import { ensureChain } from "@/lib/ensure-chain";
import { wagmiConfig } from "@/lib/wagmi";
import { testNetworkNftAbi } from "@/lib/test-nft-abi";

function formatMintError(err: unknown, chainName: string, nativeSymbol: string): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied")) {
    return "Islem cuzdanda iptal edildi.";
  }
  if (lower.includes("insufficient funds") || lower.includes("insufficient balance")) {
    return `Yetersiz ${nativeSymbol}. ${chainName} test token alin (faucet).`;
  }
  if (lower.includes("chain") || lower.includes("network")) {
    return `${chainName} agina gecin ve tekrar deneyin.`;
  }
  return message || "Mint basarisiz.";
}

export function useAklnMint(collectionId: NftCollectionId) {
  const collection = NFT_COLLECTIONS[collectionId];
  const { address, chainId, isConnected } = useAccount();

  const contractAddress = collection.contractAddress;
  const onCorrectChain = chainId === collection.chainId;

  const supplyQuery = useReadContract({
    address: contractAddress ?? undefined,
    abi: testNetworkNftAbi,
    functionName: "totalMinted",
    chainId: collection.chainId,
    query: { enabled: Boolean(contractAddress) },
  });

  const maxSupplyQuery = useReadContract({
    address: contractAddress ?? undefined,
    abi: testNetworkNftAbi,
    functionName: "maxSupply",
    chainId: collection.chainId,
    query: { enabled: Boolean(contractAddress) },
  });

  const priceQuery = useReadContract({
    address: contractAddress ?? undefined,
    abi: testNetworkNftAbi,
    functionName: "mintPrice",
    chainId: collection.chainId,
    query: { enabled: Boolean(contractAddress) },
  });

  const { writeContractAsync, isPending: isWriting, data: txHash, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: collection.chainId });
  const [isSwitching, setIsSwitching] = useState(false);

  const mintPrice = priceQuery.data ?? NFT_MINT_PRICE;
  const totalMinted = supplyQuery.data ?? 0n;
  const maxSupply = maxSupplyQuery.data ?? 200n;
  const soldOut = totalMinted >= maxSupply;

  const mint = useCallback(async () => {
    if (!contractAddress) {
      throw new Error("Kontrat adresi tanimli degil — .env.local dosyasini kontrol edin.");
    }
    if (!isConnected || !address) {
      throw new Error("Once cuzdan baglayin.");
    }

    try {
      if (getChainId(wagmiConfig) !== collection.chainId) {
        setIsSwitching(true);
      }
      await ensureChain(collection.chainId, collection.chainName);
      reset();
      await writeContractAsync({
        address: contractAddress,
        abi: testNetworkNftAbi,
        functionName: "mint",
        chainId: collection.chainId,
        account: address,
        value: mintPrice,
      });
    } catch (err) {
      throw new Error(formatMintError(err, collection.chainName, collection.nativeSymbol));
    } finally {
      setIsSwitching(false);
    }
  }, [
    address,
    collection.chainId,
    collection.chainName,
    collection.nativeSymbol,
    contractAddress,
    isConnected,
    mintPrice,
    reset,
    writeContractAsync,
  ]);

  const statusMessage = useMemo(() => {
    if (!contractAddress) return "Kontrat henuz deploy edilmedi.";
    if (soldOut) return "Tum 200 NFT mint edildi.";
    if (receipt.isSuccess) return "Mint basarili!";
    if (receipt.isError) return "Islem basarisiz — explorer'dan kontrol edin.";
    if (receipt.isLoading || isWriting) return "Cuzdan onayi bekleniyor...";
    if (isSwitching) return `${collection.chainName} agina geciliyor...`;
    return null;
  }, [
    collection.chainName,
    contractAddress,
    isSwitching,
    isWriting,
    receipt.isError,
    receipt.isLoading,
    receipt.isSuccess,
    soldOut,
  ]);

  return {
    collection,
    contractAddress,
    isConnected,
    onCorrectChain,
    mintPrice,
    mintPriceFormatted: formatEther(mintPrice),
    totalMinted,
    maxSupply,
    soldOut,
    isSwitching,
    isWriting,
    isConfirming: receipt.isLoading,
    txHash,
    statusMessage,
    mint,
    refetchSupply: supplyQuery.refetch,
  };
}
