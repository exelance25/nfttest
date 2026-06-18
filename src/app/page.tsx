"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { AklnNftCard } from "@/components/AklnNftCard";
import type { NftCollectionId } from "@/config/collections";

export default function HomePage() {
  const [pendingMint, setPendingMint] = useState<NftCollectionId | null>(null);

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-14">
        <header className="text-center">
          <div className="flex justify-center">
            <ConnectButton
              accountStatus="address"
              chainStatus="icon"
              showBalance={false}
            />
          </div>
          <p className="mt-6 text-sm uppercase tracking-[0.35em] text-violet-400">AKLN</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Test NFT</h1>
          <p className="mx-auto mt-4 max-w-lg text-white/60">
            Cuzdan bagla (MetaMask, Rabby veya Phantom) — NFT&apos;ye tiklayin, ag otomatik degisir,
            mint onaylayin.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <AklnNftCard
            collectionId="monad"
            pendingMint={pendingMint}
            onPendingMint={setPendingMint}
          />
          <AklnNftCard
            collectionId="base"
            pendingMint={pendingMint}
            onPendingMint={setPendingMint}
          />
        </div>
      </div>
    </main>
  );
}
