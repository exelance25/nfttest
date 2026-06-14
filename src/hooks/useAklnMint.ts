"use client";

import { useCallback, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatEther } from "viem";
import {
  NFT_COLLECTIONS,
  NFT_MINT_PRICE,
  type NftCollectionId,
} from "@/config/collections";
import { testNetworkNftAbi } from "@/lib/test-nft-abi";

export function useAklnMint(collectionId: NftCollectionId) {
  const collection = NFT_COLLECTIONS[collectionId];
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

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
  const receipt = useWaitForTransactionReceipt({ hash: txHash });

  const mintPrice = priceQuery.data ?? NFT_MINT_PRICE;
  const totalMinted = supplyQuery.data ?? 0n;
  const maxSupply = maxSupplyQuery.data ?? 200n;
  const soldOut = totalMinted >= maxSupply;

  const switchToCollectionChain = useCallback(async () => {
    await switchChainAsync({ chainId: collection.chainId });
  }, [collection.chainId, switchChainAsync]);

  const mint = useCallback(async () => {
    if (!contractAddress) {
      throw new Error("Kontrat adresi tanimli degil — .env.local dosyasini kontrol edin.");
    }
    if (!isConnected || !address) {
      throw new Error("Once cuzdan baglayin.");
    }
    if (!onCorrectChain) {
      await switchToCollectionChain();
    }

    reset();
    await writeContractAsync({
      address: contractAddress,
      abi: testNetworkNftAbi,
      functionName: "mint",
      chainId: collection.chainId,
      value: mintPrice,
    });
  }, [
    address,
    collection.chainId,
    contractAddress,
    isConnected,
    mintPrice,
    onCorrectChain,
    reset,
    switchToCollectionChain,
    writeContractAsync,
  ]);

  const statusMessage = useMemo(() => {
    if (!contractAddress) return "Kontrat henuz deploy edilmedi.";
    if (soldOut) return "Tum 200 NFT mint edildi.";
    if (receipt.isSuccess) return "Mint basarili!";
    if (receipt.isError) return "Islem basarisiz — explorer'dan kontrol edin.";
    if (receipt.isLoading || isWriting) return "Cuzdan onayi bekleniyor...";
    if (isSwitching) return "Ag degistiriliyor...";
    return null;
  }, [contractAddress, isSwitching, isWriting, receipt.isError, receipt.isLoading, receipt.isSuccess, soldOut]);

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
    switchToCollectionChain,
    mint,
    refetchSupply: supplyQuery.refetch,
  };
}
