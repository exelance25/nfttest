"use client";

import Image from "next/image";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useAklnMint } from "@/hooks/useAklnMint";
import { type NftCollectionId } from "@/config/collections";

const CARD_META: Record<
  NftCollectionId,
  { image: string; imageAlt: string; ring: string; glow: string }
> = {
  monad: {
    image: "/nft/monad/image.svg",
    imageAlt: "Monad logo NFT",
    ring: "ring-violet-500/40 hover:ring-violet-400",
    glow: "shadow-violet-500/20 hover:shadow-violet-500/40",
  },
  base: {
    image: "/nft/base/image.svg",
    imageAlt: "Base logo NFT",
    ring: "ring-blue-500/40 hover:ring-blue-400",
    glow: "shadow-blue-500/20 hover:shadow-blue-500/40",
  },
};

type AklnNftCardProps = {
  collectionId: NftCollectionId;
  pendingMint: NftCollectionId | null;
  onPendingMint: (id: NftCollectionId | null) => void;
};

export function AklnNftCard({ collectionId, pendingMint, onPendingMint }: AklnNftCardProps) {
  const meta = CARD_META[collectionId];
  const { openConnectModal } = useConnectModal();
  const {
    collection,
    contractAddress,
    isConnected,
    onCorrectChain,
    mintPriceFormatted,
    ethBalanceFormatted,
    totalMinted,
    maxSupply,
    soldOut,
    isSwitching,
    isWriting,
    isConfirming,
    txHash,
    statusMessage,
    mint,
  } = useAklnMint(collectionId);

  const [error, setError] = useState<string | null>(null);
  const busy = isSwitching || isWriting || isConfirming;
  const unavailable = !contractAddress || soldOut;

  async function runMint() {
    setError(null);
    try {
      await mint();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mint basarisiz.");
    }
  }

  async function handleClick() {
    if (unavailable || busy) return;

    if (!isConnected) {
      onPendingMint(collectionId);
      openConnectModal?.();
      return;
    }

    await runMint();
  }

  useEffect(() => {
    if (!isConnected || pendingMint !== collectionId || unavailable || busy) return;
    onPendingMint(null);
    const timer = window.setTimeout(() => {
      void runMint();
    }, 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pending mint once after connect
  }, [isConnected, pendingMint, collectionId, unavailable, busy]);

  const explorerTx = txHash ? `${collection.explorerBaseUrl}/tx/${txHash}` : null;

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={unavailable || busy}
      className={`group relative flex w-full flex-col overflow-hidden rounded-3xl bg-[#0B1018] text-left ring-2 transition ${meta.ring} shadow-xl ${meta.glow} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black/30">
        <Image
          src={meta.image}
          alt={meta.imageAlt}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02] group-disabled:scale-100"
          priority
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-16">
          <p className="text-lg font-semibold text-white">{collection.name}</p>
          <p className="text-sm text-white/70">{collection.chainName}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Fiyat</span>
          <span className="font-mono font-medium text-white">
            {mintPriceFormatted} {collection.paymentSymbol}
          </span>
        </div>
        <p className="text-xs text-white/50">{collection.paymentNote}</p>
        {ethBalanceFormatted !== null && isConnected ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Cuzdan ETH</span>
            <span className="font-mono text-violet-200">{ethBalanceFormatted} ETH</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Stok</span>
          <span className="text-emerald-300">
            {Number(totalMinted)} / {Number(maxSupply)}
          </span>
        </div>
        <p className="pt-1 text-center text-sm font-medium text-white/80 group-hover:text-white">
          {soldOut
            ? "Tukendi"
            : busy
              ? isSwitching || (isConnected && !onCorrectChain)
                ? `${collection.chainName} agina geciliyor...`
                : "Cuzdan onayi bekleniyor..."
              : !contractAddress
                ? collectionId === "base"
                  ? "Base kontrati henuz deploy edilmedi"
                  : "Kontrat adresi eksik"
                : isConnected && !onCorrectChain
                  ? `Tikla — ${collection.chainName} agina gec + mint`
                  : collectionId === "monad"
                    ? "Tikla — 0.0001 ETH ile mint (MON degil)"
                    : "NFT'ye tikla — 0.0001 ETH ile mint"}
        </p>
        {statusMessage && contractAddress ? (
          <p className="text-center text-xs text-emerald-300">{statusMessage}</p>
        ) : null}
        {error ? <p className="text-center text-xs text-red-300">{error}</p> : null}
        {explorerTx ? (
          <a
            href={explorerTx}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-center text-xs text-sky-300 underline"
          >
            Explorer
          </a>
        ) : null}
      </div>
    </button>
  );
}
