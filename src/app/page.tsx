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
              label="Cuzdan Bagla"
            />
          </div>
          <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl">NFT</h1>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Her iki agda NFT fiyati{" "}
            <span className="text-white/90">0.0001 ETH</span>. Monad&apos;da odeme{" "}
            <span className="text-white/90">MON degil ETH</span> ile yapilir (WETH). Gas
            ucreti icin cuzdanda az MON kalir. MetaMask veya Rabby ile baglanin.
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
