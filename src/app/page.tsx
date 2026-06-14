"use client";

import { useState } from "react";
import { AklnNftCard } from "@/components/AklnNftCard";
import type { NftCollectionId } from "@/config/collections";

export default function HomePage() {
  const [pendingMint, setPendingMint] = useState<NftCollectionId | null>(null);

  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-14">
        <header className="text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-violet-400">AKLN</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Test NFT</h1>
          <p className="mx-auto mt-4 max-w-lg text-white/60">
            NFT&apos;ye tiklayin — cuzdan baglanir, onaylarsiniz, NFT size gelir. Odeme aninda kasaya
            gider.
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
