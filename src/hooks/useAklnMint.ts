"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatEther, maxUint256 } from "viem";
import {
  NFT_COLLECTIONS,
  NFT_MINT_PRICE,
  type NftCollectionId,
} from "@/config/collections";
import { getChainId } from "@wagmi/core";
import { ensureChain } from "@/lib/ensure-chain";
import { erc20Abi } from "@/lib/erc20-abi";
import { wagmiConfig } from "@/lib/wagmi";
import { testNetworkNftAbi } from "@/lib/test-nft-abi";

function formatMintError(err: unknown, chainName: string, paymentSymbol: string): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("user denied")) {
    return "Islem cuzdanda iptal edildi.";
  }
  if (
    lower.includes("insufficient funds") ||
    lower.includes("insufficient balance") ||
    lower.includes("transfer amount exceeds balance")
  ) {
    if (paymentSymbol === "ETH" && chainName.includes("Monad")) {
      return "Yetersiz ETH. Monad mint MON ile degil ETH (WETH) ile odeme yapar — cuzdaninizda ETH/WETH olmali.";
    }
    return `Yetersiz ${paymentSymbol}. ${chainName} uzerinde ${paymentSymbol} gerekli.`;
  }
  if (lower.includes("allowance") || lower.includes("erc20")) {
    return `${paymentSymbol} onayi gerekli — tekrar deneyin.`;
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
  const usesErc20 = collection.paymentKind === "erc20" && collection.paymentToken;

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

  const mintPrice = priceQuery.data ?? NFT_MINT_PRICE;

  const allowanceQuery = useReadContract({
    address: usesErc20 ? collection.paymentToken! : undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && contractAddress ? [address, contractAddress] : undefined,
    chainId: collection.chainId,
    query: {
      enabled: Boolean(usesErc20 && address && contractAddress),
    },
  });

  const wethBalanceQuery = useReadContract({
    address: usesErc20 ? collection.paymentToken! : undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: collection.chainId,
    query: {
      enabled: Boolean(usesErc20 && address),
    },
  });

  const { writeContractAsync, isPending: isWriting, data: txHash, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: collection.chainId });
  const [isSwitching, setIsSwitching] = useState(false);

  const totalMinted = supplyQuery.data ?? 0n;
  const maxSupply = maxSupplyQuery.data ?? 200n;
  const soldOut = totalMinted >= maxSupply;

  const mint = useCallback(async () => {
    if (!contractAddress) {
      throw new Error("Kontrat adresi tanimli degil — yeni kontrat deploy edilmeli.");
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

      if (usesErc20 && collection.paymentToken) {
        const allowance = allowanceQuery.data ?? 0n;
        if (allowance < mintPrice) {
          await writeContractAsync({
            address: collection.paymentToken,
            abi: erc20Abi,
            functionName: "approve",
            args: [contractAddress, maxUint256],
            chainId: collection.chainId,
            account: address,
          });
        }
        await writeContractAsync({
          address: contractAddress,
          abi: testNetworkNftAbi,
          functionName: "mint",
          chainId: collection.chainId,
          account: address,
          value: 0n,
        });
      } else {
        await writeContractAsync({
          address: contractAddress,
          abi: testNetworkNftAbi,
          functionName: "mint",
          chainId: collection.chainId,
          account: address,
          value: mintPrice,
        });
      }
    } catch (err) {
      throw new Error(formatMintError(err, collection.chainName, collection.paymentSymbol));
    } finally {
      setIsSwitching(false);
    }
  }, [
    address,
    allowanceQuery.data,
    collection.chainId,
    collection.chainName,
    collection.paymentSymbol,
    collection.paymentToken,
    contractAddress,
    isConnected,
    mintPrice,
    reset,
    usesErc20,
    writeContractAsync,
  ]);

  const statusMessage = useMemo(() => {
    if (!contractAddress) return "Yeni kontrat deploy edilmeli (ETH odemeli).";
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
    ethBalanceFormatted: usesErc20
      ? formatEther(wethBalanceQuery.data ?? 0n)
      : null,
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
